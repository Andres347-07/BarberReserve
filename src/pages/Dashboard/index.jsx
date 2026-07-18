import "./Dashboard.css";

import usuario from "../../mocks/usuario";
import dashboard from "../../mocks/dashboard";

import DashboardCard from "../../components/cards/DashboardCard";
import ReservasTable from "../../components/tables/ReservasTable";
import AgendaCard from "../../components/dashboard/AgendaCard";

export default function Dashboard() {

  return (

    <div className="dashboard">

      <div className="dashboard-header">

        <div>

          <h1>
            ¡Bienvenido, {usuario.nombre}! 👋
          </h1>

          <span className="dashboard-role">
            {usuario.rol}
          </span>

          <p>
            Aquí tienes un resumen de tu barbería.
          </p>

        </div>

        <button className="date-btn">
          Hoy, 10 de junio de 2026
        </button>

      </div>

      <div className="cards">

        <DashboardCard
          titulo="Total de clientes"
          valor={dashboard.totalClientes}
        />

        <DashboardCard
          titulo="Total de barberos"
          valor={dashboard.totalBarberos}
        />

        <DashboardCard
          titulo="Reservas del día"
          valor={dashboard.reservasHoy}
        />

        <DashboardCard
          titulo="Servicios disponibles"
          valor={dashboard.serviciosDisponibles}
        />

      </div>

      <div className="dashboard-body">

        <div className="reservas">

          <h2>
            Reservas de hoy
          </h2>

          <ReservasTable />

        </div>

        <div className="agenda">

          <h2>
            Agenda del día
          </h2>

          <AgendaCard />

        </div>

      </div>

    </div>

  );

}