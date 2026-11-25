import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

const ICONOS = {
    success: <FaCheckCircle aria-hidden="true" />,
    error: <FaTimesCircle aria-hidden="true" />,
    warning: <FaExclamationTriangle aria-hidden="true" />,
    info: <FaInfoCircle aria-hidden="true" />,
};

const PREFIJOS = {
    success: "Éxito:",
    error: "Error:",
    warning: "Advertencia:",
    info: "Información:",
};

/**
 * Notificación accesible. Las regiones "vivas" se mantienen siempre en el
 * DOM (aunque estén vacías) para que los lectores de pantalla anuncien el
 * mensaje en cuanto aparece: los errores de forma inmediata (assertive) y
 * el resto sin interrumpir (polite).
 */
export default function Toast({
    mensaje,
    tipo = "success",
    cerrar
}) {

    const esError = tipo === "error";

    const contenido = mensaje ? (
        <div className={`toast toast-${tipo}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {ICONOS[tipo] || ICONOS.info}
                </span>
                <p>
                    <span className="sr-only">{PREFIJOS[tipo] || ""} </span>
                    {mensaje}
                </p>
                <button type="button" onClick={cerrar} aria-label="Cerrar notificación">
                    <FaTimes aria-hidden="true" />
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            <div role="status" aria-live="polite" aria-atomic="true" className="toast-region">
                {!esError && contenido}
            </div>
            <div role="alert" aria-live="assertive" aria-atomic="true" className="toast-region">
                {esError && contenido}
            </div>
        </>
    );

}
