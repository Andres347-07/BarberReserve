import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./Dashboard.css";

import {
  FaUsers, FaUserTie, FaCut, FaCalendarDay,
  FaHourglassHalf, FaSyncAlt, FaCheckCircle, FaClock, FaGlobe, FaBan, FaPlus,
} from "react-icons/fa";

import dashboardService from "../../services/dashboardService";
import agendaService from "../../services/agendaService";
import { useAuth } from "../../contexts/useAuth";
import { hoyISO, fechaLarga } from "../../utils/fechas";

import DashboardCard from "../../components/cards/DashboardCard";
import ReservasTable from "../../components/tables/ReservasTable";

const ACCESOS_ADMIN = [
  { label: "Nueva reserva", ruta: "/reservas", destacado: true },
  { label: "Nuevo cliente", ruta: "/clientes" },
  { label: "Nuevo barbero", ruta: "/barberos" },
  { label: "Nuevo servicio", ruta: "/servicios" },
  { label: "Agenda del día", ruta: "/agenda", sinIcono: true },
];

const ACCESOS_BARBERO = [
  { label: "Agenda del día", ruta: "/agenda", destacado: true, sinIcono: true },
];

export default function Dashboard() {

  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [resumen, setResumen] = useState(null);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardService.obtenerResumen().then(setResumen).catch(() => setError("No fue posible cargar los indicadores."));

    agendaService
      .obtenerDia({ fecha: hoyISO(), barberoId: esAdmin ? undefined : usuario?.barberoId })
      .then((data) => setReservasHoy(data.reservas.filter((r) => r.estado !== "Cancelada")))
      .catch(() => setError("No fue posible cargar las reservas de hoy."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (

    <div className="dashboard">

      <div className="dashboard-header">

        <div>
          <h1>¡Bienvenido, {usuario?.nombre}!</h1>
          <p className="page-subtitle">
            {esAdmin ? "Este es el resumen de tu barbería." : "Este es el resumen de tus citas."}
          </p>
        </div>

        <nav className="accesos-rapidos" aria-label="Accesos rápidos">
          {(esAdmin ? ACCESOS_ADMIN : ACCESOS_BARBERO).map((acceso) => (
            <Link
              key={acceso.label}
              to={acceso.ruta}
              className={acceso.destacado ? "btn-primary" : "btn-secondary"}
            >
              {!acceso.sinIcono && <FaPlus aria-hidden="true" />} {acceso.label}
            </Link>
          ))}
        </nav>

      </div>

      {error && <p className="dashboard-error" role="alert">{error}</p>}

      <section aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className="sr-only">Indicadores</h2>

        {!resumen ? (
          <p className="dashboard-cargando" role="status">Cargando indicadores…</p>
        ) : (
          <div className="cards">

            {esAdmin ? (
              <>
                <DashboardCard tono="oscuro" icono={<FaCalendarDay />} titulo="Reservas de hoy" valor={resumen.reservasHoy} />
                <DashboardCard tono="alerta" icono={<FaHourglassHalf />} titulo="Pendientes" valor={resumen.reservasPendientes} />
                <DashboardCard tono="info" icono={<FaSyncAlt />} titulo="En proceso" valor={resumen.reservasEnProceso} />
                <DashboardCard tono="exito" icono={<FaCheckCircle />} titulo="Finalizadas" valor={resumen.reservasFinalizadas} />
                <DashboardCard icono={<FaUsers />} titulo="Clientes registrados" valor={resumen.totalClientes} />
                <DashboardCard icono={<FaUserTie />} titulo="Barberos activos" valor={resumen.barberosActivos} />
                <DashboardCard icono={<FaCut />} titulo="Servicios activos" valor={resumen.serviciosActivos} />
                <DashboardCard icono={<FaGlobe />} titulo="Reservas en línea" valor={resumen.reservasWeb} descripcion={`${resumen.reservasCanceladas ?? 0} canceladas en total`} />
              </>
            ) : (
              <>
                <DashboardCard tono="oscuro" icono={<FaCalendarDay />} titulo="Reservas de hoy" valor={resumen.reservasHoy} />
                <DashboardCard tono="alerta" icono={<FaHourglassHalf />} titulo="Pendientes" valor={resumen.reservasPendientes} />
                <DashboardCard tono="info" icono={<FaSyncAlt />} titulo="En proceso" valor={resumen.reservasEnProceso} />
                <DashboardCard tono="exito" icono={<FaCheckCircle />} titulo="Finalizadas" valor={resumen.reservasFinalizadas} />
                <DashboardCard tono="neutro" icono={<FaBan />} titulo="Canceladas" valor={resumen.reservasCanceladas} />
              </>
            )}

          </div>
        )}
      </section>

      {!esAdmin && resumen?.proximaCita && (
        <p className="proxima-cita">
          <FaClock aria-hidden="true" />
          <span>
            <strong>Próxima cita:</strong> {fechaLarga(resumen.proximaCita.fecha)} a las {resumen.proximaCita.hora?.slice(0, 5)} — {resumen.proximaCita.cliente} ({resumen.proximaCita.servicio})
          </span>
        </p>
      )}

      <div className={`dashboard-body ${esAdmin ? "" : "dashboard-body-una"}`}>

        <section className="reservas" aria-labelledby="titulo-reservas-hoy">
          <div className="dashboard-seccion-header">
            <h2 id="titulo-reservas-hoy">Reservas de hoy</h2>
            <Link to="/agenda" className="btn-ghost">Ver agenda</Link>
          </div>
          <ReservasTable reservas={reservasHoy} caption="Reservas de hoy ordenadas por hora" />
        </section>

        {esAdmin && (
          <section className="agenda" aria-labelledby="titulo-actividad">
            <h2 id="titulo-actividad">Actividad reciente</h2>
            <ul className="actividad-reciente">
              {(resumen?.actividadReciente || []).map((evento, i) => (
                <li key={i} className={`actividad-${evento.tipo}`}>{evento.mensaje}</li>
              ))}
              {resumen?.actividadReciente?.length === 0 && <li>Sin actividad reciente.</li>}
            </ul>
          </section>
        )}

      </div>

    </div>

  );

}
