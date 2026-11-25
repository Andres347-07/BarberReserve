const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");
const permitirRoles = require("../middlewares/role.middleware");
const limitarSolicitudes = require("../middlewares/rateLimit.middleware");

// Límites por IP contra la adivinación de contraseñas y códigos
const limiteLogin = limitarSolicitudes({
    nombre: "login",
    ventanaMs: 15 * 60 * 1000,
    maximo: 10,
    mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.",
});
const limiteSensibles = limitarSolicitudes({
    nombre: "acceso",
    ventanaMs: 60 * 60 * 1000,
    maximo: 8,
    mensaje: "Demasiados intentos. Espera una hora e inténtalo de nuevo.",
});

// Configuración inicial (primer uso): crea al dueño del negocio desde la web.
router.get("/estado-instalacion", (req, res) => authController.estadoInstalacion(req, res));
router.post("/configuracion-inicial", limiteSensibles, (req, res) => authController.configuracionInicial(req, res));
// Ruta anterior (Postman), se mantiene por compatibilidad con las mismas reglas.
router.post("/register", limiteSensibles, (req, res) => authController.registrarPrimerAdmin(req, res));

router.post("/login", limiteLogin, (req, res) => authController.login(req, res));

// El dueño recupera su acceso con el código de recuperación.
router.post("/recuperar-acceso", limiteSensibles, (req, res) => authController.recuperarAcceso(req, res));

router.get("/me", auth, (req, res) => authController.perfil(req, res));


router.put("/cambiar-password", auth, (req, res) => authController.cambiarPassword(req, res));

// Solo el dueño: nuevo código de recuperación y traspaso de la propiedad.
router.post("/codigo-recuperacion", auth, limiteSensibles, permitirRoles("admin"), (req, res) =>
    authController.regenerarCodigo(req, res)
);
router.post("/transferir-propiedad", auth, limiteSensibles, permitirRoles("admin"), (req, res) =>
    authController.transferirPropiedad(req, res)
);

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
