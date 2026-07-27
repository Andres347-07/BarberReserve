import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

export default function Toast({
    mensaje,
    tipo = "success",
    cerrar
}) {

    if (!mensaje) return null;

    const iconos = {
        success: <FaCheckCircle />,
        error: <FaTimesCircle />,
        warning: <FaExclamationTriangle />,
        info: <FaInfoCircle />,
    };

    return (

        <div className={`toast toast-${tipo}`}>

            <div className="toast-content">

                <span className="toast-icon">
                    {iconos[tipo] || iconos.info}
                </span>


                <p>
                    {mensaje}
                </p>


                <button
                    onClick={cerrar}
                    aria-label="Cerrar notificación"
                >
                    <FaTimes />
                </button>


            </div>


        </div>

    );

}
