const horarioService = require("../services/horario.service");
const { ok, fail } = require("../utils/response");

class HorarioController {

    async obtenerPlantilla(req, res) {
        try {
            const barberoId = req.usuario.rol === "barbero" ? req.usuario.barberoId : req.params.barberoId;
            return ok(res, 200, await horarioService.obtenerPlantilla(barberoId));
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async guardarPlantilla(req, res) {
        try {
            const resultado = await horarioService.guardarPlantilla(req.params.barberoId, req.body?.dias);
            return ok(res, 200, resultado, resultado.advertencia || "Plantilla semanal guardada correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async listarBloqueos(req, res) {
        try {
            const barberoId = req.usuario.rol === "barbero" ? req.usuario.barberoId : req.query.barberoId;
            const bloqueos = await horarioService.listarBloqueos({ barberoId, desde: req.query.desde, hasta: req.query.hasta });
            return ok(res, 200, bloqueos);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async crearBloqueo(req, res) {
        try {
            const bloqueo = await horarioService.crearBloqueo(req.body || {}, req.usuario);
            return ok(res, 201, bloqueo, "Horario bloqueado correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async eliminarBloqueo(req, res) {
        try {
            const eliminado = await horarioService.eliminarBloqueo(req.params.id, req.usuario);
            if (!eliminado) return fail(res, 404, "Bloqueo no encontrado.");
            return ok(res, 200, null, "Bloqueo eliminado. El horario vuelve a estar disponible.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }


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
