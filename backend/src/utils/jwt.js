const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "clave_dev_insegura_cambiar_en_produccion";
const EXPIRA_EN = "8h";

function firmarToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRA_EN });
}

function verificarToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = { firmarToken, verificarToken };
