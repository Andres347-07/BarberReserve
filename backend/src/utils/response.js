
function ok(res, status, data, message) {
    return res.status(status).json({
        success: true,
        ...(message && { message }),
        data,
    });
}

const MENSAJE_INTERNO = "Ocurrió un error inesperado en el servidor.";

function fail(res, status, message, detalles) {
    // Un error 5xx puede traer detalles internos (SQL, rutas, nombres de
    // tablas). Se registran en el servidor y al cliente se le da un mensaje
    // genérico.
    if (status >= 500 && message !== MENSAJE_INTERNO) {
        console.error(`❌ [${status}]`, message);
        message = MENSAJE_INTERNO;
        detalles = undefined;
    }
    return res.status(status).json({
        success: false,
        message,
        ...(detalles && { detalles }),
    });
}

module.exports = { ok, fail };
