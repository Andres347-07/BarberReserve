const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

/**
 * Contadores del limitador de solicitudes. Se guardan en la base de datos
 * para que el límite funcione aunque el backend corra en varias instancias
 * o se reinicie.
 */
const LimiteSolicitud = sequelize.define(
    "LimiteSolicitud",
    {
        clave: { type: DataTypes.STRING(120), primaryKey: true },
        conteo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        reinicio: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "limites_solicitud", timestamps: false }
);

module.exports = LimiteSolicitud;
