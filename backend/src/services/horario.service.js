const Horario = require("../models/Horario");

class HorarioService {

    async obtenerTodos() {
        return await Horario.findAll({
            order: [["id", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Horario.findByPk(id);
    }

    async crear(datos) {
        return await Horario.create(datos);
    }

    async actualizar(id, datos) {

        const horario = await Horario.findByPk(id);

        if (!horario) return null;

        await horario.update(datos);

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