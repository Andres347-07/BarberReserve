const express = require("express");

const router = express.Router();

const reservaController = require("../controllers/reserva.controller");

router.get("/", reservaController.obtenerTodas);

router.get("/:id", reservaController.obtenerPorId);

router.post("/", reservaController.crear);

router.put("/:id", reservaController.actualizar);

router.delete("/:id", reservaController.eliminar);

module.exports = router;