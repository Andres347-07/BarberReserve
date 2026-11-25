import { useEffect, useState } from "react";
import "./AvisoServidor.css";

/**
 * Explica la espera cuando el servidor tarda en responder (arranque en frío
 * del plan gratuito). Usa role="status" para que los lectores de pantalla lo
 * anuncien sin interrumpir, y no mueve el foco.
 */
export default function AvisoServidor() {
    const [lento, setLento] = useState(false);

    useEffect(() => {
        const manejar = (e) => setLento(Boolean(e.detail?.lento));
        window.addEventListener("barberreserve:servidor-lento", manejar);
        return () => window.removeEventListener("barberreserve:servidor-lento", manejar);
    }, []);

    return (
        <div className="aviso-servidor-region" role="status" aria-live="polite">
            {lento && (
                <p className="aviso-servidor">
                    <span className="aviso-servidor__icono" aria-hidden="true" />
                    Estamos activando el servidor. La primera carga puede tardar hasta un
                    minuto; no es necesario recargar la página.
                </p>
            )}
        </div>
    );
}
