/**
 * Utilidades de fecha y hora para las reglas de negocio de reservas.
 *
 * La barbería trabaja en una zona horaria concreta (por defecto
 * America/Bogota). Antes se usaba `new Date().toISOString()`, que devuelve
 * la fecha en UTC: en Colombia eso hacía que "hoy" cambiara a las 7:00 p. m.
 * Todas las comparaciones de "pasado / futuro" se hacen ahora en la zona de
 * la barbería, sin depender de la zona horaria del servidor.
 */

const ZONA_HORARIA = process.env.APP_TIMEZONE || "America/Bogota";

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** "HH:MM" o "HH:MM:SS" -> minutos desde medianoche. */
function aMinutos(horaStr) {
    const [h, m] = String(horaStr).split(":").map(Number);
    return h * 60 + m;
}

/** Minutos desde medianoche -> "HH:MM". */
function aHora(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    return `${h}:${m}`;
}

/** Fecha y minutos actuales en la zona horaria de la barbería. */
function ahoraEnZona(fechaBase = new Date()) {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(fechaBase);

    const valor = (tipo) => partes.find((p) => p.type === tipo)?.value;

    return {
        fecha: `${valor("year")}-${valor("month")}-${valor("day")}`,
        minutos: Number(valor("hour")) * 60 + Number(valor("minute")),
    };
}

function hoyEnZona() {
    return ahoraEnZona().fecha;
}

/** Valida que la cadena sea una fecha real con formato AAAA-MM-DD. */
function esFechaValida(fecha) {
    if (typeof fecha !== "string" || !REGEX_FECHA.test(fecha)) return false;
    const [y, m, d] = fecha.split("-").map(Number);
    const f = new Date(Date.UTC(y, m - 1, d));
    return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

function esHoraValida(hora) {
    return typeof hora === "string" && REGEX_HORA.test(hora);
}

/** Suma días a una fecha AAAA-MM-DD sin depender de la zona del servidor. */
function sumarDias(fecha, dias) {
    const [y, m, d] = fecha.split("-").map(Number);
    const f = new Date(Date.UTC(y, m - 1, d + dias));
    return f.toISOString().slice(0, 10);
}

/**
 * true si la fecha/hora indicada ya pasó (o es exactamente ahora) en la
 * zona horaria de la barbería.
 */
function esPasado(fecha, hora, ahora = ahoraEnZona()) {
    if (fecha < ahora.fecha) return true;
    if (fecha > ahora.fecha) return false;
    if (hora === undefined || hora === null) return false;
    return aMinutos(hora) <= ahora.minutos;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "2026-11-20" -> "viernes 20 de noviembre" (sin depender de la zona del servidor). */
function fechaLegible(fecha) {
    if (!esFechaValida(fecha)) return String(fecha);
    const [y, m, d] = fecha.split("-").map(Number);
    const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return `${DIAS[dia]} ${d} de ${MESES[m - 1]}`;
}

module.exports = {
    fechaLegible,
    ZONA_HORARIA,
    aMinutos,
    aHora,
    ahoraEnZona,
    hoyEnZona,
    esFechaValida,
    esHoraValida,
    sumarDias,
    esPasado,
};
