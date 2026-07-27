const agendaService = require("../services/agenda.service");
const { ok, fail } = require("../utils/response");

class AgendaController {
    async obtenerDia(req, res) {
        try {
            const fecha = req.query.fecha;
            const esAdmin = req.usuario.rol === "admin";

           
            const barberoId = esAdmin ? req.query.barberoId : req.usuario.barberoId;
            const estado = esAdmin ? req.query.estado : undefined;
            const clienteId = esAdmin ? req.query.clienteId : undefined;

            const agenda = await agendaService.obtenerDia({ fecha, barberoId, estado, clienteId });
            return ok(res, 200, agenda);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }
}

module.exports = new AgendaController();
