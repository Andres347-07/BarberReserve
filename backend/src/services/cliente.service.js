const { Op } = require("sequelize");

const Cliente = require("../models/Cliente");
const Reserva = require("../models/Reserva");
const { validarNombre, validarTelefono, validarCorreo } = require("../utils/validarContacto");


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

        validarNombre(datos.nombre);
        validarTelefono(datos.telefono);
        validarCorreo(datos.correo);


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

        if (datos.nombre !== undefined) validarNombre(datos.nombre);
        if (datos.telefono !== undefined) validarTelefono(datos.telefono);
        if (datos.correo !== undefined) validarCorreo(datos.correo);


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



        const tieneReservas = await Reserva.count({ where: { clienteId: id } });

        if (tieneReservas > 0) {

            throw new Error(
                "No es posible eliminar este cliente porque posee reservas asociadas."
            );

        }


        await cliente.destroy();



        return true;


    }


}



module.exports = new ClienteService();