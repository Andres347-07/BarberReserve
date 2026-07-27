const { Op } = require("sequelize");

const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const Horario = require("../models/Horario");

/** "HH:MM" o "HH:MM:SS" -> minutos desde medianoche. */
function aMinutos(horaStr) {
    const [h, m] = String(horaStr).split(":").map(Number);
    return h * 60 + m;
}

/** Minutos desde medianoche -> "HH:MM". */
function aHora(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    return `${h}:${m}`;
}

const INCLUDES = [
    { model: Cliente, as: "cliente", attributes: ["id", "nombre", "telefono"] },
    { model: Barbero, as: "barbero", attributes: ["id", "nombre", "especialidad"] },
    { model: Servicio, as: "servicio", attributes: ["id", "nombre", "precio", "duracion"] },
];

// Únicamente se permite este avance de estados (especificación 9.8 / 10.5):
// Pendiente -> En proceso -> Finalizada. Nunca hacia atrás.
const TRANSICIONES_VALIDAS = {
    "Pendiente": ["En proceso"],
    "En proceso": ["Finalizada"],
    "Finalizada": [],
};

class ReservaService {

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

    /**
     * Calcula las horas realmente disponibles de un barbero, para una
     * fecha y un servicio determinados, siguiendo el algoritmo descrito
     * en la especificación (capítulo 9.6): recorre el turno del barbero
     * en intervalos iguales a la duración del servicio, saltando
     * directamente al final de cualquier reserva que ocupe el horario.
     */
    async obtenerHorasDisponibles({ barberoId, fecha, servicioId }) {
        if (!barberoId || !fecha || !servicioId) {
            throw new Error("Debe indicar barbero, fecha y servicio para calcular la disponibilidad.");
        }

        const barbero = await Barbero.findByPk(barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");
        if (barbero.estado !== "Activo") throw new Error("El barbero seleccionado se encuentra inactivo.");

        const servicio = await Servicio.findByPk(servicioId);
        if (!servicio) throw new Error("El servicio seleccionado no existe.");
        if (servicio.estado !== "Activo") throw new Error("El servicio seleccionado se encuentra inactivo.");

        const horario = await Horario.findOne({ where: { barberoId, fecha } });

        if (!horario || horario.estado !== "Activo") {
            // No es un error: simplemente no hay horas disponibles ese día.
            return [];
        }

        const duracion = Number(servicio.duracion);
        const inicioTurno = aMinutos(horario.horaInicio);
        const finTurno = aMinutos(horario.horaFin);

        const reservasDelDia = await Reserva.findAll({
            where: { barberoId, fecha },
            order: [["hora", "ASC"]],
        });

        const ocupados = reservasDelDia.map((r) => ({
            inicio: aMinutos(r.hora),
            fin: aMinutos(r.hora) + r.duracion,
        }));

        const disponibles = [];
        let candidato = inicioTurno;

        while (candidato + duracion <= finTurno) {

            const bloqueOcupado = ocupados.find(
                (o) => candidato < o.fin && (candidato + duracion) > o.inicio
            );

            if (bloqueOcupado) {
                candidato = bloqueOcupado.fin;
                continue;
            }

            disponibles.push(aHora(candidato));
            candidato += duracion;
        }

        return disponibles;
    }

   
    async validarDisponibilidad({ barberoId, fecha, hora, duracion, excluirReservaId }) {
        const horario = await Horario.findOne({ where: { barberoId, fecha } });

        if (!horario || horario.estado !== "Activo") {
            throw new Error(
                "El barbero no se encuentra disponible para la fecha seleccionada."
            );
        }

        const inicioSolicitado = aMinutos(hora);
        const finSolicitado = inicioSolicitado + Number(duracion);

        if (
            inicioSolicitado < aMinutos(horario.horaInicio) ||
            finSolicitado > aMinutos(horario.horaFin)
        ) {
            throw new Error(
                "La hora seleccionada está fuera del turno de trabajo del barbero ese día."
            );
        }

        const where = { barberoId, fecha };

        if (excluirReservaId) {
            where.id = { [Op.ne]: excluirReservaId };
        }

        const reservasDelDia = await Reserva.findAll({ where });

        const hayConflicto = reservasDelDia.some((r) => {
            const inicioExistente = aMinutos(r.hora);
            const finExistente = inicioExistente + r.duracion;
            return inicioSolicitado < finExistente && finSolicitado > inicioExistente;
        });

        if (hayConflicto) {
            throw new Error(
                "Ya existe una reserva en ese horario."
            );
        }
    }

    async crear(datos) {

        const cliente = await Cliente.findByPk(datos.clienteId);
        if (!cliente) throw new Error("El cliente seleccionado no existe.");

        const barbero = await Barbero.findByPk(datos.barberoId);
        if (!barbero) throw new Error("El barbero seleccionado no existe.");
        if (barbero.estado !== "Activo") throw new Error("El barbero seleccionado se encuentra inactivo.");

        const servicio = await Servicio.findByPk(datos.servicioId);
        if (!servicio) throw new Error("El servicio seleccionado no existe.");
        if (servicio.estado !== "Activo") throw new Error("El servicio seleccionado se encuentra inactivo.");

        await this.validarDisponibilidad({
            barberoId: datos.barberoId,
            fecha: datos.fecha,
            hora: datos.hora,
            duracion: servicio.duracion,
        });

        return await Reserva.create({
            clienteId: datos.clienteId,
            barberoId: datos.barberoId,
            servicioId: datos.servicioId,
            fecha: datos.fecha,
            hora: datos.hora,
            observaciones: datos.observaciones || null,
            duracion: servicio.duracion,
            estado: "Pendiente",
        });
    }

  
 
    async actualizar(id, datos, usuario) {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return null;

        if (usuario?.rol === "barbero") {
            return await this._actualizarEstadoComoBarbero(reserva, datos, usuario);
        }

        return await this._actualizarComoAdmin(reserva, datos);
    }

    async _actualizarComoAdmin(reserva, datos) {

        if (reserva.estado !== "Pendiente") {
            const error = new Error("No es posible modificar una reserva que ya inició.");
            error.status = 409;
            throw error;
        }

        if (datos.fecha || datos.hora || datos.barberoId || datos.servicioId) {
            const servicio = await Servicio.findByPk(datos.servicioId || reserva.servicioId);

            if (!servicio) throw new Error("El servicio seleccionado no existe.");
            if (servicio.estado !== "Activo") throw new Error("El servicio seleccionado se encuentra inactivo.");

            await this.validarDisponibilidad({
                barberoId: datos.barberoId || reserva.barberoId,
                fecha: datos.fecha || reserva.fecha,
                hora: datos.hora || reserva.hora,
                duracion: servicio.duracion,
                excluirReservaId: reserva.id,
            });

            datos.duracion = servicio.duracion;
        }

        await reserva.update(datos);
        return reserva;
    }

    async _actualizarEstadoComoBarbero(reserva, datos, usuario) {

        if (reserva.barberoId !== usuario.barberoId) {
            const error = new Error("No tiene permisos para modificar esta reserva.");
            error.status = 403;
            throw error;
        }

        const soloTraeEstado = datos && Object.keys(datos).length === 1 && "estado" in datos;

        if (!soloTraeEstado) {
            const error = new Error("Como barbero, solo puede actualizar el estado de la reserva.");
            error.status = 403;
            throw error;
        }

        const avancesPermitidos = TRANSICIONES_VALIDAS[reserva.estado] || [];

        if (!avancesPermitidos.includes(datos.estado)) {
            const error = new Error(
                reserva.estado === "Finalizada"
                    ? "Esta reserva ya fue finalizada."
                    : "No es posible cambiar nuevamente este estado."
            );
            error.status = 409;
            throw error;
        }

        await reserva.update({ estado: datos.estado });

       
        if (datos.estado === "Finalizada") {
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

    
    async eliminar(id) {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return null;

        if (reserva.estado !== "Pendiente") {
            const error = new Error("No es posible eliminar una reserva que ya inició o fue finalizada.");
            error.status = 409;
            throw error;
        }

        await reserva.destroy();
        return true;
    }
}

module.exports = new ReservaService();
