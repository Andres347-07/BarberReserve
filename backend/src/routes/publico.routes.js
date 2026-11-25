const express = require("express");
const router = express.Router();

const publicoController = require("../controllers/publico.controller");
const limitarSolicitudes = require("../middlewares/rateLimit.middleware");

// Portal público de clientes: sin inicio de sesión.
// La consulta usa POST para que el correo no quede en la URL ni en los logs.

const limiteReservas = limitarSolicitudes({
    ventanaMs: 15 * 60 * 1000,
    maximo: 10,
    mensaje: "Ha realizado demasiados intentos de reserva. Intente de nuevo en unos minutos.",
});

const limiteConsultas = limitarSolicitudes({
    ventanaMs: 15 * 60 * 1000,
    maximo: 30,
    mensaje: "Ha realizado demasiadas consultas. Intente de nuevo en unos minutos.",
});

router.get("/configuracion", (req, res) => publicoController.configuracion(req, res));
router.get("/servicios", (req, res) => publicoController.servicios(req, res));
router.get("/barberos", (req, res) => publicoController.barberos(req, res));
router.get("/horas-disponibles", (req, res) => publicoController.horasDisponibles(req, res));
router.get("/dias-disponibles", (req, res) => publicoController.diasDisponibles(req, res));

router.post("/reservas", limiteReservas, (req, res) => publicoController.crearReserva(req, res));
router.post("/reservas/consultar", limiteConsultas, (req, res) => publicoController.consultarReserva(req, res));
router.post("/reservas/cancelar", limiteConsultas, (req, res) => publicoController.cancelarReserva(req, res));

module.exports = router;
