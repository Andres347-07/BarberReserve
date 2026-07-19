const Barbero = require("../models/Barbero");

class BarberoService {

    async obtenerTodos() {
        return await Barbero.findAll({
            order: [["id", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Barbero.findByPk(id);
    }

    async crear(datos) {
        return await Barbero.create(datos);
    }

    async actualizar(id, datos) {

        const barbero = await Barbero.findByPk(id);

        if (!barbero) {
            return null;
        }

        await barbero.update(datos);

        return barbero;
    }

    async eliminar(id) {

        const barbero = await Barbero.findByPk(id);

        if (!barbero) {
            return null;
        }

        await barbero.destroy();

        return true;
    }

}

module.exports = new BarberoService();