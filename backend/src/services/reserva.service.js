const crypto = require("crypto");
const { Op } = require("sequelize");

const sequelize = require("../database/connection");
const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const configuracionService = require("./configuracion.service");
const { obtenerJornada, obtenerJornadas } = require("./jornada.service");
const {
    aMinutos,
    aHora,
    ahoraEnZona,
    esFechaValida,
    esHoraValida,
    esPasado,
    sumarDias,
} = require("../utils/fechaHora");

const INCLUDES = [
    { model: Cliente, as: "cliente", attributes: ["id", "nombre", "telefono"] },
    { model: Barbero, as: "barbero", attributes: ["id", "nombre", "especialidad"] },
    { model: Servicio, as: "servicio", attributes: ["id", "nombre", "precio", "duracion"] },
];

/**
 * Flujo de una cita en la barbería (versión 2.1, según la práctica de
 * Booksy / AgendaPro / Fresha):
 *
 *   Pendiente (agendada) ──► En espera (el cliente llegó) ──► En proceso ──► Finalizada
 *        │                          ▲
 *        ├──────────────────────────┘ (también puede pasar directo a En proceso)
 *        └──► No asistió (solo después de la tolerancia configurada)
 *
 * "Cancelada" se asigna solo con la acción Cancelar. Nunca se retrocede.
 */
const TRANSICIONES_VALIDAS = {
    "Pendiente": ["En espera", "En proceso", "No asistió"],
    "En espera": ["En proceso"],
    "En proceso": ["Finalizada"],
    "Finalizada": [],
    "Cancelada": [],
    "No asistió": [],
};

// Las reservas canceladas o con inasistencia dejan libre el horario.
const ESTADOS_LIBERAN = ["Cancelada", "No asistió"];
const OCUPA_HORARIO = { estado: { [Op.notIn]: ESTADOS_LIBERAN } };

const MAX_DIAS_CONSULTA = 62;

const MENSAJE_CRUCE = "Ya existe una reserva en ese horario.";

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

/** Código público legible, sin caracteres ambiguos (0/O, 1/I/L). */
function generarCodigo() {
    const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(6);
    let codigo = "BR-";
    for (const b of bytes) codigo += alfabeto[b % alfabeto.length];
    return codigo;
}

/** Número entero AAAAMMDD, usado como clave del bloqueo transaccional. */
function claveFecha(fecha) {
    return Number(String(fecha).replace(/-/g, ""));
}

/** Intervalo ocupado por una reserva existente: servicio + limpieza. */
function intervaloReserva(r) {
    const inicio = aMinutos(r.hora);
    return { inicio, fin: inicio + Number(r.duracion) + Number(r.limpieza || 0) };
}

/**
 * Calcula las horas que se pueden ofrecer en una jornada.
 *
 *  - bloques: tramos de trabajo del día (dos si el horario es partido).
 *  - ocupados: reservas (con su limpieza) y bloqueos de tiempo.
 *  - intervalo: cada cuántos minutos se ofrece un cupo; con 0 se usa la
 *    duración del servicio y, si hay un choque, se salta al final del
 *    bloque ocupado (algoritmo original de la especificación 9.6).
 *  - limpieza: minutos que deben quedar libres después del servicio antes
 *    de la siguiente cita.
 *  - minimo: no se ofrecen horas anteriores o iguales a este minuto (hoy).
 */
function calcularHoras({ bloques, ocupados, duracion, limpieza = 0, intervalo = 0, minimo = -1 }) {
    const disponibles = [];
    const paso = intervalo > 0 ? intervalo : duracion;

    for (const bloque of bloques) {
        let candidato = bloque.inicio;

        while (candidato + duracion <= bloque.fin) {
            const finConLimpieza = candidato + duracion + limpieza;
            const choque = ocupados.find((o) => candidato < o.fin && finConLimpieza > o.inicio);

            if (choque) {
                if (intervalo > 0) {
                    // Siguiente cupo de la cuadrícula después del bloque ocupado.
                    const pasos = Math.ceil((choque.fin - bloque.inicio) / paso);
                    candidato = Math.max(candidato + paso, bloque.inicio + pasos * paso);
                } else {
                    candidato = choque.fin;
                }
                continue;
            }

            if (candidato > minimo) disponibles.push(aHora(candidato));
            candidato += paso;
        }
    }

    return disponibles;
}

