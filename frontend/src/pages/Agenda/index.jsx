import { useEffect, useState } from "react";
import {
  FaPlay, FaCheckCircle, FaClock, FaChevronLeft, FaChevronRight, FaUserCheck, FaUserTimes,
  FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaCoffee, FaLock,
} from "react-icons/fa";

import "./Agenda.css";

import agendaService from "../../services/agendaService";
import barberoService from "../../services/barberoService";
import reservaService from "../../services/reservaService";
import { useAuth } from "../../contexts/useAuth";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";
import Tabs from "../../components/common/Tabs";
import BloqueosPanel from "../../components/horarios/BloqueosPanel";
import { hoyISO, sumarDias, fechaLarga } from "../../utils/fechas";
import { claseEstado, etiquetaEstado, LISTA_ESTADOS } from "../../utils/estados";

/**
 * Acciones por estado (2.1, según la práctica de las barberías):
 * Pendiente → "Llegó el cliente" (En espera) → "Iniciar servicio" → "Finalizar".
 * "No asistió" aparece cuando pasó la tolerancia configurada.
 */
const ACCIONES = {
  "Pendiente": [
    { estado: "En espera", texto: "Llegó el cliente", icono: <FaUserCheck />, clase: "btn-secondary", toast: "Llegada registrada: el cliente está en espera." },
    { estado: "En proceso", texto: "Iniciar servicio", icono: <FaPlay />, clase: "btn-primary", toast: "Servicio iniciado." },
  ],
  "En espera": [
    { estado: "En proceso", texto: "Iniciar servicio", icono: <FaPlay />, clase: "btn-primary", toast: "Servicio iniciado." },
  ],
  "En proceso": [
    { estado: "Finalizada", texto: "Finalizar servicio", icono: <FaCheckCircle />, clase: "btn-primary", toast: "Servicio finalizado." },
  ],
};

const aMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const ahoraMinutos = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function ResumenJornada({ jornada }) {
  if (!jornada) return null;
  if (jornada.estado !== "Activo") {
    return (
      <p className="agenda-turno-info">
        <FaCoffee aria-hidden="true" />
        {jornada.estado === "Descanso" ? `Día de descanso${jornada.motivo ? ` (${jornada.motivo})` : ""}.` : "Sin turno asignado este día."}
      </p>
    );
  }
  return (
    <p className="agenda-turno-info">
      <FaClock aria-hidden="true" />
      <span>
        Turno de <strong>{jornada.horaInicio}</strong> a <strong>{jornada.horaFin}</strong>
        {jornada.pausaInicio && <> · Pausa de {jornada.pausaInicio} a {jornada.pausaFin}</>}
        {jornada.bloqueos?.length > 0 && (
          <> · Bloqueado: {jornada.bloqueos.map((b) => `${b.horaInicio}–${b.horaFin}${b.motivo ? ` (${b.motivo})` : ""}`).join(", ")}</>
        )}
        {jornada.origen === "excepcion" && " · Horario especial para esta fecha"}
      </span>
    </p>
  );
}

