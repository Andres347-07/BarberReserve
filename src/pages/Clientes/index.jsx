import "./Clientes.css";

import clientes from "../../mocks/clientes";
import DataTable from "../../components/tables/DataTable";

export default function Clientes() {

  const columnas = [
    { key: "nombre", label: "Nombre" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "ultimaCita", label: "Última cita" },
    { key: "totalVisitas", label: "Visitas" },
  ];

  return (

    <div className="clientes">

      <div className="clientes-header">

        <div>

          <h1>Clientes</h1>

          <p>
            Administra los clientes registrados en la barbería.
          </p>

        </div>

        <button className="btn-primary">
          + Nuevo Cliente
        </button>

      </div>

      <div className="clientes-toolbar">

        <input
          type="text"
          placeholder="Buscar cliente..."
          className="search-input"
        />

      </div>

      <DataTable
        columns={columnas}
        data={clientes}
        showActions={true}
      />

    </div>

  );

}