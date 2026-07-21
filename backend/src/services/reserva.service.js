const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");

class ReservaService {

    async obtenerTodas() {

        return await Reserva.findAll({

            include: [

                {
                    model: Cliente,
                    as: "cliente",
                    attributes: ["id", "nombre", "telefono"],
                },

                {
                    model: Barbero,
                    as: "barbero",
                    attributes: ["id", "nombre", "especialidad"],
                },

                {
                    model: Servicio,
                    as: "servicio",
                    attributes: ["id", "nombre", "precio", "duracion"],
                },

            ],

            order: [["fecha", "ASC"], ["hora", "ASC"]],

        });

    }

    async obtenerPorId(id) {

        return await Reserva.findByPk(id, {

            include: [

                {
                    model: Cliente,
                    as: "cliente",
                },

                {
                    model: Barbero,
                    as: "barbero",
                },

                {
                    model: Servicio,
                    as: "servicio",
                },

            ],

        });

    }

    async crear(datos) {

        const cliente = await Cliente.findByPk(datos.clienteId);

        if (!cliente) {
            throw new Error("El cliente no existe.");
        }

        const barbero = await Barbero.findByPk(datos.barberoId);

        if (!barbero) {
            throw new Error("El barbero no existe.");
        }

        const servicio = await Servicio.findByPk(datos.servicioId);

        if (!servicio) {
            throw new Error("El servicio no existe.");
        }

        return await Reserva.create({

            ...datos,

            estado: datos.estado || "Pendiente",

        });

    }

    async actualizar(id, datos) {

        const reserva = await Reserva.findByPk(id);

        if (!reserva) {

            return null;

        }

        await reserva.update(datos);

        return reserva;

    }

    async eliminar(id) {

        const reserva = await Reserva.findByPk(id);

        if (!reserva) {

            return null;

        }

        await reserva.destroy();

        return true;

    }

}

module.exports = new ReservaService();