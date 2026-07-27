const express = require("express");
const router = express.Router();

const reservaController = require("../controllers/reserva.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");


router.get("/", auth, permitirRoles("admin"), (req, res) => reservaController.obtenerTodas(req, res));
router.get("/horas-disponibles", auth, permitirRoles("admin"), (req, res) =>
    reservaController.obtenerHorasDisponibles(req, res)
);
router.get("/:id", auth, permitirRoles("admin"), (req, res) => reservaController.obtenerPorId(req, res));

// Solo el administrador crea y elimina reservas.
router.post("/", auth, permitirRoles("admin"), (req, res) => reservaController.crear(req, res));
router.delete("/:id", auth, permitirRoles("admin"), (req, res) => reservaController.eliminar(req, res));


router.put("/:id", auth, permitirRoles("admin", "barbero"), (req, res) =>
    reservaController.actualizar(req, res)
);

module.exports = router;
