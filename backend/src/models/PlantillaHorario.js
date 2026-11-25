const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

/**
 * Plantilla semanal de trabajo de un barbero (Barber Reserve 2.1).
 *
 * Igual que en las plataformas de barbería (Fresha, Booksy, AgendaPro), la
 * disponibilidad no sale del horario del local sino del turno de cada
 * barbero. Cada fila es un día de la semana:
 *   - Horario corrido:  08:00 a 15:00, sin pausa.
 *   - Horario partido:  07:00 a 18:00 con pausa 12:00 a 14:00 (almuerzo).
 *   - Descanso:         el barbero no trabaja ese día.
 * Un horario registrado para una fecha concreta (tabla "horarios") es una
 * EXCEPCIÓN y tiene prioridad sobre la plantilla.
 */
const PlantillaHorario = sequelize.define(
    "PlantillaHorario",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        barberoId: { type: DataTypes.INTEGER, allowNull: false },
        // 1 = lunes ... 7 = domingo (ISO 8601)
        diaSemana: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 7 },
        },
        estado: {
            type: DataTypes.ENUM("Activo", "Descanso"),
            allowNull: false,
            defaultValue: "Activo",
        },
        horaInicio: { type: DataTypes.TIME, allowNull: true },
        horaFin: { type: DataTypes.TIME, allowNull: true },
        pausaInicio: { type: DataTypes.TIME, allowNull: true },
        pausaFin: { type: DataTypes.TIME, allowNull: true },
    },
    {
        tableName: "plantillas_horario",
        timestamps: true,
        indexes: [{ unique: true, fields: ["barberoId", "diaSemana"], name: "plantilla_barbero_dia_unique" }],
    }
);

module.exports = PlantillaHorario;
