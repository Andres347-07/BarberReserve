const horarioService = require("../services/horario.service");
const { ok, fail } = require("../utils/response");

class HorarioController {

    async obtenerTodos(req, res) {
        try {
            const { barberoId, semana, desde, hasta } = req.query;
            const horarios = await horarioService.obtenerTodos({ barberoId, semana, desde, hasta });
            return ok(res, 200, horarios);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async obtenerSemanaActual(req, res) {
        try {
            const semana = await horarioService.obtenerSemanaActual(req.query.barberoId);
            return ok(res, 200, semana);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async obtenerPorId(req, res) {
        try {
            const horario = await horarioService.obtenerPorId(req.params.id);
            if (!horario) return fail(res, 404, "Horario no encontrado.");
            return ok(res, 200, horario);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async crear(req, res) {
        try {
            const horario = await horarioService.crear(req.body);
            return ok(res, 201, horario, "Turno creado correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async crearSemana(req, res) {
        try {
            const horarios = await horarioService.crearSemana(req.body);
            return ok(res, 201, horarios, "Turnos de la semana guardados correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async actualizar(req, res) {
        try {
            const horario = await horarioService.actualizar(req.params.id, req.body);
            if (!horario) return fail(res, 404, "Horario no encontrado.");
            return ok(res, 200, horario, "Turno actualizado correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async eliminar(req, res) {
        try {
            const eliminado = await horarioService.eliminar(req.params.id);
            if (!eliminado) return fail(res, 404, "Horario no encontrado.");
            return ok(res, 200, null, "Turno eliminado correctamente.");
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }
}

module.exports = new HorarioController();
