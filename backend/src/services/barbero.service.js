const { Op } = require("sequelize");
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


        const telefonoExistente = await Barbero.findOne({

            where: {
                telefono: datos.telefono,
            },

        });


        if (telefonoExistente) {

            throw new Error(
                "Ya existe un barbero registrado con ese teléfono."
            );

        }


        const correoExistente = await Barbero.findOne({

            where: {
                correo: datos.correo,
            },

        });


        if (correoExistente) {

            throw new Error(
                "Ya existe un barbero registrado con ese correo."
            );

        }


        return await Barbero.create(datos);

    }



    async actualizar(id, datos) {


        const barbero = await Barbero.findByPk(id);


        if (!barbero) {

            return null;

        }


        const telefonoExistente = await Barbero.findOne({

            where: {

                telefono: datos.telefono,

                id: {
                    [Op.ne]: id,
                },

            },

        });


        if (telefonoExistente) {

            throw new Error(
                "El teléfono ya pertenece a otro barbero."
            );

        }



        const correoExistente = await Barbero.findOne({

            where: {

                correo: datos.correo,

                id: {
                    [Op.ne]: id,
                },

            },

        });


        if (correoExistente) {

            throw new Error(
                "El correo ya pertenece a otro barbero."
            );

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