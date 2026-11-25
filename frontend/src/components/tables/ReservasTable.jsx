import "./ReservasTable.css";

import { claseEstado, etiquetaEstado } from "../../utils/estados";

export default function ReservasTable({ reservas = [], caption = "Reservas de hoy" }) {
  return (
    <div className="reservas-table-scroll" role="region" aria-label={caption} tabIndex={0}>
    <table className="reservas-table">

      <caption className="sr-only">{caption}</caption>

      <thead>
        <tr>
          <th scope="col">Hora</th>
          <th scope="col">Cliente</th>
          <th scope="col">Barbero</th>
          <th scope="col">Servicio</th>
          <th scope="col">Estado</th>
        </tr>
      </thead>

      <tbody>
        {reservas.length === 0 && (
          <tr><td colSpan={5} className="reservas-table-vacia">No hay reservas para mostrar.</td></tr>
        )}

        {reservas.map((reserva) => (
          <tr key={reserva.id}>
            <td className="reservas-table-hora">{reserva.hora?.slice(0, 5)}</td>
            <td>{reserva.cliente?.nombre}</td>
            <td>{reserva.barbero?.nombre}</td>
            <td>{reserva.servicio?.nombre}</td>
            <td><span className={claseEstado(reserva.estado)}>{etiquetaEstado(reserva.estado)}</span></td>
          </tr>
        ))}
      </tbody>

    </table>
    </div>
  );
}
