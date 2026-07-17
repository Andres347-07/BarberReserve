import reservas from "../../mocks/reservas";
import "./ReservasTable.css";

export default function ReservasTable() {
  return (
    <table className="reservas-table">

      <thead>

        <tr>
          <th>Cliente</th>
          <th>Barbero</th>
          <th>Servicio</th>
          <th>Hora</th>
          <th>Estado</th>
        </tr>

      </thead>

      <tbody>

        {reservas.map((reserva) => (

          <tr key={reserva.id}>

            <td>{reserva.cliente}</td>

            <td>{reserva.barbero}</td>

            <td>{reserva.servicio}</td>

            <td>{reserva.hora}</td>

            <td>{reserva.estado}</td>

          </tr>

        ))}

      </tbody>

    </table>
  );
}