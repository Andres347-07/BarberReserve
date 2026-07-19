const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Cliente = sequelize.define(
    "Cliente",
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

        telefono: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        correo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        ultimaCita: {
            type: DataTypes.STRING,
            defaultValue: "Sin citas",
        },

        totalVisitas: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: "clientes",
        timestamps: true,
    }
);

module.exports = Cliente;