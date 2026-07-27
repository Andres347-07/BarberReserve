import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

import {
  FaUsers, FaUserTie, FaCut, FaCalendarDay,
  FaHourglassHalf, FaSyncAlt, FaCheckCircle, FaClock,
} from "react-icons/fa";

import dashboardService from "../../services/dashboardService";
import agendaService from "../../services/agendaService";
import { useAuth } from "../../contexts/useAuth";

import DashboardCard from "../../components/cards/DashboardCard";
import ReservasTable from "../../components/tables/ReservasTable";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function hoyLegible() {
  return new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}


const ACCESOS_ADMIN = [
  { label: "+ Nuevo Cliente", ruta: "/clientes" },
  { label: "+ Nuevo Barbero", ruta: "/barberos" },
  { label: "+ Nuevo Servicio", ruta: "/servicios" },
  { label: "+ Nueva Reserva", ruta: "/reservas" },
  { label: "Agenda del día", ruta: "/agenda" },
];

const ACCESOS_BARBERO = [
  { label: "Agenda del día", ruta: "/agenda" },
];

export default function Dashboard() {

  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [reservasHoy, setReservasHoy] = useState([]);

  useEffect(() => {
    dashboardService.obtenerResumen().then(setResumen).catch(console.error);

    agendaService
      .obtenerDia({ fecha: hoyISO(), barberoId: esAdmin ? undefined : usuario?.barberoId })
      .then((data) => setReservasHoy(data.reservas))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (

    <div className="dashboard">

      <div className="dashboard-header">

        <div>
          <h1>¡Bienvenido, {usuario?.nombre}!</h1>
          <span className="dashboard-role">{usuario?.rol}</span>
          <p>Aquí tienes un resumen de tu barbería.</p>
        </div>

        <button className="date-btn">Hoy, {hoyLegible()}</button>

      </div>

      {                               }
      <div className="accesos-rapidos">
        {(esAdmin ? ACCESOS_ADMIN : ACCESOS_BARBERO).map((acceso) => (
          <button key={acceso.ruta + acceso.label} className="btn-secondary" onClick={() => navigate(acceso.ruta)}>
            {acceso.label}
          </button>
        ))}
      </div>

      {resumen && (
        <div className="cards">

          {esAdmin ? (
            <>
              <DashboardCard icono={<FaUsers />} titulo="Clientes registrados" valor={resumen.totalClientes} />
              <DashboardCard icono={<FaUserTie />} titulo="Barberos activos" valor={resumen.barberosActivos} />
              <DashboardCard icono={<FaCut />} titulo="Servicios activos" valor={resumen.serviciosActivos} />
              <DashboardCard icono={<FaCalendarDay />} titulo="Reservas de hoy" valor={resumen.reservasHoy} />
              <DashboardCard icono={<FaHourglassHalf />} titulo="Pendientes" valor={resumen.reservasPendientes} />
              <DashboardCard icono={<FaSyncAlt />} titulo="En proceso" valor={resumen.reservasEnProceso} />
              <DashboardCard icono={<FaCheckCircle />} titulo="Finalizadas" valor={resumen.reservasFinalizadas} />
            </>
          ) : (
            <>
              <DashboardCard icono={<FaCalendarDay />} titulo="Reservas de hoy" valor={resumen.reservasHoy} />
              <DashboardCard icono={<FaHourglassHalf />} titulo="Pendientes" valor={resumen.reservasPendientes} />
              <DashboardCard icono={<FaSyncAlt />} titulo="En proceso" valor={resumen.reservasEnProceso} />
              <DashboardCard icono={<FaCheckCircle />} titulo="Finalizadas hoy" valor={resumen.reservasFinalizadas} />
            </>
          )}

        </div>
      )}

      {!esAdmin && resumen?.proximaCita && (
        <div className="proxima-cita">
          <FaClock />
          <span>
            Próxima cita: {resumen.proximaCita.fecha} a las {resumen.proximaCita.hora?.slice(0, 5)} — {resumen.proximaCita.cliente} ({resumen.proximaCita.servicio})
          </span>
        </div>
      )}

      <div className="dashboard-body">

        <div className="reservas">
          <h2>Próximas reservas de hoy</h2>
          <ReservasTable reservas={reservasHoy} />
        </div>

        {esAdmin && (
          <div className="agenda">
            <h2>Actividad reciente</h2>
            <ul className="actividad-reciente">
              {(resumen?.actividadReciente || []).map((evento, i) => (
                <li key={i}>{evento.mensaje}</li>
              ))}
              {resumen?.actividadReciente?.length === 0 && <li>Sin actividad reciente.</li>}
            </ul>
          </div>
        )}

      </div>

    </div>

  );

}
