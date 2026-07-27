const express = require("express");
const router = express.Router();

const barberoController = require("../controllers/barbero.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");


router.get("/", auth, permitirRoles("admin"), barberoController.obtenerTodos);
router.get("/:id", auth, permitirRoles("admin"), barberoController.obtenerPorId);
router.post("/", auth, permitirRoles("admin"), barberoController.crear);
router.put("/:id", auth, permitirRoles("admin"), barberoController.actualizar);
router.delete("/:id", auth, permitirRoles("admin"), barberoController.eliminar);

module.exports = router;
