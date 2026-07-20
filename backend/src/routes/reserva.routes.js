const express = require("express");

const router = express.Router();

const reservaController = require("../controllers/reserva.controller");

router.get("/", reservaController.obtenerTodas);

router.get("/:id", reservaController.obtenerPorId);

router.post("/", reservaController.crear);

module.exports = router;