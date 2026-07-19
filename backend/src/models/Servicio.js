const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Servicio = sequelize.define(
    "Servicio",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        duracion: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        precio: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: false,
        },

        estado: {
            type: DataTypes.STRING,
            defaultValue: "Activo",
        },
    },
    {
        tableName: "servicios",
        timestamps: true,
    }
);

module.exports = Servicio;