require("dotenv").config();

const app = require("./app");
const sequelize = require("./database/connection");

// Registrar modelos
require("./models/Cliente");
require("./models/Barbero");
require("./models/Servicio");

const PORT = process.env.PORT || 4000;

async function iniciarServidor() {

    try {

        await sequelize.authenticate();
        await sequelize.sync();

        console.log("======================================");
        console.log("✅ Conexión exitosa a PostgreSQL");
        console.log("📦 Modelos sincronizados");
        console.log("🚀 BarberReserve Backend iniciado");
        console.log(`🌐 http://localhost:${PORT}`);
        console.log("======================================");

        app.listen(PORT);

    } catch (error) {

        console.error("❌ Error al conectar con PostgreSQL");
        console.error(error);

    }

}

iniciarServidor();