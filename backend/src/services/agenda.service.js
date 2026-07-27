const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const Horario = require("../models/Horario");

class AgendaService {

   
     
    async obtenerDia({ fecha, barberoId, estado, clienteId }) {
        if (!fecha) throw new Error("Debe indicar una fecha.");

        const where = { fecha };
        if (barberoId) where.barberoId = barberoId;
        if (estado) where.estado = estado;
        if (clienteId) where.clienteId = clienteId;

        const reservas = await Reserva.findAll({
            where,
            include: [
                { model: Cliente, as: "cliente", attributes: ["id", "nombre", "telefono"] },
                { model: Barbero, as: "barbero", attributes: ["id", "nombre"] },
                { model: Servicio, as: "servicio", attributes: ["id", "nombre", "duracion"] },
            ],
            order: [["hora", "ASC"]],
        });

        let turno = null;
        if (barberoId) {
            turno = await Horario.findOne({ where: { barberoId, fecha } });
        }

        return { fecha, turno, reservas };
    }
}

module.exports = new AgendaService();
