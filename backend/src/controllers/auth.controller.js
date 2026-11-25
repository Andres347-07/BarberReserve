const authService = require("../services/auth.service");
const { ok, fail } = require("../utils/response");

class AuthController {

    async registrarPrimerAdmin(req, res) {
        try {
            const usuario = await authService.registrarPrimerAdmin(req.body);
            return ok(res, 201, usuario, "Administrador registrado correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async estadoInstalacion(req, res) {
        try {
            return ok(res, 200, await authService.estadoInstalacion());
        } catch (error) {
            return fail(res, 500, "No se pudo consultar el estado del sistema.");
        }
    }

    async configuracionInicial(req, res) {
        try {
            const resultado = await authService.configuracionInicial(req.body);
            return ok(res, 201, resultado, "Barbería configurada correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async recuperarAcceso(req, res) {
        try {
            const resultado = await authService.recuperarAcceso(req.body);
            return ok(res, 200, resultado, "Contraseña actualizada. Guarda tu nuevo código de recuperación.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async regenerarCodigo(req, res) {
        try {
            const resultado = await authService.regenerarCodigoRecuperacion(req.usuario.id, req.body);
            return ok(res, 200, resultado, "Se generó un nuevo código de recuperación.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async transferirPropiedad(req, res) {
        try {
            const resultado = await authService.transferirPropiedad(req.usuario, req.body);
            return ok(res, 200, resultado, "La propiedad del negocio se traspasó correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async crearUsuario(req, res) {
        try {
            const usuario = await authService.crearUsuario(req.body, req.usuario);
            return ok(res, 201, usuario, "Usuario creado correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async login(req, res) {
        try {
            const resultado = await authService.login(req.body);
            return ok(res, 200, resultado, "Inicio de sesión exitoso.");
        } catch (error) {
            return fail(res, error.status || 401, error.message);
        }
    }

    async perfil(req, res) {
        try {
            const usuario = await authService.obtenerPerfil(req.usuario.id);
            return ok(res, 200, usuario);
        } catch (error) {
            return fail(res, error.status || 404, error.message);
        }
    }

    async obtenerTodos(req, res) {
        try {
            const usuarios = await authService.obtenerTodos();
            return ok(res, 200, usuarios);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async obtenerPorId(req, res) {
        try {
            const usuario = await authService.obtenerUsuarioPorId(req.params.id);
            return ok(res, 200, usuario);
        } catch (error) {
            return fail(res, 404, error.message);
        }
    }

    async actualizar(req, res) {
        try {
            const usuario = await authService.actualizar(req.params.id, req.body, req.usuario);
            if (!usuario) return fail(res, 404, "Usuario no encontrado.");
            return ok(res, 200, usuario, "Usuario actualizado correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async restablecerPassword(req, res) {
        try {
            const passwordTemporal = await authService.restablecerPassword(req.params.id, req.usuario);
            return ok(res, 200, { passwordTemporal }, "Contraseña restablecida correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async cambiarPassword(req, res) {
        try {
            const usuario = await authService.cambiarPassword(req.usuario.id, req.body);
            return ok(res, 200, usuario, "Contraseña actualizada correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }
}

module.exports = new AuthController();
