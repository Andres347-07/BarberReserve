import "./Servicios.css";

import servicios from "../../mocks/servicios";
import DataTable from "../../components/tables/DataTable";

export default function Servicios() {

  const columnas = [
  { key: "servicio", label: "Servicio" },
  { key: "precio", label: "Precio" },
  { key: "duracion", label: "Duración" },
  { key: "disponible", label: "Disponible" },
];

  return (

    <div className="servicios">

      <div className="servicios-header">

        <div>

          <h1>Servicios</h1>

          <p>
            Administra los servicios disponibles de la barbería.
          </p>

        </div>

        <button className="btn-primary">
          + Nuevo Servicio
        </button>

      </div>

      <div className="servicios-toolbar">

        <input
          type="text"
          placeholder="Buscar servicio..."
          className="search-input"
        />

      </div>

      <DataTable
        columns={columnas}
        data={servicios}
        showActions={true}
      />

    </div>

  );

}