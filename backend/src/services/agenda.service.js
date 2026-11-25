const { Op } = require("sequelize");

const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const Horario = require("../models/Horario");
const { obtenerJornada } = require("./jornada.service");
const configuracionService = require("./configuracion.service");
const { esFechaValida, sumarDias } = require("../utils/fechaHora");

const INCLUDES = [
    { model: Cliente, as: "cliente", attributes: ["id", "nombre", "telefono"] },
    { model: Barbero, as: "barbero", attributes: ["id", "nombre"] },
    { model: Servicio, as: "servicio", attributes: ["id", "nombre", "duracion"] },
];

class AgendaService {

    async obtenerDia({ fecha, barberoId, estado, clienteId }) {
        if (!fecha) throw new Error("Debe indicar una fecha.");

        const where = { fecha };
        if (barberoId) where.barberoId = barberoId;
        if (estado) where.estado = estado;
        if (clienteId) where.clienteId = clienteId;

        const reservas = await Reserva.findAll({
            where,
            include: INCLUDES,
            order: [["hora", "ASC"]],
        });

        // "turno" se conserva por compatibilidad (excepción de esa fecha);
        // "jornada" es el horario real: excepción o plantilla, con pausa y bloqueos.
        let turno = null;
        let jornada = null;
        if (barberoId) {
            turno = await Horario.findOne({ where: { barberoId, fecha } });
            jornada = await obtenerJornada(barberoId, fecha);
        }

        const { minutosToleranciaNoAsistio } = await configuracionService.obtener();
        return { fecha, turno, jornada, reservas, toleranciaNoAsistio: minutosToleranciaNoAsistio };
    }

    /** Agenda de varios días (vista "Semana" del barbero). Máximo 14 días. */
    async obtenerRango({ desde, hasta, barberoId, estado }) {
        if (!esFechaValida(desde) || !esFechaValida(hasta) || desde > hasta) {
            throw new Error("El rango de fechas no es válido.");
        }
        if (sumarDias(desde, 14) < hasta) throw new Error("El rango no puede superar 14 días.");

        const where = { fecha: { [Op.between]: [desde, hasta] } };
        if (barberoId) where.barberoId = barberoId;
        if (estado) where.estado = estado;

        const reservas = await Reserva.findAll({
            where,
            include: INCLUDES,
            order: [["fecha", "ASC"], ["hora", "ASC"]],
        });

        const dias = [];
        for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
            dias.push({
                fecha,
                jornada: barberoId ? await obtenerJornada(barberoId, fecha) : null,
                reservas: reservas.filter((r) => r.fecha === fecha),
            });
        }
        const { minutosToleranciaNoAsistio } = await configuracionService.obtener();
        return { desde, hasta, dias, toleranciaNoAsistio: minutosToleranciaNoAsistio };
    }
}

module.exports = new AgendaService();
