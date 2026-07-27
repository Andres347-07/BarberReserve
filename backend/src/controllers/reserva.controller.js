const reservaService = require("../services/reserva.service");
const { ok, fail } = require("../utils/response");

class ReservaController {



    async obtenerTodas(req, res) {
        try {
            const filtros = {
                fecha: req.query.fecha,
                estado: req.query.estado,
                clienteId: req.query.clienteId,
                barberoId: req.query.barberoId,
            };

            const reservas = await reservaService.obtenerTodas(filtros);
            return ok(res, 200, reservas);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async obtenerHorasDisponibles(req, res) {
        try {
            const { barberoId, fecha, servicioId } = req.query;
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId, fecha, servicioId });
            return ok(res, 200, horas);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async obtenerPorId(req, res) {
        try {
            const reserva = await reservaService.obtenerPorId(req.params.id);
            if (!reserva) return fail(res, 404, "Reserva no encontrada.");

            return ok(res, 200, reserva);
        } catch (error) {
            return fail(res, 500, error.message);
        }
    }

    async crear(req, res) {
        try {
            const reserva = await reservaService.crear(req.body);
            return ok(res, 201, reserva, "Reserva creada correctamente.");
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async actualizar(req, res) {
        try {
            const reserva = await reservaService.actualizar(req.params.id, req.body, req.usuario);
            if (!reserva) return fail(res, 404, "Reserva no encontrada.");
            return ok(res, 200, reserva, "Reserva actualizada correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async eliminar(req, res) {
        try {
            const eliminado = await reservaService.eliminar(req.params.id);
            if (!eliminado) return fail(res, 404, "Reserva no encontrada.");
            return ok(res, 200, null, "Reserva eliminada correctamente.");
        } catch (error) {
            return fail(res, error.status || 500, error.message);
        }
    }
}

module.exports = new ReservaController();
