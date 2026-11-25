const crypto = require("crypto");

/**
 * Contraseña temporal de 10 caracteres con mayúscula, número y símbolo.
 * Usa crypto.randomInt (aleatoriedad criptográfica), no Math.random.
 */
function generarPasswordTemporal() {
    const letras = "abcdefghijkmnpqrstuvwxyz";
    const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numeros = "23456789";
    const simbolos = "!@#$%";

    const elegir = (grupo) => grupo[crypto.randomInt(grupo.length)];

    const caracteres = [elegir(mayusculas), elegir(numeros), elegir(simbolos), elegir(letras)];
    for (let i = 0; i < 6; i++) caracteres.push(elegir(letras + mayusculas + numeros));

    // Mezcla de Fisher-Yates con aleatoriedad criptográfica
    for (let i = caracteres.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join("");
}

module.exports = generarPasswordTemporal;
