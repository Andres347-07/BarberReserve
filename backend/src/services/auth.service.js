const bcrypt = require("bcryptjs");
const { fn, col, where: dondeSql } = require("sequelize");

const sequelize = require("../database/connection");
const Usuario = require("../models/Usuario");
const Barbero = require("../models/Barbero");
const configuracionService = require("./configuracion.service");
const { firmarToken } = require("../utils/jwt");
const { esProduccion } = require("../utils/entorno");
const generarPasswordTemporal = require("../utils/generarPassword");
const {
    errorHttp,
    validarPassword,
    normalizarEmail,
    generarCodigoRecuperacion,
    normalizarCodigo,
    igualesSeguro,
} = require("../utils/seguridad");

const SALT_ROUNDS = 10;
const EMAIL_VALIDO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Hash de relleno: se compara aunque el correo no exista para que el tiempo
// de respuesta no revele qué correos están registrados.
const HASH_RELLENO = bcrypt.hashSync("relleno-sin-uso-0", SALT_ROUNDS);

/**
 * Jerarquía de cuentas:
 *   Dueño (administrador con esPropietario) > Administrador > Barbero
 *
 * - El dueño se crea en la configuración inicial (pantalla web, sin Postman).
 * - Solo el dueño crea, edita o desactiva otros administradores y les
 *   restablece la contraseña. También puede traspasar la propiedad.
 * - Nadie puede desactivar al dueño ni cambiarle la contraseña. Si la olvida,
 *   la recupera con su código de recuperación.
 * - No existe un "súper administrador" del desarrollador: sería una puerta
 *   trasera. Si el dueño pierde también el código, se usa el script
 *   `npm run restablecer-acceso`, que exige acceso directo a la base de datos.
 */
class AuthService {

    buscarPorEmail(email, opciones = {}) {
        return Usuario.findOne({
            where: dondeSql(fn("lower", col("email")), normalizarEmail(email)),
            ...opciones,
        });
    }

    // ------------------------------------------------------------------
    // Configuración inicial (primer uso)
    // ------------------------------------------------------------------

    /** Lo que la pantalla de configuración inicial necesita saber. */
    async estadoInstalacion() {
        const instalado = (await Usuario.count({ where: { rol: "admin" } })) > 0;
        const requiereCodigo = Boolean(process.env.CODIGO_INSTALACION);
        const disponible = requiereCodigo || !esProduccion();
        return { instalado, requiereCodigo, disponible };
    }

    /**
     * Crea la cuenta del dueño del negocio. Solo funciona mientras no exista
     * ningún administrador. En producción exige el código de instalación
     * (variable CODIGO_INSTALACION) para que un extraño no pueda adueñarse
     * del sistema recién desplegado.
     *
     * Devuelve el usuario y su código de recuperación (se muestra una sola vez).
     */
    async configuracionInicial({ nombreNegocio, nombre, email, password, codigoInstalacion } = {}) {
        const esperado = process.env.CODIGO_INSTALACION;
        if (esperado) {
            if (!igualesSeguro(String(codigoInstalacion || "").trim(), esperado.trim())) {
                throw errorHttp(403, "El código de instalación no es correcto.");
            }
        } else if (esProduccion()) {
            throw errorHttp(
                403,
                "La configuración inicial está deshabilitada: falta definir CODIGO_INSTALACION en el servidor."
            );
        }

        nombre = typeof nombre === "string" ? nombre.trim() : "";
        email = normalizarEmail(email);
        if (!nombre || !email || !password) {
            throw errorHttp(400, "Nombre, correo y contraseña son obligatorios.");
        }
        if (nombre.length > 80) throw errorHttp(400, "El nombre no puede superar 80 caracteres.");
        if (!EMAIL_VALIDO.test(email)) throw errorHttp(400, "Ingrese un correo electrónico válido.");
        validarPassword(password);

        const negocio = typeof nombreNegocio === "string" ? nombreNegocio.trim() : "";
        if (negocio.length > 80) throw errorHttp(400, "El nombre del negocio no puede superar 80 caracteres.");

        const codigoRecuperacion = generarCodigoRecuperacion();
        const [hash, hashCodigo] = await Promise.all([
            bcrypt.hash(password, SALT_ROUNDS),
            bcrypt.hash(normalizarCodigo(codigoRecuperacion), SALT_ROUNDS),
        ]);

        const usuario = await sequelize.transaction(async (transaction) => {
            // Evita que dos personas configuren el sistema al mismo tiempo
            await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('barberreserve:configuracion-inicial'))", { transaction });

            const existeAdmin = await Usuario.count({ where: { rol: "admin" }, transaction });
            if (existeAdmin) {
                throw errorHttp(
                    409,
                    "El sistema ya fue configurado. Inicia sesión o pide al dueño del negocio que cree tu cuenta."
                );
            }
            if (await this.buscarPorEmail(email, { transaction })) {
                throw errorHttp(400, "El correo ya está registrado.");
            }

            const creado = await Usuario.create(
                { nombre, email, password: hash, rol: "admin", esPropietario: true, recuperacionHash: hashCodigo },
                { transaction }
            );
            return creado;
        });

