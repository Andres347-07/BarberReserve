
function generarPasswordTemporal() {
    const letras = "abcdefghijkmnpqrstuvwxyz";
    const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numeros = "23456789";
    const simbolos = "!@#$%";

    const elegir = (grupo) => grupo[Math.floor(Math.random() * grupo.length)];

    let password = elegir(mayusculas) + elegir(numeros) + elegir(simbolos);

    for (let i = 0; i < 6; i++) {
        password += elegir(letras + mayusculas + numeros);
    }

    
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
}

module.exports = generarPasswordTemporal;
