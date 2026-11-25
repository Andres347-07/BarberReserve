const { Op } = require("sequelize");

const Horario = require("../models/Horario");
const PlantillaHorario = require("../models/PlantillaHorario");
const Bloqueo = require("../models/Bloqueo");
const { aMinutos, sumarDias } = require("../utils/fechaHora");

/** 1 = lunes ... 7 = domingo, a partir de "AAAA-MM-DD" (sin depender de la zona del servidor). */
function diaSemanaISO(fecha) {
    const [y, m, d] = fecha.split("-").map(Number);
    const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return dia === 0 ? 7 : dia;
}

/**
 * Convierte un turno (con pausa opcional) en bloques de trabajo en minutos.
 * Horario partido 07:00-18:00 con pausa 12:00-14:00 -> [07:00-12:00] y [14:00-18:00].
 */
function bloquesDeTurno(turno) {
    if (!turno || turno.estado !== "Activo" || !turno.horaInicio || !turno.horaFin) return [];

    const inicio = aMinutos(turno.horaInicio);
    const fin = aMinutos(turno.horaFin);
    if (fin <= inicio) return [];

    if (turno.pausaInicio && turno.pausaFin) {
        const pIni = aMinutos(turno.pausaInicio);
        const pFin = aMinutos(turno.pausaFin);
        if (pIni > inicio && pFin < fin && pFin > pIni) {
            return [{ inicio, fin: pIni }, { inicio: pFin, fin }];
        }
    }

    return [{ inicio, fin }];
}

/** Minutos efectivos de trabajo de un turno (sin la pausa). */
function minutosDeTurno(turno) {
    return bloquesDeTurno(turno).reduce((total, b) => total + (b.fin - b.inicio), 0);
}

function construirJornada(fecha, excepcion, plantilla, bloqueos) {
    const turno = excepcion || plantilla || null;
    const origen = excepcion ? "excepcion" : plantilla ? "plantilla" : null;

    return {
        fecha,
        origen,
        estado: turno ? turno.estado : "SinTurno",
        horaInicio: turno?.horaInicio?.slice(0, 5) || null,
        horaFin: turno?.horaFin?.slice(0, 5) || null,
        pausaInicio: turno?.pausaInicio?.slice(0, 5) || null,
        pausaFin: turno?.pausaFin?.slice(0, 5) || null,
        motivo: excepcion?.motivo || null,
        bloques: bloquesDeTurno(turno),
        bloqueos: (bloqueos || []).map((b) => ({
            id: b.id,
            inicio: aMinutos(b.horaInicio),
            fin: aMinutos(b.horaFin),
            horaInicio: b.horaInicio.slice(0, 5),
            horaFin: b.horaFin.slice(0, 5),
            motivo: b.motivo,
        })),
    };
}

/**
 * Jornada real de un barbero en una fecha. Prioridad:
 *   1) Excepción registrada para esa fecha (tabla horarios).
 *   2) Plantilla semanal del barbero para ese día de la semana.
 *   3) Sin turno: no atiende.
 * Incluye los bloqueos de tiempo de ese día.
 */
async function obtenerJornada(barberoId, fecha, transaction) {
    const [excepcion, plantilla, bloqueos] = await Promise.all([
        Horario.findOne({ where: { barberoId, fecha }, transaction }),
        PlantillaHorario.findOne({ where: { barberoId, diaSemana: diaSemanaISO(fecha) }, transaction }),
        Bloqueo.findAll({ where: { barberoId, fecha }, order: [["horaInicio", "ASC"]], transaction }),
    ]);
    return construirJornada(fecha, excepcion, plantilla, bloqueos);
}

/** Jornadas de un rango de fechas con solo tres consultas. */
async function obtenerJornadas(barberoId, desde, hasta) {
    const [excepciones, plantillas, bloqueos] = await Promise.all([
        Horario.findAll({ where: { barberoId, fecha: { [Op.between]: [desde, hasta] } } }),
        PlantillaHorario.findAll({ where: { barberoId } }),
        Bloqueo.findAll({ where: { barberoId, fecha: { [Op.between]: [desde, hasta] } } }),
    ]);

    const jornadas = {};
    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
        jornadas[fecha] = construirJornada(
            fecha,
            excepciones.find((h) => h.fecha === fecha),
            plantillas.find((p) => p.diaSemana === diaSemanaISO(fecha)),
            bloqueos.filter((b) => b.fecha === fecha)
        );
    }
    return jornadas;
}

module.exports = { obtenerJornada, obtenerJornadas, bloquesDeTurno, minutosDeTurno, diaSemanaISO };
