const express = require("express");
const router = express.Router();

const servicioController = require("../controllers/servicio.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");


router.get("/", auth, permitirRoles("admin"), servicioController.obtenerTodos);
router.get("/:id", auth, permitirRoles("admin"), servicioController.obtenerPorId);
router.post("/", auth, permitirRoles("admin"), servicioController.crear);
router.put("/:id", auth, permitirRoles("admin"), servicioController.actualizar);
router.delete("/:id", auth, permitirRoles("admin"), servicioController.eliminar);

module.exports = router;
