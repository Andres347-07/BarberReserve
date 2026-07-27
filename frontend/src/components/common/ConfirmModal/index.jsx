import "./ConfirmModal.css";

export default function ConfirmModal({
    abierto,
    titulo = "¿Está seguro?",
    mensaje,
    confirmarTexto = "Sí, eliminar",
    cancelarTexto = "Cancelar",
    onConfirmar,
    onCancelar,
    soloInformativo = false,
}) {

    if (!abierto) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal">
                <h3>{titulo}</h3>
                <div className="confirm-modal-mensaje">{mensaje}</div>

                <div className="confirm-modal-buttons">
                    {!soloInformativo && (
                        <button className="btn-secondary" onClick={onCancelar}>
                            {cancelarTexto}
                        </button>
                    )}

                    <button
                        className={soloInformativo ? "btn-primary" : "btn-danger"}
                        onClick={onConfirmar}
                    >
                        {confirmarTexto}
                    </button>
                </div>
            </div>
        </div>
    );
}
