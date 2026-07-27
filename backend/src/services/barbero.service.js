const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

const sequelize = require("../database/connection");
const Barbero = require("../models/Barbero");
const Usuario = require("../models/Usuario");
const Horario = require("../models/Horario");
const Reserva = require("../models/Reserva");
const generarPasswordTemporal = require("../utils/generarPassword");
const { validarNombre, validarTelefono, validarCorreo } = require("../utils/validarContacto");

const SALT_ROUNDS = 10;

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

        validarNombre(datos.nombre);
        validarNombre(datos.especialidad, "La especialidad");
        validarTelefono(datos.telefono);
        validarCorreo(datos.correo);

        const telefonoExistente = await Barbero.findOne({
            where: { telefono: datos.telefono },
        });

        if (telefonoExistente) {
            throw new Error("Ya existe un barbero registrado con ese teléfono.");
        }

        const correoExistente = await Barbero.findOne({
            where: { correo: datos.correo },
        });

        if (correoExistente) {
            throw new Error("Ya existe un barbero registrado con ese correo.");
        }

        const correoEnUso = await Usuario.findOne({ where: { email: datos.correo } });

        if (correoEnUso) {
            throw new Error("Ya existe un usuario registrado con ese correo.");
        }

        const passwordTemporal = generarPasswordTemporal();

        const resultado = await sequelize.transaction(async (t) => {

            const barbero = await Barbero.create(
                {
                    nombre: datos.nombre,
                    especialidad: datos.especialidad,
                    telefono: datos.telefono,
                    correo: datos.correo,
                    estado: datos.estado || "Activo",
                },
                { transaction: t }
            );

            const hash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

            await Usuario.create(
                {
                    nombre: barbero.nombre,
                    email: barbero.correo,
                    password: hash,
                    rol: "barbero",
                    barberoId: barbero.id,
                    debeCambiarPassword: true,
                },
                { transaction: t }
            );

            return barbero;
        });

        return { barbero: resultado, passwordTemporal };
    }



    async actualizar(id, datos) {


        const barbero = await Barbero.findByPk(id);


        if (!barbero) {

            return null;

        }

        if (datos.nombre !== undefined) validarNombre(datos.nombre);
        if (datos.especialidad !== undefined) validarNombre(datos.especialidad, "La especialidad");
        if (datos.telefono !== undefined) validarTelefono(datos.telefono);
        if (datos.correo !== undefined) validarCorreo(datos.correo);


        if (datos.telefono) {

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

        }



        if (datos.correo) {

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

        }


        const estadoAnterior = barbero.estado;

        await barbero.update(datos);

        // Si el correo del barbero cambió, se refleja también en su
        // usuario de acceso, ya que ambos deben permanecer sincronizados
        // (ver especificación, capítulo 12, observaciones para la implementación).
        if (datos.correo) {
            const usuario = await Usuario.findOne({ where: { barberoId: id } });
            if (usuario && usuario.email !== datos.correo) {
                await usuario.update({ email: datos.correo, nombre: barbero.nombre });
            }
        }

        // Si el barbero pasa a Inactivo, su usuario se desactiva para que
        // no pueda iniciar sesión (ver especificación, capítulo 6.8/13.4).
        if (datos.estado && datos.estado !== estadoAnterior) {
            const usuario = await Usuario.findOne({ where: { barberoId: id } });
            if (usuario) {
                await usuario.update({ activo: datos.estado === "Activo" });
            }
        }

        return barbero;

    }



    /**
     * Elimina un barbero únicamente si no posee información relacionada
     * (horarios, reservas). Ver especificación, capítulo 6.9.
     */
    async eliminar(id) {


        const barbero = await Barbero.findByPk(id);


        if (!barbero) {

            return null;

        }

        const tieneHorarios = await Horario.count({ where: { barberoId: id } });

        if (tieneHorarios > 0) {
            throw new Error(
                "No es posible eliminar este barbero porque posee información relacionada (horarios). Márquelo como Inactivo en su lugar."
            );
        }

        const tieneReservas = await Reserva.count({ where: { barberoId: id } });

        if (tieneReservas > 0) {
            throw new Error(
                "No es posible eliminar este barbero porque posee información relacionada (reservas). Márquelo como Inactivo en su lugar."
            );
        }

        // Sin horarios ni reservas: es seguro eliminar también su usuario asociado.
        await Usuario.destroy({ where: { barberoId: id } });

        await barbero.destroy();


        return true;

    }

}


module.exports = new BarberoService();
