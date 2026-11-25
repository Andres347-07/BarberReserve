const configuracionService = require("../services/configuracion.service");
const { ok, fail } = require("../utils/response");

class ConfiguracionController {
    async obtener(req, res) {
        try {
            return ok(res, 200, await configuracionService.obtener());
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async actualizar(req, res) {
        try {
            const config = await configuracionService.actualizar(req.body || {});
            return ok(res, 200, config, "Configuración guardada correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }
}

module.exports = new ConfiguracionController();
