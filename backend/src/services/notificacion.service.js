const { Op } = require("sequelize");

const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");
const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Servicio = require("../models/Servicio");
const Barbero = require("../models/Barbero");
const { fechaLegible } = require("../utils/fechaHora");

const PLANTILLAS = {
    nueva: (r) => `Nueva cita en línea: ${r.cliente?.nombre} — ${r.servicio?.nombre} con ${r.barbero?.nombre}, ${fechaLegible(r.fecha)} a las ${String(r.hora).slice(0, 5)}.`,
    nueva_admin: (r) => `Nueva cita: ${r.cliente?.nombre} — ${r.servicio?.nombre} con ${r.barbero?.nombre}, ${fechaLegible(r.fecha)} a las ${String(r.hora).slice(0, 5)}.`,
    cancelada: (r) => `Cita cancelada: ${r.cliente?.nombre} — ${r.servicio?.nombre}, ${fechaLegible(r.fecha)} a las ${String(r.hora).slice(0, 5)}. El horario quedó libre.`,
    reasignada: (r) => `Se le asignó una cita: ${r.cliente?.nombre} — ${r.servicio?.nombre}, ${fechaLegible(r.fecha)} a las ${String(r.hora).slice(0, 5)}.`,
};

/**
 * Avisos dentro del panel. Igual que en las plataformas de barbería, la
 * cita aparece tanto para el barbero asignado como para el administrador.
 * Si la notificación falla, la reserva NO se revierte: se registra el error.
 */
class NotificacionService {

    async _destinatarios(barberoId, { incluirAdmins = true } = {}) {
        const where = { activo: true, [Op.or]: [] };
        if (barberoId) where[Op.or].push({ rol: "barbero", barberoId });
        if (incluirAdmins) where[Op.or].push({ rol: "admin" });
        if (where[Op.or].length === 0) return [];
        return await Usuario.findAll({ where, attributes: ["id"] });
    }

    async notificarReserva(reservaId, tipo, { barberoId, incluirAdmins = true, excluirUsuarioId } = {}) {
        try {
            const reserva = await Reserva.findByPk(reservaId, {
                include: [
                    { model: Cliente, as: "cliente", attributes: ["nombre"] },
                    { model: Servicio, as: "servicio", attributes: ["nombre"] },
                    { model: Barbero, as: "barbero", attributes: ["nombre"] },
                ],
            });
            if (!reserva) return [];

            const mensaje = (PLANTILLAS[tipo] || PLANTILLAS.nueva_admin)(reserva);
            const usuarios = await this._destinatarios(barberoId ?? reserva.barberoId, { incluirAdmins });

            const filas = usuarios
                .filter((u) => u.id !== excluirUsuarioId)
                .map((u) => ({ usuarioId: u.id, reservaId: reserva.id, tipo, mensaje }));

            return await Notificacion.bulkCreate(filas);
        } catch (error) {
            console.error("No fue posible registrar la notificación:", error.message);
            return [];
        }
    }

    async listar(usuarioId, { soloNoLeidas = false, limite = 30 } = {}) {
        const where = { usuarioId };
        if (soloNoLeidas) where.leida = false;
        const [notificaciones, noLeidas] = await Promise.all([
            Notificacion.findAll({ where, order: [["createdAt", "DESC"]], limit: Math.min(Number(limite) || 30, 100) }),
            Notificacion.count({ where: { usuarioId, leida: false } }),
        ]);
        return { notificaciones, noLeidas };
    }

    async marcarLeida(id, usuarioId) {
        const n = await Notificacion.findOne({ where: { id, usuarioId } });
        if (!n) return null;
        await n.update({ leida: true });
        return n;
    }

    async marcarTodasLeidas(usuarioId) {
        const [cantidad] = await Notificacion.update({ leida: true }, { where: { usuarioId, leida: false } });
        return cantidad;
    }
}

module.exports = new NotificacionService();
