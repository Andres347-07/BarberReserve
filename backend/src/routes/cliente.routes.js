const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/cliente.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");

// Módulo exclusivo del administrador 
// "Los barberos no tendrán acceso a este módulo")
router.get("/", auth, permitirRoles("admin"), clienteController.obtenerTodos);
router.get("/:id", auth, permitirRoles("admin"), clienteController.obtenerPorId);
router.post("/", auth, permitirRoles("admin"), clienteController.crear);
router.put("/:id", auth, permitirRoles("admin"), clienteController.actualizar);
router.delete("/:id", auth, permitirRoles("admin"), clienteController.eliminar);

module.exports = router;
