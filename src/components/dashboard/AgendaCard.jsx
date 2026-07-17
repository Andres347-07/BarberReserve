import agenda from "../../mocks/agenda";
import "./AgendaCard.css";

export default function AgendaCard() {

    return (

        <div className="agenda-card">

            {agenda.map((item, index) => (

                <div
                    className="agenda-item"
                    key={index}
                >

                    <span className="hora">
                        {item.hora}
                    </span>

                    <span className="evento">
                        {item.evento}
                    </span>

                </div>

            ))}

        </div>

    );

}