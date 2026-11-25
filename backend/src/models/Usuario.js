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

        // Dueño del negocio: es el administrador principal. Solo hay uno.
        // Puede crear y gestionar otros administradores y traspasar la
        // propiedad. Nadie más puede desactivarlo ni cambiar su contraseña.
        esPropietario: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        // Se incrementa al cambiar o restablecer la contraseña y al
        // desactivar la cuenta: invalida las sesiones abiertas.
        versionSesion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        // Hash (bcrypt) del código de recuperación del dueño. Permite
        // recuperar el acceso sin correo electrónico ni soporte técnico.
        recuperacionHash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "usuarios",
        timestamps: true,
    }
);

module.exports = Usuario;
