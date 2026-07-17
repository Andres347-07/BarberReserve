import "./Barberos.css";

import barberos from "../../mocks/barberos";
import DataTable from "../../components/tables/DataTable";

export default function Barberos() {

  const columnas = [
    { key: "nombre", label: "Nombre" },
    { key: "especialidad", label: "Especialidad" },
    { key: "telefono", label: "Teléfono" },
    { key: "estado", label: "Estado" },
  ];

  return (

    <div className="barberos">

      <div className="barberos-header">

        <div>

          <h1>Barberos</h1>

          <p>
            Administra los barberos registrados.
          </p>

        </div>

        <button className="btn-primary">
          + Nuevo Barbero
        </button>

      </div>

      <div className="barberos-toolbar">

        <input
          type="text"
          placeholder="Buscar barbero..."
          className="search-input"
        />

      </div>

      <DataTable
        columns={columnas}
        data={barberos}
        showActions={true}
      />

    </div>

  );

}