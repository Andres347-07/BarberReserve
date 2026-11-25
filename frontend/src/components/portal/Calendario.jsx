import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import { aISO, desdeISO, sumarDias, fechaLarga } from "../../utils/fechas";

import "./Calendario.css";

const DIAS = [
  { corto: "Lun", largo: "lunes" },
  { corto: "Mar", largo: "martes" },
  { corto: "Mié", largo: "miércoles" },
  { corto: "Jue", largo: "jueves" },
  { corto: "Vie", largo: "viernes" },
  { corto: "Sáb", largo: "sábado" },
  { corto: "Dom", largo: "domingo" },
];

function primerDiaMes(iso) {
  const f = desdeISO(iso);
  return aISO(new Date(f.getFullYear(), f.getMonth(), 1));
}

function nombreMes(iso) {
  return desdeISO(iso).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function mismoMes(a, b) {
  return a.slice(0, 7) === b.slice(0, 7);
}

/**
 * Calendario mensual accesible (patrón "grid" de WAI-ARIA):
 *  - Tab entra a la cuadrícula en un solo punto (tabindex itinerante).
 *  - Flechas: día anterior/siguiente y semana anterior/siguiente.
 *  - Inicio/Fin: comienzo/fin de la semana. RePág/AvPág: mes anterior/siguiente.
 *  - Enter o Espacio seleccionan el día.
 * La disponibilidad no se comunica solo con color: cada día tiene una
 * etiqueta completa ("jueves, 20 de noviembre: 8 horas disponibles").
 */
export default function Calendario({
  mes,                 // "AAAA-MM-01" del mes visible
  onCambiarMes,
  seleccionada,
  onSeleccionar,
  disponibilidad = {}, // { "AAAA-MM-DD": { horasDisponibles, estado } }
  minFecha,
  maxFecha,
  cargando = false,
  idTitulo = "calendario-titulo",
}) {
  const [foco, setFoco] = useState(seleccionada || minFecha);
  const debeEnfocar = useRef(false);
  const refGrid = useRef(null);

  // El día enfocable siempre pertenece al mes visible.
  useEffect(() => {
    if (!mismoMes(foco, mes)) {
      const candidato = seleccionada && mismoMes(seleccionada, mes) ? seleccionada : (mismoMes(minFecha, mes) ? minFecha : mes);
      setFoco(candidato);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  useEffect(() => {
    if (debeEnfocar.current) {
      refGrid.current?.querySelector(`[data-fecha="${foco}"]`)?.focus();
      debeEnfocar.current = false;
    }
  }, [foco, mes]);

  const semanas = useMemo(() => {
    const inicio = desdeISO(mes);
    const desfase = (inicio.getDay() + 6) % 7; // lunes = 0
    const primeraCelda = sumarDias(mes, -desfase);
    const filas = [];
    let dia = primeraCelda;
    for (let s = 0; s < 6; s++) {
      const fila = [];
      for (let d = 0; d < 7; d++) {
        fila.push(dia);
        dia = sumarDias(dia, 1);
      }
      if (s >= 4 && !fila.some((f) => mismoMes(f, mes))) break;
      filas.push(fila);
    }
    return filas;
  }, [mes]);

  const fueraDeRango = (f) => f < minFecha || f > maxFecha;

  const infoDia = (f) => {
    if (fueraDeRango(f)) return { seleccionable: false, texto: "no disponible para reservar" };
    const d = disponibilidad[f];
    if (!d) return { seleccionable: false, texto: cargando ? "consultando disponibilidad" : "sin horario" };
    if (d.estado === "Descanso") return { seleccionable: false, texto: "día de descanso del barbero", descanso: true };
    if (d.estado === "SinTurno") return { seleccionable: false, texto: "el barbero no atiende este día" };
    if (d.horasDisponibles === 0) return { seleccionable: false, texto: "agenda completa", lleno: true };
    return {
      seleccionable: true,
      texto: `${d.horasDisponibles} ${d.horasDisponibles === 1 ? "hora disponible" : "horas disponibles"}`,
      pocas: d.horasDisponibles <= 3,
    };
  };

  const mover = (nueva) => {
    // Solo se navega entre los meses que contienen fechas reservables.
    const mesDestino = primerDiaMes(nueva);
    if (mesDestino < primerDiaMes(minFecha) || mesDestino > primerDiaMes(maxFecha)) return;
    debeEnfocar.current = true;
    if (!mismoMes(nueva, mes)) onCambiarMes(primerDiaMes(nueva));
    setFoco(nueva);
  };

  const alPresionar = (e, f) => {
    const mapa = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (mapa[e.key] !== undefined) {
      e.preventDefault();
      mover(sumarDias(f, mapa[e.key]));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const desfase = (desdeISO(f).getDay() + 6) % 7;
      mover(sumarDias(f, e.key === "Home" ? -desfase : 6 - desfase));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const d = desdeISO(f);
      d.setMonth(d.getMonth() + (e.key === "PageUp" ? -1 : 1));
      mover(aISO(d));
    }
  };

  const puedeIrAtras = mes > primerDiaMes(minFecha);
  const puedeIrAdelante = mes < primerDiaMes(maxFecha);

  const cambiarMes = (delta) => {
    const d = desdeISO(mes);
    d.setMonth(d.getMonth() + delta);
    onCambiarMes(aISO(d));
  };

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button
          type="button"
          className="calendario-nav"
          onClick={() => cambiarMes(-1)}
          disabled={!puedeIrAtras}
          aria-label="Mes anterior"
        >
          <FaChevronLeft aria-hidden="true" />
        </button>

        <h3 id={idTitulo} className="calendario-mes" aria-live="polite">
          {nombreMes(mes)}
        </h3>

        <button
          type="button"
          className="calendario-nav"
          onClick={() => cambiarMes(1)}
          disabled={!puedeIrAdelante}
          aria-label="Mes siguiente"
        >
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>

      <table
        ref={refGrid}
        className={`calendario-grid ${cargando ? "calendario-cargando" : ""}`}
        role="grid"
        aria-labelledby={idTitulo}
        aria-busy={cargando}
      >
        <thead>
          <tr>
            {DIAS.map((d) => (
              <th key={d.corto} scope="col" abbr={d.largo}>
                <span aria-hidden="true">{d.corto}</span>
                <span className="sr-only">{d.largo}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((fila) => (
            <tr key={fila[0]}>
              {fila.map((f) => {
                const delMes = mismoMes(f, mes);
                if (!delMes) return <td key={f} className="calendario-celda-vacia" />;

                const info = infoDia(f);
                const esSeleccionada = f === seleccionada;
                const esHoy = f === minFecha;
                const clases = [
                  "calendario-dia",
                  info.seleccionable ? "disponible" : "no-disponible",
                  info.pocas ? "pocas" : "",
                  info.descanso ? "descanso" : "",
                  esSeleccionada ? "seleccionada" : "",
                  esHoy ? "hoy" : "",
                ].join(" ");

                return (
                  <td key={f} role="gridcell" aria-selected={esSeleccionada}>
                    <button
                      type="button"
                      data-fecha={f}
                      className={clases}
                      tabIndex={f === foco ? 0 : -1}
                      aria-disabled={!info.seleccionable}
                      aria-label={`${fechaLarga(f)}${esHoy ? " (hoy)" : ""}: ${info.texto}`}
                      onClick={() => {
                        setFoco(f);
                        if (info.seleccionable) onSeleccionar(f);
                      }}
                      onKeyDown={(e) => alPresionar(e, f)}
                    >
                      <span className="calendario-numero" aria-hidden="true">{desdeISO(f).getDate()}</span>
                      {info.seleccionable && <span className="calendario-punto" aria-hidden="true" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="calendario-leyenda" aria-label="Leyenda del calendario">
        <li><span className="leyenda-muestra disponible" aria-hidden="true" /> Con horas libres</li>
        <li><span className="leyenda-muestra pocas" aria-hidden="true" /> Pocas horas</li>
        <li><span className="leyenda-muestra no-disponible" aria-hidden="true" /> Sin disponibilidad</li>
        <li><span className="leyenda-muestra seleccionada" aria-hidden="true" /> Seleccionado</li>
      </ul>

      <p className="calendario-ayuda">
        Use las flechas del teclado para moverse entre días y Enter para elegir uno.
      </p>
    </div>
  );
}
