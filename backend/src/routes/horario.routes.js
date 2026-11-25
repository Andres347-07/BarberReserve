const express = require("express");
const router = express.Router();

const horarioController = require("../controllers/horario.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");

// Plantilla semanal (2.1). El barbero puede consultar la suya.
router.get("/plantilla/mia", auth, permitirRoles("barbero"), (req, res) => horarioController.obtenerPlantilla(req, res));
router.get("/plantilla/:barberoId", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerPlantilla(req, res));
router.put("/plantilla/:barberoId", auth, permitirRoles("admin"), (req, res) => horarioController.guardarPlantilla(req, res));

// Bloqueos de tiempo: el administrador para cualquier barbero; el barbero solo los suyos.
router.get("/bloqueos", auth, permitirRoles("admin", "barbero"), (req, res) => horarioController.listarBloqueos(req, res));
router.post("/bloqueos", auth, permitirRoles("admin", "barbero"), (req, res) => horarioController.crearBloqueo(req, res));
router.delete("/bloqueos/:id", auth, permitirRoles("admin", "barbero"), (req, res) => horarioController.eliminarBloqueo(req, res));

router.get("/", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerTodos(req, res));
router.get("/semana-actual", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerSemanaActual(req, res));
router.get("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.obtenerPorId(req, res));

router.post("/", auth, permitirRoles("admin"), (req, res) => horarioController.crear(req, res));
router.post("/semana", auth, permitirRoles("admin"), (req, res) => horarioController.crearSemana(req, res));
router.put("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.actualizar(req, res));
router.delete("/:id", auth, permitirRoles("admin"), (req, res) => horarioController.eliminar(req, res));

module.exports = router;
