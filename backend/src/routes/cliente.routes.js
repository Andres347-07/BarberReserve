const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/cliente.controller");

// Obtener todos los clientes
router.get("/", clienteController.obtenerTodos);

// Obtener un cliente por ID
router.get("/:id", clienteController.obtenerPorId);

// Crear un cliente
router.post("/", clienteController.crear);

// Actualizar un cliente
router.put("/:id", clienteController.actualizar);

// Eliminar un cliente
router.delete("/:id", clienteController.eliminar);

module.exports = router;