class ReservaService {

    constructor() {
        // Reloj inyectable: permite a las pruebas fijar "ahora".
        this.reloj = () => ahoraEnZona();
    }

    async obtenerTodas({ barberoId, fecha, estado, clienteId } = {}) {
        const where = {};
        if (barberoId) where.barberoId = barberoId;
        if (fecha) where.fecha = fecha;
        if (estado) where.estado = estado;
        if (clienteId) where.clienteId = clienteId;

        return await Reserva.findAll({
            where,
            include: INCLUDES,
            order: [["fecha", "ASC"], ["hora", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Reserva.findByPk(id, { include: INCLUDES });
    }

    async _obtenerBarberoActivo(barberoId, transaction) {
        const barbero = await Barbero.findByPk(barberoId, {
            include: [{ model: Servicio, as: "servicios", attributes: ["id"], through: { attributes: [] } }],
            transaction,
        });
        if (!barbero) throw new Error("El barbero seleccionado no existe.");
        if (barbero.estado !== "Activo") throw new Error("El barbero seleccionado se encuentra inactivo.");
        return barbero;
    }

    async _obtenerServicioActivo(servicioId, transaction) {
        const servicio = await Servicio.findByPk(servicioId, { transaction });
        if (!servicio) throw new Error("El servicio seleccionado no existe.");
        if (servicio.estado !== "Activo") throw new Error("El servicio seleccionado se encuentra inactivo.");
        return servicio;
    }

    /**
     * Un barbero sin servicios asignados atiende todos (compatibilidad con
     * los datos de la versión anterior). Si tiene servicios asignados, solo
     * atiende esos.
     */
    _realizaServicio(barbero, servicioId) {
        const servicios = barbero.servicios || [];
        return servicios.length === 0 || servicios.some((s) => Number(s.id) === Number(servicioId));
    }

    /** Barberos activos que realizan un servicio (para "Cualquier barbero"). */
    async barberosParaServicio(servicioId) {
        const barberos = await Barbero.findAll({
            where: { estado: "Activo" },
            include: [{ model: Servicio, as: "servicios", attributes: ["id"], through: { attributes: [] } }],
            order: [["nombre", "ASC"]],
        });
        return barberos.filter((b) => this._realizaServicio(b, servicioId));
    }

    /** Límites de la reserva en línea: anticipación mínima y días máximos. */
    async _limitesPublicos(config) {
        const ahora = this.reloj();
        return {
            ahora,
            maxFecha: sumarDias(ahora.fecha, config.diasMaximos),
            minimoHoy: ahora.minutos + config.anticipacionMinutos,
        };
    }

    async _ocupadosDelDia(barberoId, fecha, jornada, excluirReservaId, transaction) {
        const where = { barberoId, fecha, ...OCUPA_HORARIO };
        if (excluirReservaId) where.id = { [Op.ne]: excluirReservaId };
        const reservas = await Reserva.findAll({ where, order: [["hora", "ASC"]], transaction });
        return [...reservas.map(intervaloReserva), ...jornada.bloqueos];
    }

    /**
     * Horas realmente disponibles de un barbero para una fecha y un servicio.
     * `excluirReservaId` permite que, al editar una reserva, su propio
     * horario siga apareciendo como opción. `publico` aplica las reglas de la
     * reserva en línea (anticipación mínima y días máximos).
     */
    async obtenerHorasDisponibles({ barberoId, fecha, servicioId, excluirReservaId, publico = false }) {
        if (!barberoId || !fecha || !servicioId) {
            throw new Error("Debe indicar barbero, fecha y servicio para calcular la disponibilidad.");
        }

        if (!esFechaValida(fecha)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD.");
        }

        const servicio = await this._obtenerServicioActivo(servicioId);

        if (barberoId === "cualquiera") {
            return await this._horasCualquierBarbero({ servicio, fecha, publico });
        }

        const barbero = await this._obtenerBarberoActivo(barberoId);
        if (!this._realizaServicio(barbero, servicioId)) return [];

        return await this._horasDeBarbero({ barberoId, servicio, fecha, excluirReservaId, publico });
    }

    async _horasDeBarbero({ barberoId, servicio, fecha, excluirReservaId, publico }) {
        const config = await configuracionService.obtener();
        const ahora = this.reloj();

        if (fecha < ahora.fecha) return [];

        let minimo = fecha === ahora.fecha ? ahora.minutos : -1;
        if (publico) {
            const limites = await this._limitesPublicos(config);
            if (fecha > limites.maxFecha) return [];
            if (fecha === ahora.fecha) minimo = limites.minimoHoy;
        }

        const jornada = await obtenerJornada(barberoId, fecha);
        if (jornada.estado !== "Activo") return [];

        const ocupados = await this._ocupadosDelDia(barberoId, fecha, jornada, excluirReservaId);

        return calcularHoras({
            bloques: jornada.bloques,
            ocupados,
            duracion: Number(servicio.duracion),
            limpieza: config.minutosLimpieza,
            intervalo: config.intervaloCupos,
            minimo,
        });
    }

    async _horasCualquierBarbero({ servicio, fecha, publico }) {
        const barberos = await this.barberosParaServicio(servicio.id);
        const todas = new Set();
        for (const b of barberos) {
            const horas = await this._horasDeBarbero({ barberoId: b.id, servicio, fecha, publico });
            horas.forEach((h) => todas.add(h));
        }
        return [...todas].sort();
    }

    /**
     * Días de un rango que tienen al menos una hora libre. Lo usa el
     * calendario visual del portal público.
     */
    async obtenerDiasDisponibles({ barberoId, servicioId, desde, hasta, publico = false }) {
        if (!barberoId || !servicioId || !desde || !hasta) {
            throw new Error("Debe indicar barbero, servicio y rango de fechas.");
        }

        if (!esFechaValida(desde) || !esFechaValida(hasta) || desde > hasta) {
            throw new Error("El rango de fechas no es válido.");
        }

        if (sumarDias(desde, MAX_DIAS_CONSULTA) < hasta) {
            throw new Error(`El rango de consulta no puede superar ${MAX_DIAS_CONSULTA} días.`);
        }

        const servicio = await this._obtenerServicioActivo(servicioId);
        const config = await configuracionService.obtener();
        const ahora = this.reloj();
        const limites = publico ? await this._limitesPublicos(config) : null;

        let barberos;
        if (barberoId === "cualquiera") {
            barberos = await this.barberosParaServicio(servicioId);
        } else {
            const barbero = await this._obtenerBarberoActivo(barberoId);
            barberos = this._realizaServicio(barbero, servicioId) ? [barbero] : [];
        }

        // Horas por fecha, unidas entre los barberos considerados.
        const horasPorFecha = {};
        const estadoPorFecha = {};

        for (const barbero of barberos) {
            const [jornadas, reservas] = await Promise.all([
                obtenerJornadas(barbero.id, desde, hasta),
                Reserva.findAll({
                    where: { barberoId: barbero.id, fecha: { [Op.between]: [desde, hasta] }, ...OCUPA_HORARIO },
                }),
            ]);

            for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
                const jornada = jornadas[fecha];
                // Un día es "Activo" si al menos un barbero trabaja.
                if (estadoPorFecha[fecha] !== "Activo") estadoPorFecha[fecha] = jornada.estado;
                if (jornada.estado !== "Activo") continue;
                if (fecha < ahora.fecha) continue;
                if (limites && fecha > limites.maxFecha) continue;

                let minimo = fecha === ahora.fecha ? ahora.minutos : -1;
                if (limites && fecha === ahora.fecha) minimo = limites.minimoHoy;

                const ocupados = [
                    ...reservas.filter((r) => r.fecha === fecha).map(intervaloReserva),
                    ...jornada.bloqueos,
                ];

                const horas = calcularHoras({
                    bloques: jornada.bloques,
                    ocupados,
                    duracion: Number(servicio.duracion),
                    limpieza: config.minutosLimpieza,
                    intervalo: config.intervaloCupos,
                    minimo,
                });

                horasPorFecha[fecha] = horasPorFecha[fecha] || new Set();
                horas.forEach((h) => horasPorFecha[fecha].add(h));
            }
        }

        const resultado = [];
        for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
            resultado.push({
                fecha,
                estado: estadoPorFecha[fecha] || "SinTurno",
                horasDisponibles: horasPorFecha[fecha] ? horasPorFecha[fecha].size : 0,
            });
        }
        return resultado;
    }

    /**
     * Valida, en el servidor, todas las reglas de agenda de una reserva:
     * formato, horario no pasado, turno del barbero (no Descanso, dentro de
     * un tramo de trabajo, sin cruzar la pausa del almuerzo ni un bloqueo) y
     * ausencia de cruces con otras reservas activas, contando los minutos de
     * limpieza, tanto del barbero como del propio cliente.
     */
    async validarDisponibilidad({
        barberoId, fecha, hora, duracion, limpieza = 0, excluirReservaId, clienteId, transaction, publico = false,
    }) {

        if (!esFechaValida(fecha)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD.");
        }

        if (!esHoraValida(hora)) {
            throw new Error("La hora debe tener el formato HH:MM.");
        }

        const ahora = this.reloj();

        if (esPasado(fecha, hora, ahora)) {
            throw new Error("No es posible reservar en una fecha u hora que ya pasó.");
        }

        if (publico) {
            const config = await configuracionService.obtener(transaction);
            const limites = await this._limitesPublicos(config);
            if (fecha > limites.maxFecha) {
                throw new Error(`Las reservas en línea se pueden hacer con máximo ${config.diasMaximos} días de anticipación.`);
            }
            if (fecha === ahora.fecha && aMinutos(hora) < limites.minimoHoy) {
                throw new Error(`Las reservas en línea se deben hacer con al menos ${config.anticipacionMinutos} minutos de anticipación.`);
            }
        }

        const jornada = await obtenerJornada(barberoId, fecha, transaction);

        if (jornada.estado !== "Activo" || jornada.bloques.length === 0) {
            throw new Error(
                "El barbero no se encuentra disponible para la fecha seleccionada."
            );
        }

        const inicio = aMinutos(hora);
        const fin = inicio + Number(duracion);

        const dentroDeUnTramo = jornada.bloques.some((b) => inicio >= b.inicio && fin <= b.fin);

        if (!dentroDeUnTramo) {
            const turnoInicio = jornada.bloques[0].inicio;
            const turnoFin = jornada.bloques[jornada.bloques.length - 1].fin;
            if (jornada.bloques.length > 1 && inicio >= turnoInicio && fin <= turnoFin) {
                throw new Error(
                    `La hora seleccionada cruza la pausa del barbero (${jornada.pausaInicio} a ${jornada.pausaFin}).`
                );
            }
            throw new Error(
                "La hora seleccionada está fuera del turno de trabajo del barbero ese día."
            );
        }

        const finConLimpieza = fin + Number(limpieza);

        if (jornada.bloqueos.some((b) => inicio < b.fin && finConLimpieza > b.inicio)) {
            throw new Error("El barbero tiene ese horario bloqueado.");
        }

        const where = { barberoId, fecha, ...OCUPA_HORARIO };
        if (excluirReservaId) where.id = { [Op.ne]: excluirReservaId };

        const reservasDelDia = await Reserva.findAll({ where, transaction });

        if (reservasDelDia.some((r) => {
            const o = intervaloReserva(r);
            return inicio < o.fin && finConLimpieza > o.inicio;
        })) {
            throw new Error(MENSAJE_CRUCE);
        }

        if (clienteId) {
            const whereCliente = { clienteId, fecha, ...OCUPA_HORARIO };
            if (excluirReservaId) whereCliente.id = { [Op.ne]: excluirReservaId };

            const reservasCliente = await Reserva.findAll({ where: whereCliente, transaction });

            // El cliente no puede estar en dos sillas a la vez (sin contar limpieza).
            if (reservasCliente.some((r) => {
                const i = aMinutos(r.hora);
                return inicio < i + Number(r.duracion) && fin > i;
            })) {
                throw new Error("El cliente ya tiene otra reserva que se cruza con ese horario.");
            }
        }
    }

    /**
     * Bloqueo transaccional por barbero y fecha (y por cliente y fecha).
     * Dos solicitudes simultáneas para el mismo barbero el mismo día se
     * atienden una después de otra, así la segunda ve la reserva de la
     * primera y es rechazada. Se libera al terminar la transacción.
     */
    async _bloquear({ barberoId, clienteId, fecha }, transaction) {
        const clave = claveFecha(fecha);
        await sequelize.query("SELECT pg_advisory_xact_lock(:a, :b)", {
            replacements: { a: Number(barberoId), b: clave },
            transaction,
        });
        if (clienteId) {
            await sequelize.query("SELECT pg_advisory_xact_lock(:a, :b)", {
                replacements: { a: -Number(clienteId), b: clave },
                transaction,
            });
        }
    }

    async _codigoUnico(transaction) {
        for (let intento = 0; intento < 5; intento++) {
            const codigo = generarCodigo();
            const existe = await Reserva.count({ where: { codigo }, transaction });
            if (!existe) return codigo;
        }
        throw new Error("No fue posible generar el código de la reserva. Intente de nuevo.");
    }

    /** Traduce las violaciones de restricciones de la base de datos a mensajes claros. */
    _traducirErrorBD(error) {
        const codigo = error?.parent?.code || error?.original?.code;
        if (codigo === "23P01") return new Error(MENSAJE_CRUCE);
        return error;
    }

    /**
     * Elige el barbero para "Cualquier barbero disponible": entre los que
     * realizan el servicio y están libres a esa hora, el que tenga menos
     * citas ese día (reparto equitativo del trabajo).
     */
    async elegirBarbero({ servicioId, fecha, hora, clienteId, publico }) {
        const servicio = await this._obtenerServicioActivo(servicioId);
        const config = await configuracionService.obtener();
        const candidatos = await this.barberosParaServicio(servicioId);

        const libres = [];
        for (const b of candidatos) {
            try {
                await this.validarDisponibilidad({
                    barberoId: b.id, fecha, hora, duracion: servicio.duracion,
                    limpieza: config.minutosLimpieza, clienteId, publico,
                });
                const carga = await Reserva.count({ where: { barberoId: b.id, fecha, ...OCUPA_HORARIO } });
                libres.push({ barbero: b, carga });
            } catch {
                // no disponible: se prueba el siguiente
            }
        }

        if (libres.length === 0) {
            throw new Error("Ningún barbero tiene libre esa hora. Elija otra hora.");
        }

        libres.sort((a, b) => a.carga - b.carga || a.barbero.nombre.localeCompare(b.barbero.nombre));
        return libres.map((l) => l.barbero);
    }

    /**
     * Crea una reserva. Si se recibe `transaction`, se usa (el portal público
     * crea el cliente y la reserva en una misma transacción); si no, se abre
     * una nueva.
     */
    async crear(datos, { origen = "admin", transaction, publico = false } = {}) {
        if (!datos.clienteId) throw new Error("Debe seleccionar un cliente.");
        if (!datos.barberoId) throw new Error("Debe seleccionar un barbero.");
        if (!datos.servicioId) throw new Error("Debe seleccionar un servicio.");
        if (!esFechaValida(datos.fecha)) throw new Error("La fecha debe tener el formato AAAA-MM-DD.");
        if (!esHoraValida(datos.hora)) throw new Error("La hora debe tener el formato HH:MM.");

        if (datos.observaciones && String(datos.observaciones).length > 500) {
            throw new Error("Las observaciones no pueden superar 500 caracteres.");
        }

        const ejecutar = async (t) => {
            const cliente = await Cliente.findByPk(datos.clienteId, { transaction: t });
            if (!cliente) throw new Error("El cliente seleccionado no existe.");

            const barbero = await this._obtenerBarberoActivo(datos.barberoId, t);
            const servicio = await this._obtenerServicioActivo(datos.servicioId, t);

            if (!this._realizaServicio(barbero, datos.servicioId)) {
                throw new Error("El barbero seleccionado no realiza este servicio.");
            }

            const config = await configuracionService.obtener(t);

            await this._bloquear(datos, t);

            await this.validarDisponibilidad({
                barberoId: datos.barberoId,
                clienteId: datos.clienteId,
                fecha: datos.fecha,
                hora: datos.hora,
                duracion: servicio.duracion,
                limpieza: config.minutosLimpieza,
                transaction: t,
                publico,
            });

            return await Reserva.create({
                clienteId: datos.clienteId,
                barberoId: datos.barberoId,
                servicioId: datos.servicioId,
                fecha: datos.fecha,
                hora: datos.hora,
                observaciones: datos.observaciones ? String(datos.observaciones).trim() : null,
                duracion: servicio.duracion,
                limpieza: config.minutosLimpieza,
                estado: "Pendiente",
                codigo: await this._codigoUnico(t),
                origen,
            }, { transaction: t });
        };

        try {
            if (transaction) return await ejecutar(transaction);
            return await sequelize.transaction(ejecutar);
        } catch (error) {
            throw this._traducirErrorBD(error);
        }
    }

    async actualizar(id, datos, usuario) {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return null;

        if (usuario?.rol === "barbero") {
            return await this._actualizarEstadoComoBarbero(reserva, datos, usuario);
        }

        // El administrador que solo envía el estado (p. ej. marcar que el
        // cliente llegó) sigue las mismas reglas de avance que el barbero.
        if (datos && Object.keys(datos).length === 1 && "estado" in datos && datos.estado !== "Cancelada") {
            return await this._cambiarEstado(reserva, datos.estado);
        }

        return await this._actualizarComoAdmin(reserva, datos);
    }

    async _actualizarComoAdmin(reserva, datos) {

        if (reserva.estado !== "Pendiente") {
            throw errorConEstado("No es posible modificar una reserva que ya inició, finalizó o fue cancelada.", 409);
        }

        // El estado "Cancelada" se asigna únicamente con la acción de cancelar,
        // para que quede registrada la fecha de cancelación.
        if (datos.estado === "Cancelada") {
            throw errorConEstado("Para cancelar una reserva utilice la acción Cancelar.", 400);
        }

        // Campos que nunca se modifican por esta vía.
        delete datos.codigo;
        delete datos.origen;
        delete datos.canceladaEn;
        delete datos.duracion;
        delete datos.limpieza;

        try {
            return await sequelize.transaction(async (t) => {
                if (datos.fecha || datos.hora || datos.barberoId || datos.servicioId || datos.clienteId) {
                    const servicio = await this._obtenerServicioActivo(datos.servicioId || reserva.servicioId, t);
                    const barberoDestino = datos.barberoId || reserva.barberoId;

                    const barbero = await this._obtenerBarberoActivo(barberoDestino, t);
                    if (!this._realizaServicio(barbero, servicio.id)) {
                        throw new Error("El barbero seleccionado no realiza este servicio.");
                    }

                    const destino = {
                        barberoId: barberoDestino,
                        clienteId: datos.clienteId || reserva.clienteId,
                        fecha: datos.fecha || reserva.fecha,
                        hora: (datos.hora || reserva.hora).slice(0, 5),
                    };

                    await this._bloquear(destino, t);

                    await this.validarDisponibilidad({
                        ...destino,
                        duracion: servicio.duracion,
                        limpieza: reserva.limpieza,
                        excluirReservaId: reserva.id,
                        transaction: t,
                    });

                    datos.duracion = servicio.duracion;
                }

                await reserva.update(datos, { transaction: t });
                return reserva;
            });
        } catch (error) {
            throw this._traducirErrorBD(error);
        }
    }

    async _actualizarEstadoComoBarbero(reserva, datos, usuario) {

        if (reserva.barberoId !== usuario.barberoId) {
            throw errorConEstado("No tiene permisos para modificar esta reserva.", 403);
        }

        const soloTraeEstado = datos && Object.keys(datos).length === 1 && "estado" in datos;

        if (!soloTraeEstado) {
            throw errorConEstado("Como barbero, solo puede actualizar el estado de la reserva.", 403);
        }

        return await this._cambiarEstado(reserva, datos.estado);
    }

    /** Avance de estado común para barbero y administrador. */
    async _cambiarEstado(reserva, nuevoEstado) {
        const avancesPermitidos = TRANSICIONES_VALIDAS[reserva.estado] || [];

        if (!avancesPermitidos.includes(nuevoEstado)) {
            let mensaje = "No es posible cambiar nuevamente este estado.";
            if (reserva.estado === "Finalizada") mensaje = "Esta reserva ya fue finalizada.";
            if (reserva.estado === "Cancelada") mensaje = "Esta reserva fue cancelada.";
            if (reserva.estado === "No asistió") mensaje = "Esta reserva quedó registrada como inasistencia.";
            throw errorConEstado(mensaje, 409);
        }

        if (nuevoEstado === "No asistió") {
            const config = await configuracionService.obtener();
            const ahora = this.reloj();
            const limite = aMinutos(reserva.hora) + config.minutosToleranciaNoAsistio;
            const aunNo = reserva.fecha > ahora.fecha || (reserva.fecha === ahora.fecha && ahora.minutos < limite);
            if (aunNo) {
                throw errorConEstado(
                    `Solo puede marcar "No asistió" ${config.minutosToleranciaNoAsistio} minutos después de la hora de la cita.`,
                    409
                );
            }
        }

        await reserva.update({ estado: nuevoEstado });

        if (nuevoEstado === "Finalizada") {
            const cliente = await Cliente.findByPk(reserva.clienteId);
            if (cliente) {
                await cliente.update({
                    ultimaCita: reserva.fecha,
                    totalVisitas: (cliente.totalVisitas || 0) + 1,
                });
            }
        }

        return reserva;
    }

    /**
     * Cancela una reserva Pendiente: conserva el registro (historial) pero
     * libera de inmediato el horario. Con `horasLimite` (cancelación en
     * línea) exige que falten al menos esas horas para la cita.
     */
    async cancelar(id, { exigirFuturo = false, horasLimite = 0 } = {}) {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return null;

        if (reserva.estado === "Cancelada") {
            throw errorConEstado("Esta reserva ya fue cancelada.", 409);
        }

        if (reserva.estado !== "Pendiente") {
            throw errorConEstado("Solo es posible cancelar una reserva Pendiente.", 409);
        }

        const ahora = this.reloj();

        if (exigirFuturo && esPasado(reserva.fecha, reserva.hora, ahora)) {
            throw errorConEstado("La hora de esta reserva ya pasó; comuníquese con la barbería.", 409);
        }

        if (horasLimite > 0) {
            const minutosRestantes = (reserva.fecha === ahora.fecha)
                ? aMinutos(reserva.hora) - ahora.minutos
                : (reserva.fecha > ahora.fecha ? Infinity : -1);
            const esManana = reserva.fecha === sumarDias(ahora.fecha, 1);
            const restantesReales = esManana ? aMinutos(reserva.hora) + (1440 - ahora.minutos) : minutosRestantes;
            if (restantesReales < horasLimite * 60) {
                throw errorConEstado(
                    `Las reservas solo se pueden cancelar en línea hasta ${horasLimite} horas antes. Comuníquese con la barbería.`,
                    409
                );
            }
        }

        await reserva.update({ estado: "Cancelada", canceladaEn: new Date() });
        return reserva;
    }

    async eliminar(id) {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return null;

        if (!["Pendiente", "Cancelada"].includes(reserva.estado)) {
            throw errorConEstado("No es posible eliminar una reserva que ya inició o fue finalizada.", 409);
        }

        await reserva.destroy();
        return true;
    }
}

const instancia = new ReservaService();
instancia.calcularHoras = calcularHoras;
instancia.generarCodigo = generarCodigo;
instancia.TRANSICIONES_VALIDAS = TRANSICIONES_VALIDAS;

module.exports = instancia;
