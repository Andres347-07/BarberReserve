const express = require("express");
const cors = require("cors");

require("./models");

const authRoutes = require("./routes/auth.routes");
const clienteRoutes = require("./routes/cliente.routes");
const barberoRoutes = require("./routes/barbero.routes");
const servicioRoutes = require("./routes/servicio.routes");
const horarioRoutes = require("./routes/horario.routes");
const reservaRoutes = require("./routes/reserva.routes");
const agendaRoutes = require("./routes/agenda.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const { noEncontrado, manejadorErrores } = require("./middlewares/error.middleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 BarberReserve API funcionando correctamente"
    });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/barberos", barberoRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/horarios", horarioRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
