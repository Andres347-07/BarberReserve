const express = require("express");

const router = express.Router();

const horarioController = require("../controllers/horario.controller");

router.get("/", horarioController.obtenerTodos);

router.get("/:id", horarioController.obtenerPorId);

router.post("/", horarioController.crear);

router.put("/:id", horarioController.actualizar);

router.delete("/:id", horarioController.eliminar);

module.exports = router;