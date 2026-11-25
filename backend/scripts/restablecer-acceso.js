/**
 * Último recurso: el dueño perdió su contraseña Y su código de recuperación.
 *
 * Se ejecuta en un computador con acceso directo a la base de datos (las
 * mismas variables de entorno del backend, por ejemplo la DATABASE_URL externa
 * o de Render). No existe una ruta web equivalente: así nadie puede usarlo
 * desde internet.
 *
 *   npm run restablecer-acceso -- dueno@correo.com
 *
 * Asigna una contraseña temporal (que debe cambiarse al entrar), genera un
 * código de recuperación nuevo y cierra las sesiones abiertas de esa cuenta.
 * Si el correo es de un administrador y no hay dueño, lo convierte en dueño.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");

const sequelize = require("../src/database/connection");
require("../src/models");
const Usuario = require("../src/models/Usuario");
const generarPasswordTemporal = require("../src/utils/generarPassword");
const { generarCodigoRecuperacion, normalizarCodigo, normalizarEmail } = require("../src/utils/seguridad");

async function main() {
    const email = normalizarEmail(process.argv[2]);
    if (!email) {
        console.error("Uso: npm run restablecer-acceso -- correo@del-dueno.com");
        process.exit(1);
    }

    await sequelize.authenticate();
    const usuario = await Usuario.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), email) });
    if (!usuario || usuario.rol !== "admin") {
        console.error("No existe un administrador con ese correo.");
        process.exit(1);
    }

    const hayDueño = await Usuario.count({ where: { esPropietario: true } });
    if (!usuario.esPropietario && hayDueño) {
        console.error("Esa cuenta no es la del dueño. El dueño puede restablecerle la contraseña desde el panel.");
        process.exit(1);
    }

    const password = generarPasswordTemporal();
    const codigo = generarCodigoRecuperacion();
    await usuario.update({
        esPropietario: true,
        activo: true,
        password: await bcrypt.hash(password, 10),
        recuperacionHash: await bcrypt.hash(normalizarCodigo(codigo), 10),
        debeCambiarPassword: true,
        versionSesion: usuario.versionSesion + 1,
    });

    console.log("\nAcceso restablecido para", usuario.email);
    console.log("  Contraseña temporal:   ", password, "(se pedirá cambiarla al entrar)");
    console.log("  Código de recuperación:", codigo, "(guárdalo en un lugar seguro)\n");
    await sequelize.close();
}

main().catch((error) => {
    console.error("No se pudo restablecer el acceso:", error.message);
    process.exit(1);
});
