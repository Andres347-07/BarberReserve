const dashboardService = require("../services/dashboard.service");
const { ok, fail } = require("../utils/response");

class DashboardController {
    async obtenerResumen(req, res) {
        try {
            if (req.usuario.rol === "admin") {
                const resumen = await dashboardService.resumenAdmin();
                return ok(res, 200, resumen);
            }

            const resumen = await dashboardService.resumenBarbero(req.usuario.barberoId);
            return ok(res, 200, resumen);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }
}

module.exports = new DashboardController();
