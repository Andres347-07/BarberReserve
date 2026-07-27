const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/", auth, (req, res) => dashboardController.obtenerResumen(req, res));

module.exports = router;
