const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

/**
 * Reglas del negocio que el administrador puede ajustar (una sola fila).
 * Valores por defecto tomados de la práctica de las plataformas de
 * barbería investigadas.
 */
const Configuracion = sequelize.define(
    "Configuracion",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombreNegocio: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "Barber Reserve" },
        // Minutos de limpieza/preparación entre un cliente y el siguiente.
        minutosLimpieza: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
        // Cada cuántos minutos se ofrece un cupo. 0 = según la duración del servicio.
        intervaloCupos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
        // Reserva en línea: anticipación mínima y máxima.
        anticipacionMinutos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
        diasMaximos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
        // El cliente puede cancelar en línea hasta N horas antes.
        horasLimiteCancelacion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        // Minutos de tolerancia antes de poder marcar "No asistió".
        minutosToleranciaNoAsistio: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
        // Tope semanal de la jornada (Ley 2101 de 2021: 42 h desde el 15/07/2026).
        horasSemanalesMaximas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 42 },
    },
    { tableName: "configuracion", timestamps: true }
);

module.exports = Configuracion;
