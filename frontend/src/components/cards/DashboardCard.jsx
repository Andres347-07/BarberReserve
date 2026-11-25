import "./DashboardCard.css";

/**
 * Tarjeta de indicador. El título es un párrafo (no un encabezado) para no
 * romper la jerarquía h1 → h2 de la página; el valor y el título se leen
 * juntos como una sola frase ("3 Clientes registrados").
 */
export default function DashboardCard({ titulo, valor, icono, tono = "marca", descripcion }) {
  return (
    <div className={`dashboard-card dashboard-card-${tono}`}>
      {icono && <span className="dashboard-card-icono" aria-hidden="true">{icono}</span>}
      <div className="dashboard-card-texto">
        <p className="dashboard-card-valor">{valor ?? "—"}</p>
        <p className="dashboard-card-titulo">{titulo}</p>
        {descripcion && <p className="dashboard-card-descripcion">{descripcion}</p>}
      </div>
    </div>
  );
}
