const { Op } = require("sequelize");

const Horario = require("../models/Horario");
const Barbero = require("../models/Barbero");


function aMinutos(horaStr) {
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
}

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];


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

        const existentes = await Horario.findAll({
            where: { barberoId, fecha: { [Op.in]: fechasSemana } },
        });

        const porFecha = {};
        existentes.forEach((h) => { porFecha[h.fecha] = h; });

        const dias = fechasSemana.map((fecha, i) => {
            const existente = porFecha[fecha];

            if (existente) {
                return {
                    dia: DIAS_SEMANA[i],
                    fecha,
                    horaInicio: existente.horaInicio ? existente.horaInicio.slice(0, 5) : "",
                    horaFin: existente.horaFin ? existente.horaFin.slice(0, 5) : "",
                    estado: existente.estado,
                };
            }

            return {
                dia: DIAS_SEMANA[i],
                fecha,
                horaInicio: "08:00",
                horaFin: "18:00",
                estado: "Activo",
            };
        });

        return {
            barbero: { id: barbero.id, nombre: barbero.nombre },
            semana: fechasSemana[0],
            semanaFin: fechasSemana[6],
            dias,
        };
    }

    validar(datos) {
        const { barberoId, fecha, estado, horaInicio, horaFin } = datos;

        if (!barberoId) throw new Error("Debe seleccionar un barbero.");
        if (!fecha) throw new Error("La fecha es obligatoria.");

        if ((estado || "Activo") === "Activo") {
            if (!horaInicio || !horaFin) {
                throw new Error("Debe indicar la hora de inicio y de fin del turno.");
            }

            if (aMinutos(horaInicio) >= aMinutos(horaFin)) {
                throw new Error("La hora de inicio debe ser menor que la hora de fin.");
            }
        }
    }

    
    async _verificarBarberoActivo(barberoId) {
        const barbero = await Barbero.findByPk(barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");
        if (barbero.estado !== "Activo") {
            throw new Error("No es posible asignar horarios a un barbero Inactivo.");
        }
        return barbero;
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

        return await Horario.create({
            barberoId: datos.barberoId,
            fecha: datos.fecha,
            semana: datos.semana || null,
            horaInicio: datos.estado === "Descanso" ? null : datos.horaInicio,
            horaFin: datos.estado === "Descanso" ? null : datos.horaFin,
            estado: datos.estado || "Activo",
        });
    }

   
    async crearSemana({ barberoId, semana, dias }) {
        await this._verificarBarberoActivo(barberoId);

        if (!Array.isArray(dias) || dias.length === 0) {
            throw new Error("Debe incluir al menos un día en la semana.");
        }

        const resultados = [];

        for (const dia of dias) {
            const datos = { barberoId, semana, ...dia };
            this.validar(datos);

            const existente = await this.obtenerPorBarberoYFecha(barberoId, dia.fecha);

            if (existente) {
                await existente.update({
                    semana,
                    horaInicio: dia.estado === "Descanso" ? null : dia.horaInicio,
                    horaFin: dia.estado === "Descanso" ? null : dia.horaFin,
                    estado: dia.estado || "Activo",
                });
                resultados.push(existente);
            } else {
                const creado = await Horario.create({
                    barberoId,
                    semana,
                    fecha: dia.fecha,
                    horaInicio: dia.estado === "Descanso" ? null : dia.horaInicio,
                    horaFin: dia.estado === "Descanso" ? null : dia.horaFin,
                    estado: dia.estado || "Activo",
                });
                resultados.push(creado);
            }
        }

        return resultados;
    }

    async actualizar(id, datos) {
        const horario = await Horario.findByPk(id);
        if (!horario) return null;

        await this._verificarBarberoActivo(datos.barberoId || horario.barberoId);

        this.validar({ ...horario.toJSON(), ...datos });

        await horario.update({
            ...datos,
            horaInicio: datos.estado === "Descanso" ? null : (datos.horaInicio ?? horario.horaInicio),
            horaFin: datos.estado === "Descanso" ? null : (datos.horaFin ?? horario.horaFin),
        });

        return horario;
    }

    async eliminar(id) {
        const horario = await Horario.findByPk(id);
        if (!horario) return null;

        await horario.destroy();
        return true;
    }
}

module.exports = new HorarioService();
