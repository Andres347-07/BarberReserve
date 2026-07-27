const express = require("express");
const router = express.Router();

const horarioController = require("../controllers/horario.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");

router.get("/", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerTodos(req, res));
router.get("/semana-actual", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerSemanaActual(req, res));
router.get("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerPorId(req, res));

router.post("/", auth, permitirRoles("admin"), (req, res) => horarioController.crear(req, res));
router.post("/semana", auth, permitirRoles("admin"), (req, res) => horarioController.crearSemana(req, res));
router.put("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.actualizar(req, res));
router.delete("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.eliminar(req, res));

module.exports = router;
