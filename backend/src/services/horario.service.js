const { Op } = require("sequelize");

const sequelize = require("../database/connection");
const Horario = require("../models/Horario");
const Barbero = require("../models/Barbero");
const Reserva = require("../models/Reserva");
const PlantillaHorario = require("../models/PlantillaHorario");
const Bloqueo = require("../models/Bloqueo");
const configuracionService = require("./configuracion.service");
const { bloquesDeTurno, minutosDeTurno, diaSemanaISO } = require("./jornada.service");
const { aMinutos, hoyEnZona, esFechaValida, esHoraValida, esPasado, ahoraEnZona } = require("../utils/fechaHora");

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Reservas que todavía ocupan la agenda y deben quedar dentro del turno.
const ESTADOS_ACTIVOS = ["Pendiente", "En espera", "En proceso"];

function aFechaISO(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function calcularLunes(fecha) {
    const dia = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const diferencia = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() + diferencia);
    return lunes;
}

const corta = (h) => (h ? String(h).slice(0, 5) : "");

/** Plantilla sugerida para un barbero nuevo: lunes a sábado, horario partido; domingo descanso. */
function plantillaSugerida() {
    return DIAS_SEMANA.map((dia, i) => ({
        diaSemana: i + 1,
        dia,
        estado: i === 6 ? "Descanso" : "Activo",
        horaInicio: i === 6 ? "" : "08:00",
        horaFin: i === 6 ? "" : (i === 5 ? "14:00" : "18:00"),
        pausaInicio: i >= 5 ? "" : "12:00",
        pausaFin: i >= 5 ? "" : "14:00",
    }));
}

class HorarioService {

