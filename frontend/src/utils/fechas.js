/**
 * Utilidades de fecha del frontend. Se trabaja siempre con la fecha LOCAL
 * del navegador: `new Date().toISOString()` devuelve la fecha en UTC, lo que
 * en Colombia (UTC-5) mostraba el día siguiente a partir de las 7:00 p. m.
 */

export function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoyISO() {
  return aISO(new Date());
}

/** "2026-11-20" -> Date local (sin desfase de zona horaria). */
export function desdeISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso, dias) {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

export function fechaLarga(iso) {
  if (!iso) return "";
  return desdeISO(iso).toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function fechaCorta(iso) {
  if (!iso) return "";
  return desdeISO(iso).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
}

/** "14:30" -> "2:30 p. m." */
export function hora12(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const f = new Date(2000, 0, 1, h, m);
  return f.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function moneda(valor) {
  return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function duracionTexto(minutos) {
  const m = Number(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
