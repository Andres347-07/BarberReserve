import "./Agenda.css";

import agenda from "../../mocks/agenda";

export default function Agenda() {

  return (

    <div className="agenda-page">

      <div className="agenda-header">

        <div>

          <h1>Agenda</h1>

          <p>
            Visualiza las citas programadas para el día.
          </p>

        </div>

      </div>

      <div className="agenda-container">

        <div className="agenda-list">

          <h2>Agenda del día</h2>

          {agenda.map((cita) => (

            <div
              key={cita.id}
              className="agenda-card"
            >

              <div className="hora-badge">
                {cita.hora}
              </div>

              <div className="agenda-info">

                <div className="info-item">

                  <span className="info-label">
                    Cliente
                  </span>

                  <span className="info-value">
                    {cita.cliente}
                  </span>

                </div>

                <div className="info-item">

                  <span className="info-label">
                    Servicio
                  </span>

                  <span className="info-value">
                    {cita.servicio}
                  </span>

                </div>

                <div className="info-item">

                  <span className="info-label">
                    Barbero
                  </span>

                  <span className="info-value">
                    {cita.barbero}
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

        <div className="proximas-citas">

          <h2>Próximas citas</h2>

          {agenda.map((cita) => (

            <div
              key={cita.id}
              className="proxima-cita"
            >

              <div className="proxima-hora">
                {cita.hora}
              </div>

              <div className="proxima-info">

                <strong>
                  {cita.cliente}
                </strong>

                <span>
                  {cita.servicio}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}