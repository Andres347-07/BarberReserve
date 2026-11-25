const agendaService = require("../services/agenda.service");
const { ok, fail } = require("../utils/response");

class AgendaController {
    async obtenerDia(req, res) {
        try {
            const esAdmin = req.usuario.rol === "admin";

            // El barbero solo ve su propia agenda.
            const barberoId = esAdmin ? req.query.barberoId : req.usuario.barberoId;
            const estado = esAdmin ? req.query.estado : undefined;
            const clienteId = esAdmin ? req.query.clienteId : undefined;

            if (req.query.desde && req.query.hasta) {
                const agenda = await agendaService.obtenerRango({
                    desde: req.query.desde, hasta: req.query.hasta, barberoId, estado,
                });
                return ok(res, 200, agenda);
            }

            const agenda = await agendaService.obtenerDia({ fecha: req.query.fecha, barberoId, estado, clienteId });
            return ok(res, 200, agenda);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }
}

module.exports = new AgendaController();
