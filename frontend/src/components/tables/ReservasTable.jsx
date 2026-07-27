import "./ReservasTable.css";

export default function ReservasTable({ reservas = [] }) {
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
        {reservas.length === 0 && (
          <tr><td colSpan={5}>No hay reservas para mostrar.</td></tr>
        )}

        {reservas.map((reserva) => (
          <tr key={reserva.id}>
            <td>{reserva.cliente?.nombre}</td>
            <td>{reserva.barbero?.nombre}</td>
            <td>{reserva.servicio?.nombre}</td>
            <td>{reserva.hora?.slice(0, 5)}</td>
            <td>{reserva.estado}</td>
          </tr>
        ))}
      </tbody>

    </table>
  );
}
