const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Usuario = sequelize.define(
    "Usuario",
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

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        rol: {
            type: DataTypes.ENUM("admin", "barbero"),
            allowNull: false,
            defaultValue: "barbero",
        },

        barberoId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        // Se activa cuando el sistema le asigna una contraseña temporal al
        // usuario (creación de cuenta o restablecimiento por un admin). El
        // frontend debe obligar a cambiarla antes de continuar usando la
        // aplicación 
        debeCambiarPassword: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "usuarios",
        timestamps: true,
    }
);

module.exports = Usuario;
