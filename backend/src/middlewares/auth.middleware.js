const { verificarToken } = require("../utils/jwt");
const { fail } = require("../utils/response");

/**
 * Verifica el token JWT enviado en el header Authorization ("Bearer <token>")
 * y añade la información del usuario autenticado en req.usuario.
 */
function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return fail(res, 401, "No se proporcionó un token de acceso.");
    }

    const token = header.split(" ")[1];

    try {
        const payload = verificarToken(token);

        req.usuario = {
            id: payload.id,
            nombre: payload.nombre,
            email: payload.email,
            rol: payload.rol,
            barberoId: payload.barberoId,
        };

        next();
    } catch (error) {
        return fail(res, 401, "Token inválido o expirado.");
    }
}

module.exports = auth;
