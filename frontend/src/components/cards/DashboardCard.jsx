import "./DashboardCard.css";

export default function DashboardCard({ titulo, valor, icono }) {
  return (
    <div className="dashboard-card">
      <h3>{icono && <span className="dashboard-card-icono">{icono}</span>}{titulo}</h3>
      <span>{valor}</span>
    </div>
  );
}