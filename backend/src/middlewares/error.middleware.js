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

    // JSON mal formado o cuerpo demasiado grande
    if (err.type === "entity.parse.failed") return fail(res, 400, "El cuerpo de la petición no es JSON válido.");
    if (err.type === "entity.too.large") return fail(res, 413, "La petición es demasiado grande.");

    const status = err.status || err.statusCode || 500;
    // Los errores internos no muestran detalles técnicos (consultas SQL,
    // rutas de archivos) al usuario: quedan solo en el registro del servidor.
    const mensaje =
        status >= 500
            ? "Ocurrió un error inesperado en el servidor."
            : err.message || "La petición no es válida.";

    return fail(res, status, mensaje);
}

module.exports = { noEncontrado, manejadorErrores };
