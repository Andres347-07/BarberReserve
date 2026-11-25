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

        duracion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Duración en minutos, copiada del servicio al momento de crear la reserva.",
        },

        
        estado: {
            // "Cancelada" se agregó en Barber Reserve 2.0: una reserva
            // cancelada conserva su historial pero deja de ocupar el horario.
            type: DataTypes.ENUM(
                "Pendiente",
                "En proceso",
                "Finalizada",
                "Cancelada",
                // 2.1: el cliente llegó y espera turno / el cliente no llegó.
                "En espera",
                "No asistió"
            ),
            defaultValue: "Pendiente",
            allowNull: false,
        },

        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // Código público con el que el cliente consulta o cancela su reserva
        // desde el portal, sin iniciar sesión (p. ej. "BR-7K3P9Q").
        codigo: {
            type: DataTypes.STRING(12),
            allowNull: true,
            unique: true,
        },

        // Canal por el que se creó la reserva: "admin" (panel) o "web" (portal público).
        origen: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "admin",
        },

        // Minutos de limpieza reservados después del servicio (configuración
        // vigente al momento de crear la cita).
        limpieza: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        canceladaEn: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "reservas",
        timestamps: true,
    }
);

module.exports = Reserva;
