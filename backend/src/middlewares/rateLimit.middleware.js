const { fail } = require("../utils/response");

/**
 * Limitador de solicitudes en memoria, sin dependencias externas.
 * Protege los endpoints públicos (sin inicio de sesión) contra el envío
 * masivo de reservas o la búsqueda de códigos por fuerza bruta.
 *
 * Nota: el contador vive en la memoria del proceso. Si el backend se
 * ejecuta con varias instancias, conviene reemplazarlo por un almacén
 * compartido (p. ej. Redis).
 */
function limitarSolicitudes({ ventanaMs = 15 * 60 * 1000, maximo = 20, mensaje } = {}) {
    const registros = new Map();

    const limpiar = setInterval(() => {
        const ahora = Date.now();
        for (const [clave, registro] of registros) {
            if (registro.reinicio <= ahora) registros.delete(clave);
        }
    }, ventanaMs);
    limpiar.unref?.();

    return (req, res, next) => {
        if (process.env.DESACTIVAR_LIMITE === "true") return next();

        const clave = req.ip || req.socket?.remoteAddress || "desconocido";
        const ahora = Date.now();
        let registro = registros.get(clave);

        if (!registro || registro.reinicio <= ahora) {
            registro = { conteo: 0, reinicio: ahora + ventanaMs };
            registros.set(clave, registro);
        }

        registro.conteo += 1;

        if (registro.conteo > maximo) {
            res.set("Retry-After", String(Math.ceil((registro.reinicio - ahora) / 1000)));
            return fail(res, 429, mensaje || "Demasiadas solicitudes. Intente de nuevo en unos minutos.");
        }

        next();
    };
}

module.exports = limitarSolicitudes;
