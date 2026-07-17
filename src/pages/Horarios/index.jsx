import "./Horarios.css";

import horarios from "../../mocks/horarios";
import DataTable from "../../components/tables/DataTable";

export default function Horarios() {

  const columnas = [
    { key: "barbero", label: "Barbero" },
    { key: "dia", label: "Día" },
    { key: "horaInicio", label: "Hora Inicio" },
    { key: "horaFin", label: "Hora Fin" },
    { key: "estado", label: "Estado" },
  ];

  return (

    <div className="horarios">

      <div className="horarios-header">

        <div>

          <h1>Horarios</h1>

          <p>
            Administra los horarios laborales de los barberos.
          </p>

        </div>

        <button className="btn-primary">
          + Nuevo Horario
        </button>

      </div>

      <div className="horarios-toolbar">

        <input
          type="text"
          placeholder="Buscar horario..."
          className="search-input"
        />

      </div>

      <DataTable
        columns={columnas}
        data={horarios}
        showActions={true}
      />

    </div>

  );

}