const crypto = require("crypto");
const sequelize = require("../database/connection");
require("../models/LimiteSolicitud");
const { fail } = require("../utils/response");

/**
 * Limitador de solicitudes por IP.
 *
 * Los contadores viven en PostgreSQL (tabla limites_solicitud) con una sola
 * consulta atómica, así el límite se respeta aunque el backend corra en
 * varias instancias o como funciones sin servidor. Si la base de datos no
 * responde, se usa un contador en memoria para no dejar la ruta sin límite.
 *
 * La IP se guarda resumida con SHA-256 (no se almacena la IP en claro).
 */
let secuencia = 0;

const SQL = `
INSERT INTO "limites_solicitud" ("clave", "conteo", "reinicio")
VALUES (:clave, 1, NOW() + (:ventana || ' milliseconds')::interval)
ON CONFLICT ("clave") DO UPDATE SET
    "conteo" = CASE WHEN "limites_solicitud"."reinicio" <= NOW() THEN 1 ELSE "limites_solicitud"."conteo" + 1 END,
    "reinicio" = CASE WHEN "limites_solicitud"."reinicio" <= NOW()
                      THEN NOW() + (:ventana || ' milliseconds')::interval
                      ELSE "limites_solicitud"."reinicio" END
RETURNING "conteo", "reinicio";`;

function limitarSolicitudes({ ventanaMs = 15 * 60 * 1000, maximo = 20, mensaje, nombre } = {}) {
    const prefijo = nombre || `limite${++secuencia}`;
    const memoria = new Map();

    function contarEnMemoria(clave) {
        const ahora = Date.now();
        let registro = memoria.get(clave);
        if (!registro || registro.reinicio <= ahora) {
            registro = { conteo: 0, reinicio: ahora + ventanaMs };
            memoria.set(clave, registro);
        }
        registro.conteo += 1;
        if (memoria.size > 5000) {
            for (const [k, r] of memoria) if (r.reinicio <= ahora) memoria.delete(k);
        }
        return registro;
    }

    async function contar(clave) {
        try {
            const [filas] = await sequelize.query(SQL, { replacements: { clave, ventana: String(ventanaMs) } });
            // Limpieza ocasional de contadores vencidos
            if (Math.random() < 0.01) {
                sequelize.query(`DELETE FROM "limites_solicitud" WHERE "reinicio" < NOW() - interval '1 day'`).catch(() => {});
            }
            return { conteo: Number(filas[0].conteo), reinicio: new Date(filas[0].reinicio).getTime() };
        } catch {
            return contarEnMemoria(clave);
        }
    }

    return async (req, res, next) => {
        if (process.env.DESACTIVAR_LIMITE === "true") return next();

        const ip = req.ip || req.socket?.remoteAddress || "desconocido";
        const huella = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
        const registro = await contar(`${prefijo}:${huella}`);

        if (registro.conteo > maximo) {
            const segundos = Math.max(1, Math.ceil((registro.reinicio - Date.now()) / 1000));
            res.set("Retry-After", String(segundos));
            return fail(res, 429, mensaje || "Demasiadas solicitudes. Intente de nuevo en unos minutos.");
        }

        next();
    };
}

module.exports = limitarSolicitudes;
