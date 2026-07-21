const { Op } = require("sequelize");

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


        const telefonoExistente = await Cliente.findOne({

            where: {

                telefono: datos.telefono,

            },

        });


        if (telefonoExistente) {

            throw new Error(
                "Ya existe un cliente registrado con ese teléfono."
            );

        }



        const correoExistente = await Cliente.findOne({

            where: {

                correo: datos.correo,

            },

        });


        if (correoExistente) {

            throw new Error(
                "Ya existe un cliente registrado con ese correo."
            );

        }



        return await Cliente.create(datos);


    }




    async actualizar(id, datos) {


        const cliente = await Cliente.findByPk(id);


        if (!cliente) {

            return null;

        }



        const telefonoExistente = await Cliente.findOne({

            where: {

                telefono: datos.telefono,

                id: {

                    [Op.ne]: id,

                },

            },

        });



        if (telefonoExistente) {

            throw new Error(
                "El teléfono ya pertenece a otro cliente."
            );

        }




        const correoExistente = await Cliente.findOne({

            where: {

                correo: datos.correo,

                id: {

                    [Op.ne]: id,

                },

            },

        });



        if (correoExistente) {

            throw new Error(
                "El correo ya pertenece a otro cliente."
            );

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