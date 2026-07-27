const { fail } = require("../utils/response");

/**
 * Middleware para rutas no encontradas (404).
 */
function noEncontrado(req, res) {
    return fail(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

/**
 * Middleware centralizado de manejo de errores. Debe registrarse al final
 * de app.js, después de todas las rutas.
 */
function manejadorErrores(err, req, res, next) {
    console.error("❌", err);

    // Errores de validación / restricciones propias de Sequelize
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
        const detalles = err.errors?.map((e) => e.message);
        return fail(res, 400, "Error de validación.", detalles);
    }

    const status = err.status || 500;
    const mensaje = err.message || "Ocurrió un error inesperado en el servidor.";

    return fail(res, status, mensaje);
}

module.exports = { noEncontrado, manejadorErrores };
