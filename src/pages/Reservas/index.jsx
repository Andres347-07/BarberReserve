import "./Reservas.css";

import reservas from "../../mocks/reservas";
import DataTable from "../../components/tables/DataTable";

export default function Reservas() {

 const columnas = [
  { key: "fecha", label: "Fecha y Hora" },
  { key: "cliente", label: "Cliente" },
  { key: "servicio", label: "Servicio" },
  { key: "barbero", label: "Barbero" },
  { key: "estado", label: "Estado" },
];

  return (

    <div className="reservas-page">

      <div className="reservas-header">

        <div>

          <h1>Reservas</h1>

          <p>
            Administra las reservas registradas en la barbería.
          </p>

        </div>

        <button className="btn-primary">
          + Nueva Reserva
        </button>

      </div>

      <div className="reservas-toolbar">

        <input
          type="text"
          placeholder="Buscar reserva..."
          className="search-input"
        />

      </div>

      <DataTable
        columns={columnas}
        data={reservas}
        showActions={true}
      />

    </div>

  );

}