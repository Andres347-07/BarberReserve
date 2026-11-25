const crypto = require("crypto");

/** Error con código HTTP para que el controlador responda con el estado correcto. */
function errorHttp(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

/**
 * Política de contraseñas: 8 a 72 caracteres (72 es el máximo que bcrypt
 * procesa), con al menos una letra y un número.
 */
function validarPassword(password, etiqueta = "La contraseña") {
    if (typeof password !== "string" || password.length < 8) {
        throw errorHttp(400, `${etiqueta} debe tener al menos 8 caracteres.`);
    }
    if (password.length > 72) {
        throw errorHttp(400, `${etiqueta} no puede superar 72 caracteres.`);
    }
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password) || !/\d/.test(password)) {
        throw errorHttp(400, `${etiqueta} debe combinar letras y números.`);
    }
}

function normalizarEmail(email) {
    return typeof email === "string" ? email.trim().toLowerCase() : email;
}

/**
 * Código de recuperación del dueño: 16 caracteres en 4 grupos
 * (p. ej. "K7QM-3XWD-P9RT-H2NB"), 80 bits de aleatoriedad. Se omiten
 * caracteres que se confunden (0/O, 1/I/L).
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generarCodigoRecuperacion() {
    let codigo = "";
    for (let i = 0; i < 16; i++) codigo += ALFABETO[crypto.randomInt(ALFABETO.length)];
    return codigo.match(/.{4}/g).join("-");
}

function normalizarCodigo(codigo) {
    return typeof codigo === "string" ? codigo.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

/** Comparación en tiempo constante (evita deducir el código por tiempos de respuesta). */
function igualesSeguro(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    if (x.length !== y.length) {
        crypto.timingSafeEqual(x, x);
        return false;
    }
    return crypto.timingSafeEqual(x, y);
}

module.exports = {
    errorHttp,
    validarPassword,
    normalizarEmail,
    generarCodigoRecuperacion,
    normalizarCodigo,
    igualesSeguro,
};
