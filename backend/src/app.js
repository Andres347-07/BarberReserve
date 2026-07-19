const express = require("express");
const cors = require("cors");

const clienteRoutes = require("./routes/cliente.routes");
const barberoRoutes = require("./routes/barbero.routes");
const servicioRoutes = require("./routes/servicio.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/clientes", clienteRoutes);
app.use("/api/barberos", barberoRoutes);
app.use("/api/servicios", servicioRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 BarberReserve API funcionando correctamente"
    });
});

module.exports = app;