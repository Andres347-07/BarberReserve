export const aMin = (h) => {
    if (!h) return null;
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
};

/** Horas efectivas de un turno (descontando la pausa). */
export function horasDelTurno(dia) {
    if (dia.estado !== "Activo") return 0;
    const ini = aMin(dia.horaInicio);
    const fin = aMin(dia.horaFin);
    if (ini === null || fin === null || fin <= ini) return 0;
    let total = fin - ini;
    const pIni = aMin(dia.pausaInicio);
    const pFin = aMin(dia.pausaFin);
    if (pIni !== null && pFin !== null && pFin > pIni && pIni > ini && pFin < fin) total -= pFin - pIni;
    return total / 60;
}

export function formatoHoras(h) {
    const horas = Math.floor(h);
    const min = Math.round((h - horas) * 60);
    return min ? `${horas} h ${min} min` : `${horas} h`;
}

/** Errores por día, con el mismo criterio que el servidor. */
export function validarTurno(dia) {
    if (dia.estado !== "Activo") return "";
    const ini = aMin(dia.horaInicio);
    const fin = aMin(dia.horaFin);
    if (ini === null || fin === null) return "Indique la hora de entrada y de salida.";
    if (ini >= fin) return "La entrada debe ser antes que la salida.";
    const pIni = aMin(dia.pausaInicio);
    const pFin = aMin(dia.pausaFin);
    if ((pIni === null) !== (pFin === null)) return "Complete el inicio y el fin de la pausa, o deje ambos vacíos.";
    if (pIni !== null) {
        if (pFin <= pIni) return "El fin de la pausa debe ser después de su inicio.";
        if (pIni <= ini || pFin >= fin) return "La pausa debe quedar dentro del turno.";
    }
    return "";
}