        if (negocio) await configuracionService.actualizar({ nombreNegocio: negocio });

        return { usuario: this.sanear(usuario), codigoRecuperacion };
    }

    /** Compatibilidad con la ruta anterior POST /api/auth/register. */
    async registrarPrimerAdmin(datos) {
        const { usuario } = await this.configuracionInicial(datos);
        return usuario;
    }

    // ------------------------------------------------------------------
    // Recuperación de acceso del dueño
    // ------------------------------------------------------------------

    async recuperarAcceso({ email, codigoRecuperacion, passwordNueva } = {}) {
        const mensaje = "El correo o el código de recuperación no son correctos.";
        if (!email || !codigoRecuperacion || !passwordNueva) {
            throw errorHttp(400, "Correo, código de recuperación y nueva contraseña son obligatorios.");
        }
        validarPassword(passwordNueva, "La nueva contraseña");

        const usuario = await this.buscarPorEmail(email);
        const valido = await bcrypt.compare(
            normalizarCodigo(codigoRecuperacion),
            usuario?.recuperacionHash || HASH_RELLENO
        );
        if (!usuario || !usuario.esPropietario || !usuario.activo || !usuario.recuperacionHash || !valido) {
            throw errorHttp(400, mensaje);
        }

        // El código es de un solo uso: se entrega uno nuevo
        const nuevoCodigo = generarCodigoRecuperacion();
        await usuario.update({
            password: await bcrypt.hash(passwordNueva, SALT_ROUNDS),
            recuperacionHash: await bcrypt.hash(normalizarCodigo(nuevoCodigo), SALT_ROUNDS),
            debeCambiarPassword: false,
            versionSesion: usuario.versionSesion + 1,
        });
        return { codigoRecuperacion: nuevoCodigo };
    }

    /** El dueño genera un código nuevo (el anterior deja de servir). */
    async regenerarCodigoRecuperacion(usuarioId, { password } = {}) {
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario || !usuario.esPropietario) {
            throw errorHttp(403, "Solo el dueño del negocio tiene código de recuperación.");
        }
        if (!password || !(await bcrypt.compare(password, usuario.password))) {
            throw errorHttp(400, "La contraseña no es correcta.");
        }
        const codigo = generarCodigoRecuperacion();
        await usuario.update({ recuperacionHash: await bcrypt.hash(normalizarCodigo(codigo), SALT_ROUNDS) });
        return { codigoRecuperacion: codigo };
    }

    /**
     * Traspaso de la propiedad: el dueño entrega el negocio a otro
     * administrador activo. El anterior dueño queda como administrador.
     * El nuevo dueño recibe su propio código de recuperación.
     */
    async transferirPropiedad(actor, { usuarioId, password } = {}) {
        const dueño = await Usuario.findByPk(actor.id);
        if (!dueño || !dueño.esPropietario) {
            throw errorHttp(403, "Solo el dueño del negocio puede traspasar la propiedad.");
        }
        if (!password || !(await bcrypt.compare(password, dueño.password))) {
            throw errorHttp(400, "La contraseña no es correcta.");
        }
        const nuevo = await Usuario.findByPk(usuarioId);
        if (!nuevo || nuevo.id === dueño.id) throw errorHttp(400, "Elige otro administrador.");
        if (nuevo.rol !== "admin" || !nuevo.activo) {
            throw errorHttp(400, "La propiedad solo se puede traspasar a un administrador activo.");
        }

        const codigo = generarCodigoRecuperacion();
        const hashCodigo = await bcrypt.hash(normalizarCodigo(codigo), SALT_ROUNDS);
        await sequelize.transaction(async (transaction) => {
            await dueño.update({ esPropietario: false, recuperacionHash: null }, { transaction });
            await nuevo.update({ esPropietario: true, recuperacionHash: hashCodigo }, { transaction });
        });
        return { nuevoDueño: this.sanear(nuevo), codigoRecuperacion: codigo };
    }

    // ------------------------------------------------------------------
    // Usuarios
    // ------------------------------------------------------------------

    /**
     * Creación de usuarios por un administrador autenticado. Solo el dueño
     * puede crear otros administradores.
     */
    async crearUsuario({ nombre, email, password, rol, barberoId }, actor = null) {
        email = normalizarEmail(email);
        nombre = typeof nombre === "string" ? nombre.trim() : nombre;
        if (!nombre || !email || !password || !rol) {
            throw errorHttp(400, "Nombre, correo, contraseña y rol son obligatorios.");
        }

        if (!["admin", "barbero"].includes(rol)) {
            throw errorHttp(400, "El rol debe ser 'admin' o 'barbero'.");
        }
        if (rol === "admin" && actor && !actor.esPropietario) {
            throw errorHttp(403, "Solo el dueño del negocio puede crear administradores.");
        }
        if (!EMAIL_VALIDO.test(email)) throw errorHttp(400, "Ingrese un correo electrónico válido.");

        validarPassword(password);

        if (await this.buscarPorEmail(email)) {
            throw errorHttp(400, "El correo ya está registrado.");
        }

        if (rol === "barbero") {
            if (!barberoId) {
                throw errorHttp(400, "Debe indicar a qué barbero pertenece esta cuenta.");
            }

            const barbero = await Barbero.findByPk(barberoId);
            if (!barbero) {
                throw errorHttp(400, "El barbero indicado no existe.");
            }

            const yaTieneCuenta = await Usuario.findOne({ where: { barberoId } });
            if (yaTieneCuenta) {
                throw errorHttp(400, "Este barbero ya tiene una cuenta de acceso.");
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

    async login({ email, password } = {}) {
        if (!email || !password || typeof password !== "string") {
            throw errorHttp(400, "Correo y contraseña son obligatorios.");
        }

        const usuario = await this.buscarPorEmail(email);
        const coincide = await bcrypt.compare(password.slice(0, 200), usuario?.password || HASH_RELLENO);

        if (!usuario || !usuario.activo || !coincide) {
            throw errorHttp(401, "Credenciales inválidas.");
        }

        return { token: this.emitirToken(usuario), usuario: this.sanear(usuario) };
    }

    emitirToken(usuario) {
        return firmarToken({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            barberoId: usuario.barberoId,
            v: usuario.versionSesion || 0,
        });
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

        if (!usuario) throw errorHttp(404, "Usuario no encontrado.");

        return this.sanear(usuario);
    }

    /**
     * Edita un usuario existente: nombre, correo y estado (Activo/Inactivo).
     * El rol no se puede modificar aquí (está atado a la creación de la
     * cuenta y, en el caso de un barbero, a su registro asociado).
     */
    async actualizar(id, { nombre, email, activo } = {}, actor = null) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) return null;

        const esElMismo = actor && Number(actor.id) === usuario.id;
        if (actor && usuario.rol === "admin" && !esElMismo && !actor.esPropietario) {
            throw errorHttp(403, "Solo el dueño del negocio puede modificar a otros administradores.");
        }
        if (activo === false || activo === "false") {
            if (usuario.esPropietario) {
                throw errorHttp(400, "No se puede desactivar al dueño del negocio. Primero traspasa la propiedad.");
            }
            if (esElMismo) throw errorHttp(400, "No puedes desactivar tu propia cuenta.");
        }

        if (email !== undefined) {
            email = normalizarEmail(email);
            if (!EMAIL_VALIDO.test(email)) throw errorHttp(400, "Ingrese un correo electrónico válido.");
            if (email !== usuario.email) {
                const existente = await this.buscarPorEmail(email);
                if (existente && existente.id !== usuario.id) throw errorHttp(400, "El correo ya está registrado.");
            }
        }

        const datos = {};
        if (nombre !== undefined) datos.nombre = String(nombre).trim();
        if (email !== undefined) datos.email = email;
        if (activo !== undefined) {
            datos.activo = activo === true || activo === "true";
            // Al desactivar, las sesiones abiertas dejan de funcionar
            if (usuario.activo && !datos.activo) datos.versionSesion = usuario.versionSesion + 1;
        }

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
    async restablecerPassword(id, actor = null) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw errorHttp(404, "Usuario no encontrado.");

        if (actor) {
            if (usuario.esPropietario) {
                throw errorHttp(
                    403,
                    "La contraseña del dueño no se puede restablecer desde aquí. El dueño la recupera con su código de recuperación."
                );
            }
            if (usuario.rol === "admin" && !actor.esPropietario) {
                throw errorHttp(403, "Solo el dueño del negocio puede restablecer la contraseña de un administrador.");
            }
        }

        const passwordTemporal = generarPasswordTemporal();
        const hash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

        await usuario.update({
            password: hash,
            debeCambiarPassword: true,
            versionSesion: usuario.versionSesion + 1,
        });

        return passwordTemporal;
    }

    /**
     * Cambio de contraseña por el propio usuario (especificación, capítulos
     * 12.9 y 12.10): se usa tanto para el cambio obligatorio tras una
     * contraseña temporal como para el cambio voluntario desde el perfil.
     */
    async cambiarPassword(id, { passwordActual, passwordNueva }) {
        if (!passwordActual || !passwordNueva) {
            throw errorHttp(400, "Debe indicar la contraseña actual y la nueva contraseña.");
        }

        validarPassword(passwordNueva, "La nueva contraseña");

        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw errorHttp(404, "Usuario no encontrado.");

        const coincide = await bcrypt.compare(passwordActual, usuario.password);
        if (!coincide) {
            throw errorHttp(400, "La contraseña actual no es correcta.");
        }

        const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        // Cierra las demás sesiones abiertas; esta recibe un token nuevo
        await usuario.update({
            password: hash,
            debeCambiarPassword: false,
            versionSesion: usuario.versionSesion + 1,
        });

        return { ...this.sanear(usuario), token: this.emitirToken(usuario) };
    }

  
    sanear(usuario) {
        // eslint-disable-next-line no-unused-vars
        const { password, recuperacionHash, versionSesion, ...resto } = usuario.toJSON();
        return resto;
    }
}

module.exports = new AuthService();
