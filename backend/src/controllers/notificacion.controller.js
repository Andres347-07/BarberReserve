const notificacionService = require("../services/notificacion.service");
const { ok, fail } = require("../utils/response");

class NotificacionController {
    async listar(req, res) {
        try {
            const datos = await notificacionService.listar(req.usuario.id, {
                soloNoLeidas: req.query.noLeidas === "true",
                limite: req.query.limite,
            });
            return ok(res, 200, datos);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async marcarLeida(req, res) {
        try {
            const n = await notificacionService.marcarLeida(req.params.id, req.usuario.id);
            if (!n) return fail(res, 404, "Notificación no encontrada.");
            return ok(res, 200, n);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async marcarTodas(req, res) {
        try {
            const cantidad = await notificacionService.marcarTodasLeidas(req.usuario.id);
            return ok(res, 200, { cantidad }, "Notificaciones marcadas como leídas.");
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }
}

module.exports = new NotificacionController();
