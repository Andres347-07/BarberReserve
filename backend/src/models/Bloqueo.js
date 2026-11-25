const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

/**
 * Tiempo bloqueado dentro de la jornada (diligencia, capacitación, cita
 * médica...). Los clientes no pueden reservar en esa franja.
 */
const Bloqueo = sequelize.define(
    "Bloqueo",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        barberoId: { type: DataTypes.INTEGER, allowNull: false },
        fecha: { type: DataTypes.DATEONLY, allowNull: false },
        horaInicio: { type: DataTypes.TIME, allowNull: false },
        horaFin: { type: DataTypes.TIME, allowNull: false },
        motivo: { type: DataTypes.STRING(120), allowNull: true },
        creadoPor: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "admin" },
    },
    { tableName: "bloqueos", timestamps: true }
);

module.exports = Bloqueo;
