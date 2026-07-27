const express = require("express");
const router = express.Router();

const agendaController = require("../controllers/agenda.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/", auth, (req, res) => agendaController.obtenerDia(req, res));

module.exports = router;
