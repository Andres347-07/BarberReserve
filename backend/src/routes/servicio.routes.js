const express = require("express");
const router = express.Router();

const servicioController = require("../controllers/servicio.controller");

router.get("/", servicioController.obtenerTodos);

router.get("/:id", servicioController.obtenerPorId);

router.post("/", servicioController.crear);

router.put("/:id", servicioController.actualizar);

router.delete("/:id", servicioController.eliminar);

module.exports = router;