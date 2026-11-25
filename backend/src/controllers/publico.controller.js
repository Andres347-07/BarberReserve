const publicoService = require("../services/publico.service");
const reservaService = require("../services/reserva.service");
const { ok, fail } = require("../utils/response");

/**
 * Controlador del portal público de clientes. Ninguna de estas rutas
 * requiere inicio de sesión; por eso solo exponen datos públicos.
 */
class PublicoController {

    async servicios(req, res) {
        try {
            return ok(res, 200, await publicoService.listarServicios());
        } catch (error) {
            return fail(res, 500, "No fue posible cargar los servicios.");
        }
    }

    async barberos(req, res) {
        try {
            return ok(res, 200, await publicoService.listarBarberos());
        } catch (error) {
            return fail(res, 500, "No fue posible cargar los barberos.");
        }
    }

    async configuracion(req, res) {
        try {
            return ok(res, 200, await publicoService.configuracionPublica());
        } catch (error) {
            return fail(res, 500, "No fue posible cargar la configuración.");
        }
    }

    async horasDisponibles(req, res) {
        try {
            const { barberoId, fecha, servicioId } = req.query;
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId, fecha, servicioId, publico: true });
            return ok(res, 200, horas);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async diasDisponibles(req, res) {
        try {
            const { barberoId, servicioId, desde, hasta } = req.query;
            const dias = await reservaService.obtenerDiasDisponibles({ barberoId, servicioId, desde, hasta, publico: true });
            return ok(res, 200, dias);
        } catch (error) {
            return fail(res, 400, error.message);
        }
    }

    async crearReserva(req, res) {
        try {
            const reserva = await publicoService.crearReserva(req.body || {});
            return ok(res, 201, reserva, "Reserva confirmada correctamente.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async consultarReserva(req, res) {
        try {
            const reserva = await publicoService.consultarReserva(req.body || {});
            return ok(res, 200, reserva);
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }

    async cancelarReserva(req, res) {
        try {
            const reserva = await publicoService.cancelarReserva(req.body || {});
            return ok(res, 200, reserva, "La reserva fue cancelada y el horario quedó disponible.");
        } catch (error) {
            return fail(res, error.status || 400, error.message);
        }
    }
}

module.exports = new PublicoController();
