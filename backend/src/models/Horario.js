const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");


const Horario = sequelize.define(
    "Horario",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        barberoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        semana: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        horaInicio: {
            type: DataTypes.TIME,
            allowNull: true,
        },

        horaFin: {
            type: DataTypes.TIME,
            allowNull: true,
        },

        // Pausa dentro del turno (horario partido, p. ej. almuerzo 12:00-14:00).
        pausaInicio: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        pausaFin: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        // Nota visible para el equipo (p. ej. "Vacaciones", "Festivo").
        motivo: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        estado: {
            type: DataTypes.ENUM("Activo", "Descanso"),
            allowNull: false,
            defaultValue: "Activo",
        },
    },
    {
        tableName: "horarios",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["barberoId", "fecha"],
                name: "horarios_barbero_fecha_unique",
            },
        ],
    }
);

module.exports = Horario;
