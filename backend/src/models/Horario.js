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

        diaSemana: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        horaInicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        horaFin: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "horarios",
        timestamps: true,
    }
);

module.exports = Horario;