function TarjetaCita({ cita, fecha, tolerancia, esAdmin, esProxima, onCambiar }) {
  // Las acciones de atención solo se habilitan el día de la cita.
  const esFutura = fecha > hoyISO();
  const acciones = esFutura ? [] : (ACCIONES[cita.estado] || []);
  const hora = cita.hora?.slice(0, 5);
  const pasoTolerancia = fecha < hoyISO() || (fecha === hoyISO() && ahoraMinutos() >= aMin(hora) + tolerancia);
  const puedeNoAsistio = cita.estado === "Pendiente" && pasoTolerancia;
  const etiqueta = `${cita.cliente?.nombre} a las ${hora}`;

  return (
    <li className={`agenda-card ${cita.estado === "Cancelada" || cita.estado === "No asistió" ? "agenda-card-cancelada" : ""} ${esProxima ? "agenda-card-proxima" : ""}`}>
      <div className="hora-badge"><span className="sr-only">Hora: </span>{hora}</div>

      <div className="agenda-card-info">
        {esProxima && <p className="agenda-proxima-etiqueta">Próxima cita</p>}
        <p className="agenda-cliente">{cita.cliente?.nombre}</p>
        <p className="agenda-detalle">
          {cita.servicio?.nombre} · {cita.duracion} min
          {esAdmin && cita.barbero && <> · {cita.barbero.nombre}</>}
          {cita.cliente?.telefono && <> · Tel. {cita.cliente.telefono}</>}
        </p>
        {cita.observaciones && <p className="agenda-detalle">Nota: {cita.observaciones}</p>}
        <span className={claseEstado(cita.estado)}><span className="sr-only">Estado: </span>{etiquetaEstado(cita.estado)}</span>
      </div>

      {esFutura && cita.estado === "Pendiente" && (
        <p className="agenda-detalle agenda-futura">Las acciones se habilitan el día de la cita.</p>
      )}

      {(acciones.length > 0 || puedeNoAsistio) && (
        <div className="agenda-acciones" role="group" aria-label={`Acciones para la cita de ${etiqueta}`}>
          {acciones.map((a) => (
            <button
              key={a.estado}
              type="button"
              className={a.clase}
              onClick={() => onCambiar(cita, a)}
              aria-label={`${a.texto}: ${etiqueta}`}
            >
              <span aria-hidden="true">{a.icono}</span> {a.texto}
            </button>
          ))}
          {puedeNoAsistio && (
            <button
              type="button"
              className="btn-outline btn-no-asistio"
              onClick={() => onCambiar(cita, { estado: "No asistió", toast: "Cita marcada como inasistencia. El horario quedó libre." })}
              aria-label={`Marcar que no asistió: ${etiqueta}`}
            >
              <FaUserTimes aria-hidden="true" /> No asistió
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Agenda() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const { toast, mostrarToast, cerrarToast } = useToast();

  const [vista, setVista] = useState("hoy"); // hoy | manana | semana | fecha
  const [fecha, setFecha] = useState(hoyISO());
  const [barberos, setBarberos] = useState([]);
  const [barberoId, setBarberoId] = useState("");
  const [estado, setEstado] = useState("");
  const [cliente, setCliente] = useState("");
  const [agenda, setAgenda] = useState({ jornada: null, reservas: [], dias: null, toleranciaNoAsistio: 15 });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (esAdmin) {
      barberoService.obtenerBarberos().then(setBarberos).catch(() => {});
    }
  }, [esAdmin]);

  const fechaVista = vista === "hoy" ? hoyISO() : vista === "manana" ? sumarDias(hoyISO(), 1) : fecha;

  const cargarAgenda = async () => {
    setCargando(true);
    try {
      const filtrosAdmin = esAdmin ? { barberoId: barberoId || undefined, estado: estado || undefined } : {};
      const datos = vista === "semana"
        ? await agendaService.obtenerDia({ desde: hoyISO(), hasta: sumarDias(hoyISO(), 6), ...filtrosAdmin })
        : await agendaService.obtenerDia({ fecha: fechaVista, ...filtrosAdmin });
      setAgenda({ reservas: [], dias: null, jornada: null, ...datos });
    } catch (error) {
      mostrarToast(error.response?.data?.message || "No fue posible cargar la agenda.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, fecha, barberoId, estado]);

  const cambiarEstado = async (cita, accion) => {
    try {
      await reservaService.actualizarReserva(cita.id, { estado: accion.estado });
      mostrarToast(accion.toast);
      await cargarAgenda();
    } catch (error) {
      mostrarToast(error.response?.data?.message || "No se pudo actualizar el estado.", "error");
    }
  };

  const filtrarCliente = (lista) => {
    const texto = cliente.trim().toLowerCase();
    return texto ? lista.filter((c) => c.cliente?.nombre?.toLowerCase().includes(texto)) : lista;
  };

  // Próxima cita de hoy: la primera Pendiente o En espera que aún no ha pasado.
  const proximaId = (() => {
    if (fechaVista !== hoyISO() || vista === "semana") return null;
    const ahora = ahoraMinutos();
    const p = agenda.reservas.find((c) => ["Pendiente", "En espera"].includes(c.estado) && aMin(c.hora.slice(0, 5)) + c.duracion > ahora);
    return p?.id || null;
  })();

  const mostrarJornada = !esAdmin || barberoId;
  const total = vista === "semana"
    ? (agenda.dias || []).reduce((t, d) => t + filtrarCliente(d.reservas).length, 0)
    : filtrarCliente(agenda.reservas).length;

  return (
    <div className="agenda-page">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <div className="agenda-header">
        <div>
          <h1>{esAdmin ? "Agenda" : "Mi agenda"}</h1>
          <p>{esAdmin ? "Citas de todos los barberos. Registre la llegada de los clientes y el avance de cada servicio." : "Tus citas de hoy, mañana y la semana. Marca la llegada del cliente y el avance del servicio."}</p>
        </div>
      </div>

      <Tabs
        etiqueta="Periodo de la agenda"
        activa={vista}
        onCambiar={setVista}
        pestanas={[
          { id: "hoy", etiqueta: "Hoy", icono: <FaCalendarDay /> },
          { id: "manana", etiqueta: "Mañana", icono: <FaCalendarDay /> },
          { id: "semana", etiqueta: "Próximos 7 días", icono: <FaCalendarWeek /> },
          { id: "fecha", etiqueta: "Otra fecha", icono: <FaCalendarAlt /> },
        ]}
      >
        <form className="agenda-filtros" role="search" aria-label="Filtros de la agenda" onSubmit={(e) => e.preventDefault()}>
          {vista === "fecha" && (
            <div className="filtro">
              <label htmlFor="agenda-fecha">Fecha</label>
              <div className="agenda-fecha-control">
                <button type="button" className="btn-secondary btn-compacto" onClick={() => setFecha((f) => sumarDias(f, -1))} aria-label="Día anterior">
                  <FaChevronLeft aria-hidden="true" />
                </button>
                <input id="agenda-fecha" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
                <button type="button" className="btn-secondary btn-compacto" onClick={() => setFecha((f) => sumarDias(f, 1))} aria-label="Día siguiente">
                  <FaChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {esAdmin && (
            <>
              <div className="filtro">
                <label htmlFor="agenda-barbero">Barbero</label>
                <select id="agenda-barbero" value={barberoId} onChange={(e) => setBarberoId(e.target.value)}>
                  <option value="">Todos los barberos</option>
                  {barberos.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>

              <div className="filtro">
                <label htmlFor="agenda-estado">Estado</label>
                <select id="agenda-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {LISTA_ESTADOS.map((e) => <option key={e} value={e}>{etiquetaEstado(e)}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="filtro filtro-crece">
            <label htmlFor="agenda-cliente">Cliente</label>
            <input
              id="agenda-cliente"
              type="search"
              placeholder="Buscar por nombre…"
              className="search-input"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>
        </form>

        <p className="sr-only" role="status">
          {cargando ? "Cargando citas…" : `${total} cita(s) encontradas.`}
        </p>

        {vista !== "semana" ? (
          <section className="agenda-list" aria-labelledby="titulo-dia">
            <h2 id="titulo-dia">
              Citas del <span className="agenda-fecha-titulo capitalizar">{fechaLarga(fechaVista)}</span>
            </h2>
            {mostrarJornada && <ResumenJornada jornada={agenda.jornada} />}

            {!cargando && filtrarCliente(agenda.reservas).length === 0 && (
              <p className="agenda-vacia">No hay citas para este día.</p>
            )}

            <ul className="agenda-lista">
              {filtrarCliente(agenda.reservas).map((cita) => (
                <TarjetaCita
                  key={cita.id}
                  cita={cita}
                  fecha={fechaVista}
                  tolerancia={agenda.toleranciaNoAsistio}
                  esAdmin={esAdmin}
                  esProxima={cita.id === proximaId}
                  onCambiar={cambiarEstado}
                />
              ))}
            </ul>
          </section>
        ) : (
          <div className="agenda-semana">
            {(agenda.dias || []).map((dia) => {
              const citas = filtrarCliente(dia.reservas);
              return (
                <section key={dia.fecha} className="agenda-list" aria-labelledby={`dia-${dia.fecha}`}>
                  <h2 id={`dia-${dia.fecha}`} className="agenda-dia-titulo">
                    <span className="capitalizar">{fechaLarga(dia.fecha)}</span>
                    <span className="agenda-dia-conteo">{citas.length} cita(s)</span>
                  </h2>
                  {mostrarJornada && <ResumenJornada jornada={dia.jornada} />}
                  {citas.length === 0 ? (
                    <p className="agenda-vacia agenda-vacia-compacta">Sin citas.</p>
                  ) : (
                    <ul className="agenda-lista">
                      {citas.map((cita) => (
                        <TarjetaCita
                          key={cita.id}
                          cita={cita}
                          fecha={dia.fecha}
                          tolerancia={agenda.toleranciaNoAsistio}
                          esAdmin={esAdmin}
                          esProxima={false}
                          onCambiar={cambiarEstado}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Tabs>

      {!esAdmin && (
        <details className="agenda-bloquear">
          <summary><FaLock aria-hidden="true" /> Bloquear un horario de mi agenda</summary>
          <BloqueosPanel
            barberoId={usuario?.barberoId}
            mostrarToast={(m, t) => { mostrarToast(m, t); cargarAgenda(); }}
            titulo="Mis bloqueos"
          />
        </details>
      )}
    </div>
  );
}
