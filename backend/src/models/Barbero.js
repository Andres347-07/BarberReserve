const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Barbero = sequelize.define(
    "Barbero",
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

        especialidad: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        telefono: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        correo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        estado: {
            type: DataTypes.STRING,
            defaultValue: "Activo",
        },
    },
    {
        tableName: "barberos",
        timestamps: true,
    }
);

module.exports = Barbero;