    async obtenerTodos({ barberoId, semana, desde, hasta } = {}) {
        const where = {};

        if (barberoId) where.barberoId = barberoId;
        if (semana) where.semana = semana;
        if (desde && hasta) where.fecha = { [Op.between]: [desde, hasta] };

        return await Horario.findAll({
            where,
            include: [{ model: Barbero, as: "barbero", attributes: ["id", "nombre"] }],
            order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Horario.findByPk(id, {
            include: [{ model: Barbero, as: "barbero", attributes: ["id", "nombre"] }],
        });
    }

    async obtenerPorBarberoYFecha(barberoId, fecha) {
        return await Horario.findOne({ where: { barberoId, fecha } });
    }

    /**
     * Semana actual de un barbero, día por día: si existe una excepción para
     * la fecha se muestra; si no, se propone el turno de su plantilla.
     */
    async obtenerSemanaActual(barberoId) {
        const barbero = await Barbero.findByPk(barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");

        const hoy = new Date();
        const lunes = calcularLunes(hoy);

        const fechasSemana = [];
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(lunes);
            fecha.setDate(lunes.getDate() + i);
            fechasSemana.push(aFechaISO(fecha));
        }

        const [existentes, plantilla] = await Promise.all([
            Horario.findAll({ where: { barberoId, fecha: { [Op.in]: fechasSemana } } }),
            PlantillaHorario.findAll({ where: { barberoId } }),
        ]);

        const porFecha = {};
        existentes.forEach((h) => { porFecha[h.fecha] = h; });

        const dias = fechasSemana.map((fecha, i) => {
            const base = porFecha[fecha] || plantilla.find((p) => p.diaSemana === i + 1);

            if (base) {
                return {
                    dia: DIAS_SEMANA[i],
                    fecha,
                    horaInicio: corta(base.horaInicio),
                    horaFin: corta(base.horaFin),
                    pausaInicio: corta(base.pausaInicio),
                    pausaFin: corta(base.pausaFin),
                    estado: base.estado,
                    origen: porFecha[fecha] ? "excepcion" : "plantilla",
                };
            }

            return {
                dia: DIAS_SEMANA[i],
                fecha,
                horaInicio: "08:00",
                horaFin: "18:00",
                pausaInicio: "",
                pausaFin: "",
                estado: "Activo",
                origen: null,
            };
        });

        return {
            barbero: { id: barbero.id, nombre: barbero.nombre },
            semana: fechasSemana[0],
            semanaFin: fechasSemana[6],
            dias,
        };
    }

    /** Reglas de un turno: horas válidas y pausa (almuerzo) dentro del turno. */
    validarTurno({ estado, horaInicio, horaFin, pausaInicio, pausaFin }, etiqueta = "") {
        const prefijo = etiqueta ? `${etiqueta}: ` : "";

        if ((estado || "Activo") !== "Activo") return;

        if (!horaInicio || !horaFin) {
            throw new Error(`${prefijo}Debe indicar la hora de inicio y de fin del turno.`);
        }

        if (!esHoraValida(corta(horaInicio)) || !esHoraValida(corta(horaFin))) {
            throw new Error(`${prefijo}Las horas deben tener el formato HH:MM.`);
        }

        if (aMinutos(horaInicio) >= aMinutos(horaFin)) {
            throw new Error(`${prefijo}La hora de inicio debe ser menor que la hora de fin.`);
        }

        const tienePausa = Boolean(pausaInicio) || Boolean(pausaFin);
        if (!tienePausa) return;

        if (!pausaInicio || !pausaFin) {
            throw new Error(`${prefijo}Indique el inicio y el fin de la pausa, o deje ambos vacíos para un horario corrido.`);
        }

        const pIni = aMinutos(pausaInicio);
        const pFin = aMinutos(pausaFin);

        if (pFin <= pIni) {
            throw new Error(`${prefijo}El fin de la pausa debe ser posterior a su inicio.`);
        }

        if (pIni <= aMinutos(horaInicio) || pFin >= aMinutos(horaFin)) {
            throw new Error(`${prefijo}La pausa debe quedar dentro del turno, entre la hora de inicio y la de fin.`);
        }
    }

    validar(datos) {
        const { barberoId, fecha } = datos;

        if (!barberoId) throw new Error("Debe seleccionar un barbero.");
        if (!fecha) throw new Error("La fecha es obligatoria.");

        this.validarTurno(datos);
    }

    async _verificarBarberoActivo(barberoId) {
        const barbero = await Barbero.findByPk(barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");
        if (barbero.estado !== "Activo") {
            throw new Error("No es posible asignar horarios a un barbero Inactivo.");
        }
        return barbero;
    }

    /**
     * Impide que un cambio de turno deje reservas activas (Pendiente, En
     * espera o En proceso) por fuera de los tramos de trabajo: pasar el día
     * a Descanso, recortar la jornada, poner una pausa encima de una cita o
     * eliminar el turno. `turno` es el turno que quedaría vigente (null =
     * sin turno).
     */
    async _verificarContraTurno(barberoId, fecha, turno, transaction) {
        const reservas = await Reserva.findAll({
            where: { barberoId, fecha, estado: { [Op.in]: ESTADOS_ACTIVOS } },
            transaction,
        });

        if (reservas.length === 0) return;

        const bloques = bloquesDeTurno(turno ? { estado: "Activo", ...turno } : null);
        const quedaDescanso = !turno || turno.estado === "Descanso";

        const fuera = reservas.filter((r) => {
            if (quedaDescanso) return true;
            const inicio = aMinutos(r.hora);
            const fin = inicio + r.duracion;
            return !bloques.some((b) => inicio >= b.inicio && fin <= b.fin);
        });

        if (fuera.length > 0) {
            const horas = fuera.map((r) => String(r.hora).slice(0, 5)).join(", ");
            throw new Error(
                `No es posible modificar el turno del ${fecha}: quedarían por fuera ${fuera.length} reserva(s) activa(s) (${horas}). Reprográmelas o cancélelas primero.`
            );
        }
    }

    // Compatibilidad con la versión anterior.
    async _verificarReservasDentroDelTurno({ barberoId, fecha, ...turno }, transaction) {
        return this._verificarContraTurno(barberoId, fecha, turno, transaction);
    }

    async _turnoDePlantilla(barberoId, fecha) {
        const p = await PlantillaHorario.findOne({ where: { barberoId, diaSemana: diaSemanaISO(fecha) } });
        return p ? p.toJSON() : null;
    }

    _datosTurno(dia) {
        const descanso = dia.estado === "Descanso";
        return {
            horaInicio: descanso ? null : dia.horaInicio,
            horaFin: descanso ? null : dia.horaFin,
            pausaInicio: descanso || !dia.pausaInicio ? null : dia.pausaInicio,
            pausaFin: descanso || !dia.pausaFin ? null : dia.pausaFin,
            estado: dia.estado || "Activo",
        };
    }

    async crear(datos) {
        await this._verificarBarberoActivo(datos.barberoId);

        this.validar(datos);

        const existente = await this.obtenerPorBarberoYFecha(datos.barberoId, datos.fecha);
        if (existente) {
            throw new Error(
                "Ya existe un turno para ese barbero en esa fecha. Utilice la edición para modificarlo."
            );
        }

        await this._verificarContraTurno(datos.barberoId, datos.fecha, datos);

        return await Horario.create({
            barberoId: datos.barberoId,
            fecha: datos.fecha,
            semana: datos.semana || null,
            motivo: datos.motivo ? String(datos.motivo).slice(0, 120) : null,
            ...this._datosTurno(datos),
        });
    }

    async crearSemana({ barberoId, semana, dias }) {
        await this._verificarBarberoActivo(barberoId);

        if (!Array.isArray(dias) || dias.length === 0) {
            throw new Error("Debe incluir al menos un día en la semana.");
        }

        // Se valida todo antes de guardar: si un día no es válido, la semana
        // completa queda sin cambios.
        for (const dia of dias) {
            this.validarTurno(dia, dia.dia || dia.fecha);
            if (!dia.fecha) throw new Error("La fecha es obligatoria.");
            await this._verificarContraTurno(barberoId, dia.fecha, { ...dia, estado: dia.estado || "Activo" });
        }

        return await sequelize.transaction(async (transaction) => {
            const resultados = [];

            for (const dia of dias) {
                const existente = await Horario.findOne({ where: { barberoId, fecha: dia.fecha }, transaction });

                if (existente) {
                    await existente.update({ semana, ...this._datosTurno(dia) }, { transaction });
                    resultados.push(existente);
                } else {
                    const creado = await Horario.create({
                        barberoId,
                        semana,
                        fecha: dia.fecha,
                        ...this._datosTurno(dia),
                    }, { transaction });
                    resultados.push(creado);
                }
            }

            return resultados;
        });
    }

    async actualizar(id, datos) {
        const horario = await Horario.findByPk(id);
        if (!horario) return null;

        await this._verificarBarberoActivo(datos.barberoId || horario.barberoId);

        const combinado = { ...horario.toJSON(), ...datos };
        if (combinado.estado === "Descanso") {
            combinado.pausaInicio = null;
            combinado.pausaFin = null;
        }
        this.validar(combinado);

        await this._verificarContraTurno(horario.barberoId, horario.fecha, combinado);

        // Si se cambia el barbero o la fecha de una excepción, las reservas
        // del día original deben quedar cubiertas por su plantilla.
        if ((datos.fecha && datos.fecha !== horario.fecha) || (datos.barberoId && Number(datos.barberoId) !== horario.barberoId)) {
            await this._verificarContraTurno(horario.barberoId, horario.fecha, await this._turnoDePlantilla(horario.barberoId, horario.fecha));
        }

        await horario.update({
            ...datos,
            ...this._datosTurno(combinado),
        });

        return horario;
    }

    /**
     * Eliminar una excepción hace que el día vuelva a regirse por la
     * plantilla semanal; las reservas deben quedar dentro de ella.
     */
    async eliminar(id) {
        const horario = await Horario.findByPk(id);
        if (!horario) return null;

        const plantilla = await this._turnoDePlantilla(horario.barberoId, horario.fecha);
        await this._verificarContraTurno(horario.barberoId, horario.fecha, plantilla);

        await horario.destroy();
        return true;
    }

    // ------------------------------------------------------------------
    // Plantilla semanal
    // ------------------------------------------------------------------

    _resumenHoras(dias) {
        const minutos = dias.reduce((total, d) => total + minutosDeTurno({ ...d, estado: d.estado || "Activo" }), 0);
        return Math.round((minutos / 60) * 100) / 100;
    }

    async obtenerPlantilla(barberoId) {
        const barbero = await Barbero.findByPk(barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");

        const filas = await PlantillaHorario.findAll({ where: { barberoId }, order: [["diaSemana", "ASC"]] });
        const config = await configuracionService.obtener();

        const dias = filas.length === 0
            ? plantillaSugerida()
            : DIAS_SEMANA.map((dia, i) => {
                const f = filas.find((x) => x.diaSemana === i + 1);
                return {
                    diaSemana: i + 1,
                    dia,
                    estado: f ? f.estado : "Descanso",
                    horaInicio: corta(f?.horaInicio),
                    horaFin: corta(f?.horaFin),
                    pausaInicio: corta(f?.pausaInicio),
                    pausaFin: corta(f?.pausaFin),
                };
            });

        const horasSemanales = this._resumenHoras(dias);

        return {
            barbero: { id: barbero.id, nombre: barbero.nombre },
            configurada: filas.length > 0,
            dias,
            horasSemanales,
            horasSemanalesMaximas: config.horasSemanalesMaximas,
        };
    }

    /**
     * Guarda la plantilla semanal (7 días). Rechaza el cambio si deja por
     * fuera reservas activas futuras de días que dependen de la plantilla, y
     * advierte (sin bloquear) si la jornada supera el tope semanal legal: un
     * barbero que alquila silla no es empleado y la ley laboral no lo cubre.
     */
    async guardarPlantilla(barberoId, dias) {
        await this._verificarBarberoActivo(barberoId);

        if (!Array.isArray(dias) || dias.length !== 7) {
            throw new Error("La plantilla debe incluir los 7 días de la semana.");
        }

        const normalizados = dias.map((d, i) => {
            const diaSemana = Number(d.diaSemana || i + 1);
            if (diaSemana < 1 || diaSemana > 7) throw new Error("Día de la semana no válido.");
            const estado = d.estado === "Descanso" ? "Descanso" : "Activo";
            const dia = { ...d, diaSemana, estado };
            this.validarTurno(dia, DIAS_SEMANA[diaSemana - 1]);
            return dia;
        });

        // Reservas activas desde hoy que se rigen por la plantilla (sin excepción).
        const hoy = hoyEnZona();
        const [reservas, excepciones] = await Promise.all([
            Reserva.findAll({ where: { barberoId, fecha: { [Op.gte]: hoy }, estado: { [Op.in]: ESTADOS_ACTIVOS } } }),
            Horario.findAll({ where: { barberoId, fecha: { [Op.gte]: hoy } }, attributes: ["fecha"] }),
        ]);
        const conExcepcion = new Set(excepciones.map((e) => e.fecha));

        const afectadas = reservas.filter((r) => {
            if (conExcepcion.has(r.fecha)) return false;
            const turno = normalizados.find((d) => d.diaSemana === diaSemanaISO(r.fecha));
            const bloques = bloquesDeTurno(turno);
            const inicio = aMinutos(r.hora);
            const fin = inicio + r.duracion;
            return !bloques.some((b) => inicio >= b.inicio && fin <= b.fin);
        });

        if (afectadas.length > 0) {
            const lista = afectadas.slice(0, 5).map((r) => `${r.fecha} ${String(r.hora).slice(0, 5)}`).join(", ");
            throw new Error(
                `El cambio dejaría por fuera ${afectadas.length} reserva(s) activa(s) (${lista}${afectadas.length > 5 ? "…" : ""}). Reprográmelas o registre una excepción para esas fechas.`
            );
        }

        await sequelize.transaction(async (transaction) => {
            for (const d of normalizados) {
                const datos = { barberoId, diaSemana: d.diaSemana, ...this._datosTurno(d) };
                const existente = await PlantillaHorario.findOne({ where: { barberoId, diaSemana: d.diaSemana }, transaction });
                if (existente) await existente.update(datos, { transaction });
                else await PlantillaHorario.create(datos, { transaction });
            }
        });

        const resultado = await this.obtenerPlantilla(barberoId);
        if (resultado.horasSemanales > resultado.horasSemanalesMaximas) {
            resultado.advertencia = `La plantilla suma ${resultado.horasSemanales} horas semanales y supera el tope de ${resultado.horasSemanalesMaximas} horas de la jornada ordinaria (Ley 2101 de 2021). Si el barbero es empleado, revise su horario.`;
        }
        return resultado;
    }

    // ------------------------------------------------------------------
    // Bloqueos de tiempo
    // ------------------------------------------------------------------

    async listarBloqueos({ barberoId, desde, hasta }) {
        const where = {};
        if (barberoId) where.barberoId = barberoId;
        if (desde && hasta) where.fecha = { [Op.between]: [desde, hasta] };
        else if (desde) where.fecha = { [Op.gte]: desde };
        return await Bloqueo.findAll({
            where,
            include: [{ model: Barbero, as: "barbero", attributes: ["id", "nombre"] }],
            order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
        });
    }

    /**
     * Bloquea una franja de la jornada para que no se pueda reservar. El
     * barbero solo puede bloquear su propia agenda, y no encima de citas.
     */
    async crearBloqueo(datos, usuario) {
        const barberoId = usuario?.rol === "barbero" ? usuario.barberoId : datos.barberoId;

        if (!barberoId) throw new Error("Debe seleccionar un barbero.");
        if (!esFechaValida(datos.fecha)) throw new Error("La fecha debe tener el formato AAAA-MM-DD.");
        if (!esHoraValida(corta(datos.horaInicio)) || !esHoraValida(corta(datos.horaFin))) {
            throw new Error("Las horas deben tener el formato HH:MM.");
        }

        const inicio = aMinutos(datos.horaInicio);
        const fin = aMinutos(datos.horaFin);
        if (fin <= inicio) throw new Error("La hora de fin del bloqueo debe ser posterior a la de inicio.");

        if (esPasado(datos.fecha, corta(datos.horaFin), ahoraEnZona())) {
            throw new Error("No es posible bloquear un horario que ya pasó.");
        }

        if (datos.motivo && String(datos.motivo).length > 120) {
            throw new Error("El motivo no puede superar 120 caracteres.");
        }

        await this._verificarBarberoActivo(barberoId);

        const reservas = await Reserva.findAll({
            where: { barberoId, fecha: datos.fecha, estado: { [Op.in]: ESTADOS_ACTIVOS } },
        });

        const cruzadas = reservas.filter((r) => {
            const i = aMinutos(r.hora);
            return inicio < i + r.duracion + (r.limpieza || 0) && fin > i;
        });

        if (cruzadas.length > 0) {
            const horas = cruzadas.map((r) => String(r.hora).slice(0, 5)).join(", ");
            throw new Error(`No se puede bloquear esa franja porque hay citas a las ${horas}. Reprográmelas primero.`);
        }

        return await Bloqueo.create({
            barberoId,
            fecha: datos.fecha,
            horaInicio: datos.horaInicio,
            horaFin: datos.horaFin,
            motivo: datos.motivo ? String(datos.motivo).trim() : null,
            creadoPor: usuario?.rol === "barbero" ? "barbero" : "admin",
        });
    }

    async eliminarBloqueo(id, usuario) {
        const bloqueo = await Bloqueo.findByPk(id);
        if (!bloqueo) return null;

        if (usuario?.rol === "barbero" && bloqueo.barberoId !== usuario.barberoId) {
            const error = new Error("No tiene permisos para eliminar este bloqueo.");
            error.status = 403;
            throw error;
        }

        await bloqueo.destroy();
        return true;
    }
}

module.exports = new HorarioService();
