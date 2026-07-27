const authService = require("../services/auth.service");
const { ok, fail } = require("../utils/response");

class AuthController {

    async registrarPrimerAdmin(req, res) {
        try {
            const usuario = await authService.registrarPrimerAdmin(req.body);
            return ok(res, 201, usuario, "Administrador registrado correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async crearUsuario(req, res) {
        try {
            const usuario = await authService.crearUsuario(req.body);
            return ok(res, 201, usuario, "Usuario creado correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async login(req, res) {
        try {
            const resultado = await authService.login(req.body);
            return ok(res, 200, resultado, "Inicio de sesión exitoso.");
        } catch (error) {
            return fail(res, 401, error.message);
        }
    }

    async perfil(req, res) {
        try {
            const usuario = await authService.obtenerPerfil(req.usuario.id);
            return ok(res, 200, usuario);
        } catch (error) {
            return fail(res, 404, error.message);
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
            const usuario = await authService.actualizar(req.params.id, req.body);
            if (!usuario) return fail(res, 404, "Usuario no encontrado.");
            return ok(res, 200, usuario, "Usuario actualizado correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async restablecerPassword(req, res) {
        try {
            const passwordTemporal = await authService.restablecerPassword(req.params.id);
            return ok(res, 200, { passwordTemporal }, "Contraseña restablecida correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async cambiarPassword(req, res) {
        try {
            const usuario = await authService.cambiarPassword(req.usuario.id, req.body);
            return ok(res, 200, usuario, "Contraseña actualizada correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }
}

module.exports = new AuthController();
