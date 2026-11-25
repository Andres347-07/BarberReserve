require("dotenv").config();

const app = require("./app");
const sequelize = require("./database/connection");
const { aplicarMigraciones } = require("./database/migraciones");

// Registrar modelos y relaciones
require("./models");

const PORT = process.env.PORT || 4000;

async function iniciarServidor() {

    try {

        await sequelize.authenticate();
        await sequelize.sync();
        await aplicarMigraciones(sequelize);

        console.log("======================================");
        console.log("✅ Conexión exitosa a PostgreSQL");
        console.log("📦 Modelos sincronizados");
        console.log("🚀 BarberReserve Backend iniciado");
        console.log(`🌐 Puerto ${PORT}`);
        console.log("======================================");

        app.listen(PORT);

    } catch (error) {

        console.error("❌ Error al conectar con PostgreSQL");
        console.error(error);
        // Salir con error para que el hosting marque el despliegue como fallido
        process.exit(1);

    }

}

iniciarServidor();