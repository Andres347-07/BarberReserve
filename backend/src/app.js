const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

require("./models");

const authRoutes = require("./routes/auth.routes");
const clienteRoutes = require("./routes/cliente.routes");
const barberoRoutes = require("./routes/barbero.routes");
const servicioRoutes = require("./routes/servicio.routes");
const horarioRoutes = require("./routes/horario.routes");
const reservaRoutes = require("./routes/reserva.routes");
const agendaRoutes = require("./routes/agenda.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const publicoRoutes = require("./routes/publico.routes");
const configuracionRoutes = require("./routes/configuracion.routes");
const notificacionRoutes = require("./routes/notificacion.routes");

const { noEncontrado, manejadorErrores } = require("./middlewares/error.middleware");

const app = express();

// No anunciar la tecnología del servidor
app.disable("x-powered-by");

// Cabeceras de seguridad. La API solo devuelve JSON, así que su política de
// contenido es la más estricta posible.
app.use(
    helmet({
        contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// Detrás del proxy de Render (u otro hosting) req.ip debe ser la IP real del
// cliente; de lo contrario el limitador de solicitudes contaría a todos juntos.
if (process.env.TRUST_PROXY) {
    const valor = process.env.TRUST_PROXY;
    app.set("trust proxy", /^\d+$/.test(valor) ? Number(valor) : valor === "true");
}

// CORS: en producción solo se aceptan los dominios de CORS_ORIGIN
// (separados por coma). Sin la variable se acepta cualquier origen (desarrollo).
const origenes = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean)
    // Render entrega solo el dominio cuando el valor viene de otro servicio
    .map((o) => (/^https?:\/\//i.test(o) ? o : `https://${o}`));
app.use(cors(origenes.length ? { origin: origenes } : undefined));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 BarberReserve API funcionando correctamente"
    });
});

// Ruta de salud para el hosting (verifica también la base de datos)
app.get("/api/salud", async (req, res) => {
    try {
        await require("./database/connection").authenticate();
        res.json({ success: true, estado: "ok" });
    } catch {
        res.status(503).json({ success: false, estado: "sin base de datos" });
    }
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
app.use("/api/publico", publicoRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/notificaciones", notificacionRoutes);


app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
