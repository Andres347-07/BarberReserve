/**
 * Estados de una cita (Barber Reserve 2.1) con su etiqueta y estilo. El
 * estado nunca se comunica solo con color: la insignia siempre lleva texto.
 */
export const ESTADOS = {
    "Pendiente": { clase: "estado-pendiente", etiqueta: "Pendiente", cliente: "Confirmada" },
    "En espera": { clase: "estado-en-espera", etiqueta: "En espera", cliente: "Te estamos esperando" },
    "En proceso": { clase: "estado-en-proceso", etiqueta: "En proceso", cliente: "En atención" },
    "Finalizada": { clase: "estado-finalizada", etiqueta: "Finalizada", cliente: "Finalizada" },
    "Cancelada": { clase: "estado-cancelada", etiqueta: "Cancelada", cliente: "Cancelada" },
    "No asistió": { clase: "estado-no-asistio", etiqueta: "No asistió", cliente: "No asististe" },
};

export const LISTA_ESTADOS = Object.keys(ESTADOS);

export function claseEstado(estado) {
    return `estado-badge ${ESTADOS[estado]?.clase || ""}`;
}

export function etiquetaEstado(estado, { cliente = false } = {}) {
    const e = ESTADOS[estado];
    if (!e) return estado;
    return cliente ? e.cliente : e.etiqueta;
}
