import "./DashboardCard.css";

export default function DashboardCard({ titulo, valor }) {
  return (
    <div className="dashboard-card">
      <h3>{titulo}</h3>
      <span>{valor}</span>
    </div>
  );
}