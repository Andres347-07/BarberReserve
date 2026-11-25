const { verificarToken } = require("../utils/jwt");
const { fail } = require("../utils/response");
const Usuario = require("../models/Usuario");

/**
 * Verifica el token JWT ("Authorization: Bearer <token>") y además consulta
 * la cuenta en la base de datos en cada petición. Así:
 *  - una cuenta desactivada pierde el acceso de inmediato,
 *  - cambiar o restablecer la contraseña cierra las sesiones anteriores
 *    (el token guarda la "versión de sesión" con que se emitió),
 *  - el rol y la condición de dueño siempre son los vigentes.
 */
async function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return fail(res, 401, "No se proporcionó un token de acceso.");
    }

    let payload;
    try {
        payload = verificarToken(header.slice(7));
    } catch {
        return fail(res, 401, "Token inválido o expirado.");
    }

    try {
        const usuario = await Usuario.findByPk(payload.id, {
            attributes: ["id", "nombre", "email", "rol", "barberoId", "activo", "esPropietario", "versionSesion"],
        });

        if (!usuario || !usuario.activo || (payload.v ?? 0) !== usuario.versionSesion) {
            return fail(res, 401, "Tu sesión ya no es válida. Inicia sesión de nuevo.");
        }

        req.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            barberoId: usuario.barberoId,
            esPropietario: usuario.esPropietario,
        };

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = auth;
