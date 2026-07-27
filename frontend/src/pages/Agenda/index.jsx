import { useEffect, useState } from "react";
import { FaPlay, FaCheckCircle, FaClock } from "react-icons/fa";

import "./Agenda.css";

import agendaService from "../../services/agendaService";
import barberoService from "../../services/barberoService";
import reservaService from "../../services/reservaService";
import { useAuth } from "../../contexts/useAuth";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

const SIGUIENTE_ESTADO = {
  "Pendiente": "En proceso",
  "En proceso": "Finalizada",
  "Finalizada": null,
};

const ACCION_POR_ESTADO = {
  "Pendiente": "Iniciar servicio",
  "En proceso": "Finalizar servicio",
};

const ICONO_POR_ESTADO = {
  "Pendiente": <FaPlay />,
  "En proceso": <FaCheckCircle />,
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Agenda() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const { toast, mostrarToast, cerrarToast } = useToast();

  const [fecha, setFecha] = useState(hoyISO());
  const [barberos, setBarberos] = useState([]);
  const [barberoId, setBarberoId] = useState("");
  const [estado, setEstado] = useState("");
  const [cliente, setCliente] = useState("");
  const [agenda, setAgenda] = useState({ turno: null, reservas: [] });
  const [cargando, setCargando] = useState(false);

  // Solo el administrador filtra por barbero (especificación 10.9).
  useEffect(() => {
    if (esAdmin) {
      barberoService.obtenerBarberos().then(setBarberos).catch(() => {});
    }
  }, [esAdmin]);

  const cargarAgenda = async () => {
    setCargando(true);
    try {
      const filtros = esAdmin
        ? { fecha, barberoId: barberoId || undefined, estado: estado || undefined }
        : { fecha };

      const datos = await agendaService.obtenerDia(filtros);
      setAgenda(datos);
    } catch (error) {
      console.error("Error al cargar la agenda:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, barberoId, estado]);

  
  const avanzarEstado = async (cita) => {
    const nuevoEstado = SIGUIENTE_ESTADO[cita.estado];
    if (!nuevoEstado) return;

    try {
      await reservaService.actualizarReserva(cita.id, { estado: nuevoEstado });

      mostrarToast(
        nuevoEstado === "En proceso" ? "Servicio iniciado correctamente." : "Servicio finalizado correctamente."
      );

      await cargarAgenda();
    } catch (error) {
      mostrarToast(error.response?.data?.message || "No se pudo actualizar el estado.", "error");
    }
  };

  
  const reservasVisibles = agenda.reservas.filter((cita) => {
    const texto = cliente.trim().toLowerCase();
    if (!texto) return true;
    return cita.cliente?.nombre?.toLowerCase().includes(texto);
  });

  return (
    <div className="agenda-page">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <div className="agenda-header">
        <div>
          <h1>Agenda</h1>
          <p>Visualiza las citas programadas para el día.</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          {esAdmin && (
            <>
              <select value={barberoId} onChange={(e) => setBarberoId(e.target.value)}>
                <option value="">Todos los barberos</option>
                {barberos.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>

              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Finalizada">Finalizada</option>
              </select>

              <input
                type="text"
                placeholder="Buscar cliente..."
                className="search-input"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      {!esAdmin && (
        <p className="agenda-turno-info">
          <FaClock />{" "}
          {agenda.turno && agenda.turno.estado === "Activo"
            ? `Tu turno ese día: ${agenda.turno.horaInicio?.slice(0, 5)} - ${agenda.turno.horaFin?.slice(0, 5)}`
            : "No tienes turno asignado para este día."}
        </p>
      )}

      <div className="agenda-container">

        <div className="agenda-list">
          <h2>Citas del día {cargando && "(cargando...)"}</h2>

          {reservasVisibles.length === 0 && <p>No existen reservas para la fecha seleccionada.</p>}

          {reservasVisibles.map((cita) => (
            <div key={cita.id} className="agenda-card">
              <div className="hora-badge">{cita.hora?.slice(0, 5)}</div>

              <div className="agenda-info">
                <div className="info-item">
                  <span className="info-label">Cliente</span>
                  <span className="info-value">{cita.cliente?.nombre}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Servicio</span>
                  <span className="info-value">{cita.servicio?.nombre}</span>
                </div>

                {esAdmin && (
                  <div className="info-item">
                    <span className="info-label">Barbero</span>
                    <span className="info-value">{cita.barbero?.nombre}</span>
                  </div>
                )}

                {!esAdmin && cita.observaciones && (
                  <div className="info-item">
                    <span className="info-label">Observaciones</span>
                    <span className="info-value">{cita.observaciones}</span>
                  </div>
                )}

                <div className="info-item">
                  <span className="info-label">Estado</span>
                  <span className={`estado-badge estado-${cita.estado.replace(" ", "-").toLowerCase()}`}>
                    {cita.estado}
                  </span>
                </div>
              </div>

              {!esAdmin && SIGUIENTE_ESTADO[cita.estado] && (
                <button className="btn-primary" onClick={() => avanzarEstado(cita)}>
                  {ICONO_POR_ESTADO[cita.estado]} {ACCION_POR_ESTADO[cita.estado]}
                </button>
              )}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
