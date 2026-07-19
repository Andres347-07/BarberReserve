const Cliente = require("../models/Cliente");

class ClienteService {

    async obtenerTodos() {
        return await Cliente.findAll({
            order: [["id", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Cliente.findByPk(id);
    }

    async crear(datos) {
        return await Cliente.create(datos);
    }

    async actualizar(id, datos) {

        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return null;
        }

        await cliente.update(datos);

        return cliente;
    }

    async eliminar(id) {

        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return null;
        }

        await cliente.destroy();

        return true;
    }

}

module.exports = new ClienteService();