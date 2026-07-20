const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Reserva = sequelize.define(
    "Reserva",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        clienteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        barberoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        servicioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        hora: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        estado: {
            type: DataTypes.ENUM(
                "Pendiente",
                "En proceso",
                "Finalizada",
                "Cancelada"
            ),
            defaultValue: "Pendiente",
            allowNull: false,
        },

        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "reservas",
        timestamps: true,
    }
);

module.exports = Reserva;