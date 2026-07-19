const express = require("express");
const router = express.Router();

const barberoController = require("../controllers/barbero.controller");

router.get("/", barberoController.obtenerTodos);
router.get("/:id", barberoController.obtenerPorId);
router.post("/", barberoController.crear);
router.put("/:id", barberoController.actualizar);
router.delete("/:id", barberoController.eliminar);

module.exports = router;