const express = require("express");
const router = express.Router();

const configuracionController = require("../controllers/configuracion.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");

router.get("/", auth, permitirRoles("admin"), (req, res) => configuracionController.obtener(req, res));
router.put("/", auth, permitirRoles("admin"), (req, res) => configuracionController.actualizar(req, res));

module.exports = router;
