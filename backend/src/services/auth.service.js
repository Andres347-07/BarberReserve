const bcrypt = require("bcrypt");

const Usuario = require("../models/Usuario");
const Barbero = require("../models/Barbero");
const { firmarToken } = require("../utils/jwt");
const generarPasswordTemporal = require("../utils/generarPassword");

const SALT_ROUNDS = 10;

class AuthService {

    /**
     * Registro público. Solo permite crear el PRIMER administrador del
     * sistema (arranque inicial). Una vez existe al menos un administrador,
     * esta vía se cierra: los demás usuarios (admins o barberos) deben ser
     * creados por un administrador autenticado mediante `crearUsuario`.
     */
    async registrarPrimerAdmin({ nombre, email, password }) {
        if (!nombre || !email || !password) {
            throw new Error("Nombre, correo y contraseña son obligatorios.");
        }

        if (password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        const existeAdmin = await Usuario.findOne({ where: { rol: "admin" } });

        if (existeAdmin) {
            throw new Error(
                "Ya existe un administrador registrado. Solicita a un administrador que cree tu usuario desde el panel."
            );
        }

        const existeEmail = await Usuario.findOne({ where: { email } });
        if (existeEmail) {
            throw new Error("El correo ya está registrado.");
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const usuario = await Usuario.create({
            nombre,
            email,
            password: hash,
            rol: "admin",
        });

        return this.sanear(usuario);
    }

    /**
     * Creación de usuarios por parte de un administrador ya autenticado.
     * Permite crear tanto otros administradores como cuentas de barbero
     * (vinculadas a un registro existente en la tabla `barberos`).
     */
    async crearUsuario({ nombre, email, password, rol, barberoId }) {
        if (!nombre || !email || !password || !rol) {
            throw new Error("Nombre, correo, contraseña y rol son obligatorios.");
        }

        if (!["admin", "barbero"].includes(rol)) {
            throw new Error("El rol debe ser 'admin' o 'barbero'.");
        }

        if (password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        const existeEmail = await Usuario.findOne({ where: { email } });
        if (existeEmail) {
            throw new Error("El correo ya está registrado.");
        }

        if (rol === "barbero") {
            if (!barberoId) {
                throw new Error("Debe indicar a qué barbero pertenece esta cuenta.");
            }

            const barbero = await Barbero.findByPk(barberoId);
            if (!barbero) {
                throw new Error("El barbero indicado no existe.");
            }

            const yaTieneCuenta = await Usuario.findOne({ where: { barberoId } });
            if (yaTieneCuenta) {
                throw new Error("Este barbero ya tiene una cuenta de acceso.");
            }
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const usuario = await Usuario.create({
            nombre,
            email,
            password: hash,
            rol,
            barberoId: rol === "barbero" ? barberoId : null,
            debeCambiarPassword: true,
        });

        return this.sanear(usuario);
    }

    async login({ email, password }) {
        if (!email || !password) {
            throw new Error("Correo y contraseña son obligatorios.");
        }

        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario || !usuario.activo) {
            throw new Error("Credenciales inválidas.");
        }

        const coincide = await bcrypt.compare(password, usuario.password);

        if (!coincide) {
            throw new Error("Credenciales inválidas.");
        }

        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            barberoId: usuario.barberoId,
        };

        const token = firmarToken(payload);

        return { token, usuario: this.sanear(usuario) };
    }

    async obtenerPerfil(id) {
        const usuario = await Usuario.findByPk(id, {
            include: [{ model: Barbero, as: "barbero" }],
        });

        if (!usuario) {
            throw new Error("Usuario no encontrado.");
        }

        return this.sanear(usuario);
    }

    /**
     * Lista todos los usuarios del sistema (módulo Gestión de Usuarios,
     * especificación 12.8). Exclusivo del administrador.
     */
    async obtenerTodos() {
        const usuarios = await Usuario.findAll({
            include: [{ model: Barbero, as: "barbero", attributes: ["id", "nombre"] }],
            order: [["id", "ASC"]],
        });

        return usuarios.map((u) => this.sanear(u));
    }

    async obtenerUsuarioPorId(id) {
        const usuario = await Usuario.findByPk(id, {
            include: [{ model: Barbero, as: "barbero", attributes: ["id", "nombre"] }],
        });

        if (!usuario) throw new Error("Usuario no encontrado.");

        return this.sanear(usuario);
    }

    /**
     * Edita un usuario existente: nombre, correo y estado (Activo/Inactivo).
     * El rol no se puede modificar aquí (está atado a la creación de la
     * cuenta y, en el caso de un barbero, a su registro asociado).
     */
    async actualizar(id, { nombre, email, activo }) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) return null;

        if (email && email !== usuario.email) {
            const existente = await Usuario.findOne({ where: { email } });
            if (existente) throw new Error("El correo ya está registrado.");
        }

        const datos = {};
        if (nombre !== undefined) datos.nombre = nombre;
        if (email !== undefined) datos.email = email;
        if (activo !== undefined) datos.activo = activo;

        await usuario.update(datos);

        // Mantiene sincronizado el correo con el registro de Barbero asociado
        // (especificación, capítulo 12.16 — ambos módulos deben permanecer
        // sincronizados).
        if (usuario.barberoId && email) {
            const barbero = await Barbero.findByPk(usuario.barberoId);
            if (barbero && barbero.correo !== email) {
                await barbero.update({ correo: email });
            }
        }

        return this.sanear(usuario);
    }

    /**
     * Restablece la contraseña de un usuario, generando una nueva
     * contraseña temporal (especificación, capítulo 12.9). Se devuelve en
     * texto plano una única vez para que el administrador la comunique.
     * El usuario deberá cambiarla en su próximo inicio de sesión.
     */
    async restablecerPassword(id) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error("Usuario no encontrado.");

        const passwordTemporal = generarPasswordTemporal();
        const hash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

        await usuario.update({ password: hash, debeCambiarPassword: true });

        return passwordTemporal;
    }

    /**
     * Cambio de contraseña por el propio usuario (especificación, capítulos
     * 12.9 y 12.10): se usa tanto para el cambio obligatorio tras una
     * contraseña temporal como para el cambio voluntario desde el perfil.
     */
    async cambiarPassword(id, { passwordActual, passwordNueva }) {
        if (!passwordActual || !passwordNueva) {
            throw new Error("Debe indicar la contraseña actual y la nueva contraseña.");
        }

        if (passwordNueva.length < 6) {
            throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error("Usuario no encontrado.");

        const coincide = await bcrypt.compare(passwordActual, usuario.password);
        if (!coincide) {
            throw new Error("La contraseña actual no es correcta.");
        }

        const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        await usuario.update({ password: hash, debeCambiarPassword: false });

        return this.sanear(usuario);
    }

  
    sanear(usuario) {
        const { password, ...resto } = usuario.toJSON();
        return resto;
    }
}

module.exports = new AuthService();
