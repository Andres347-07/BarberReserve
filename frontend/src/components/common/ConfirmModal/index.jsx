import { useId, useRef } from "react";

import useDialogo from "../../../hooks/useDialogo";
import "./ConfirmModal.css";

/**
 * Modal de confirmación accesible: role="alertdialog", título y mensaje
 * asociados, foco atrapado, Escape para cancelar y foco inicial en la
 * opción segura (Cancelar).
 */
export default function ConfirmModal({
    abierto,
    titulo = "¿Está seguro?",
    mensaje,
    confirmarTexto = "Sí, eliminar",
    cancelarTexto = "Cancelar",
    onConfirmar,
    onCancelar,
    soloInformativo = false,
    variante = "danger",
}) {

    const ref = useRef(null);
    const idBase = useId();

    useDialogo(ref, {
        activo: abierto,
        onCerrar: soloInformativo ? onConfirmar : onCancelar,
    });

    if (!abierto) return null;

    return (
        <div className="confirm-modal-overlay">
            <div
                ref={ref}
                className="confirm-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`${idBase}-titulo`}
                aria-describedby={`${idBase}-mensaje`}
            >
                <h2 id={`${idBase}-titulo`} className="confirm-modal-titulo">{titulo}</h2>
                <div id={`${idBase}-mensaje`} className="confirm-modal-mensaje">{mensaje}</div>

                <div className="confirm-modal-buttons">
                    {!soloInformativo && (
                        <button type="button" className="btn-secondary" onClick={onCancelar}>
                            {cancelarTexto}
                        </button>
                    )}

                    <button
                        type="button"
                        className={soloInformativo ? "btn-primary" : (variante === "danger" ? "btn-danger" : "btn-primary")}
                        onClick={onConfirmar}
                    >
                        {confirmarTexto}
                    </button>
                </div>
            </div>
        </div>
    );
}
