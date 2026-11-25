import { useId, useRef } from "react";

import "./Tabs.css";

/**
 * Pestañas accesibles (patrón "tabs" de WAI-ARIA):
 *  - role="tablist" / "tab" / "tabpanel" con aria-selected y aria-controls.
 *  - Solo la pestaña activa está en el orden de tabulación.
 *  - Flechas izquierda/derecha, Inicio y Fin cambian de pestaña.
 */
export default function Tabs({ pestanas, activa, onCambiar, etiqueta, children }) {
    const base = useId();
    const refs = useRef({});

    const indice = pestanas.findIndex((p) => p.id === activa);

    const mover = (nuevo) => {
        const p = pestanas[(nuevo + pestanas.length) % pestanas.length];
        onCambiar(p.id);
        setTimeout(() => refs.current[p.id]?.focus(), 0);
    };

    const alPresionar = (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); mover(indice + 1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); mover(indice - 1); }
        else if (e.key === "Home") { e.preventDefault(); mover(0); }
        else if (e.key === "End") { e.preventDefault(); mover(pestanas.length - 1); }
    };

    return (
        <div className="tabs">
            <div role="tablist" aria-label={etiqueta} className="tabs-lista" onKeyDown={alPresionar}>
                {pestanas.map((p) => (
                    <button
                        key={p.id}
                        ref={(el) => { refs.current[p.id] = el; }}
                        type="button"
                        role="tab"
                        id={`${base}-tab-${p.id}`}
                        aria-selected={p.id === activa}
                        aria-controls={`${base}-panel-${p.id}`}
                        tabIndex={p.id === activa ? 0 : -1}
                        className={`tabs-tab ${p.id === activa ? "activa" : ""}`}
                        onClick={() => onCambiar(p.id)}
                    >
                        {p.icono && <span aria-hidden="true" className="tabs-icono">{p.icono}</span>}
                        {p.etiqueta}
                        {p.contador !== undefined && <span className="tabs-contador">{p.contador}</span>}
                    </button>
                ))}
            </div>

            <div
                role="tabpanel"
                id={`${base}-panel-${activa}`}
                aria-labelledby={`${base}-tab-${activa}`}
                tabIndex={0}
                className="tabs-panel"
            >
                {children}
            </div>
        </div>
    );
}
