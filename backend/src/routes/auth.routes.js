const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");

// Bootstrap: solo funciona si aún no existe ningún administrador.
router.post("/register", (req, res) => authController.registrarPrimerAdmin(req, res));

router.post("/login", (req, res) => authController.login(req, res));

router.get("/me", auth, (req, res) => authController.perfil(req, res));


router.put("/cambiar-password", auth, (req, res) => authController.cambiarPassword(req, res));

// Un administrador autenticado crea cuentas (admin o barbero).
router.post("/usuarios", auth, permitirRoles("admin"), (req, res) =>
    authController.crearUsuario(req, res)
);

router.get("/usuarios", auth, permitirRoles("admin"), (req, res) =>
    authController.obtenerTodos(req, res)
);
router.get("/usuarios/:id", auth, permitirRoles("admin"), (req, res) =>
    authController.obtenerPorId(req, res)
);
router.put("/usuarios/:id", auth, permitirRoles("admin"), (req, res) =>
    authController.actualizar(req, res)
);
router.put("/usuarios/:id/restablecer-password", auth, permitirRoles("admin"), (req, res) =>
    authController.restablecerPassword(req, res)
);

module.exports = router;
