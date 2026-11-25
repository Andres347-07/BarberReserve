const jwt = require("jsonwebtoken");
const { esProduccion } = require("./entorno");

const EXPIRA_EN = "8h";
const CLAVE_DESARROLLO = "clave_dev_insegura_cambiar_en_produccion";

/**
 * En producción la clave es obligatoria y debe ser larga: con la clave de
 * desarrollo (pública en el repositorio) cualquiera podría fabricar un token
 * de administrador.
 */
function obtenerClave() {
    const clave = process.env.JWT_SECRET;
    if (esProduccion() && (!clave || clave.length < 32 || clave === CLAVE_DESARROLLO)) {
        throw new Error("JWT_SECRET debe definirse en producción con al menos 32 caracteres.");
    }
    return clave || CLAVE_DESARROLLO;
}

const SECRET = obtenerClave();

function firmarToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRA_EN, algorithm: "HS256" });
}

function verificarToken(token) {
    return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

module.exports = { firmarToken, verificarToken, obtenerClave };
