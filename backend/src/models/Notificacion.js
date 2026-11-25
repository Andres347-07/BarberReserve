const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

/**
 * Aviso dentro del panel. Cuando un cliente reserva o cancela, se notifica
 * al barbero asignado y a los administradores (como en AgendaPro/Booksy,
 * donde la cita aparece en la agenda del dueño y del barbero).
 */
const Notificacion = sequelize.define(
    "Notificacion",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        usuarioId: { type: DataTypes.INTEGER, allowNull: false },
        reservaId: { type: DataTypes.INTEGER, allowNull: true },
        tipo: { type: DataTypes.STRING(20), allowNull: false },
        mensaje: { type: DataTypes.STRING(300), allowNull: false },
        leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "notificaciones",
        timestamps: true,
        indexes: [{ fields: ["usuarioId", "leida"], name: "notificaciones_usuario_leida_idx" }],
    }
);

module.exports = Notificacion;
