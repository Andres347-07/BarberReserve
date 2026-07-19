const Servicio = require("../models/Servicio");

class ServicioService {

    async obtenerTodos() {
        return await Servicio.findAll({
            order: [["id", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Servicio.findByPk(id);
    }

    async crear(datos) {
        return await Servicio.create(datos);
    }

    async actualizar(id, datos) {

        const servicio = await Servicio.findByPk(id);

        if (!servicio) return null;

        await servicio.update(datos);

        return servicio;

    }

    async eliminar(id) {

        const servicio = await Servicio.findByPk(id);

        if (!servicio) return null;

        await servicio.destroy();

        return true;

    }

}

module.exports = new ServicioService();