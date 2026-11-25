const express = require("express");
const router = express.Router();

const notificacionController = require("../controllers/notificacion.controller");
const auth = require("../middlewares/auth.middleware");

// Cada usuario (administrador o barbero) solo ve sus propias notificaciones.
router.get("/", auth, (req, res) => notificacionController.listar(req, res));
router.patch("/leidas", auth, (req, res) => notificacionController.marcarTodas(req, res));
router.patch("/:id/leida", auth, (req, res) => notificacionController.marcarLeida(req, res));

module.exports = router;
