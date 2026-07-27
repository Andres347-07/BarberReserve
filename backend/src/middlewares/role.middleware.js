const { fail } = require("../utils/response");

/**
 * Restringe una ruta a uno o varios roles.
 * Debe usarse siempre DESPUÉS del middleware `auth`.
 *
 * Uso: router.post("/", auth, permitirRoles("admin"), controller.crear)
 */
function permitirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return fail(res, 401, "No autenticado.");
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return fail(
                res,
                403,
                "No tiene permisos para realizar esta acción."
            );
        }

        next();
    };
}

module.exports = permitirRoles;
