import { useRef, useState } from "react";
import { FaUniversalAccess } from "react-icons/fa";

import { usePreferencias } from "../../contexts/PreferenciasContext";
import useDialogo from "../../hooks/useDialogo";

import "./Preferencias.css";

const TAMANOS = [
    [100, "Normal (100 %)"],
    [115, "Grande (115 %)"],
    [130, "Muy grande (130 %)"],
    [150, "Máximo (150 %)"],
];

/**
 * Botón y ventana de "Preferencias de accesibilidad". Los cambios se aplican
 * al instante y se guardan para próximas visitas en este navegador.
 */
export default function PreferenciasBoton({ variante = "admin" }) {
    const { preferencias, cambiar, restablecer } = usePreferencias();
    const [abierto, setAbierto] = useState(false);
    const refDialogo = useRef(null);
    const refBoton = useRef(null);

    const cerrar = () => {
        setAbierto(false);
        setTimeout(() => refBoton.current?.focus(), 0);
    };

    useDialogo(refDialogo, { activo: abierto, onCerrar: cerrar });

    return (
        <>
            <button
                ref={refBoton}
                type="button"
                className={variante === "portal" ? "pref-boton-portal" : "navbar-icon-btn"}
                onClick={() => setAbierto(true)}
                aria-haspopup="dialog"
                aria-label={variante === "portal" ? undefined : "Preferencias de accesibilidad"}
                title="Preferencias de accesibilidad"
            >
                <FaUniversalAccess aria-hidden="true" />
                {variante === "portal" && <span>Accesibilidad</span>}
            </button>

            {abierto && (
                <div className="pref-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
                    <div
                        ref={refDialogo}
                        className="pref-dialogo"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pref-titulo"
                        aria-describedby="pref-descripcion"
                    >
                        <h2 id="pref-titulo">Preferencias de accesibilidad</h2>
                        <p id="pref-descripcion" className="campo-ayuda">
                            Los cambios se aplican de inmediato y se guardan en este navegador.
                        </p>

                        <fieldset className="pref-grupo">
                            <legend>Contraste</legend>
                            {[["estandar", "Estándar"], ["alto", "Alto contraste"]].map(([v, t]) => (
                                <label key={v} className="pref-opcion">
                                    <input type="radio" name="pref-contraste" value={v}
                                        checked={preferencias.contraste === v}
                                        onChange={() => cambiar("contraste", v)} />
                                    <span>{t}</span>
                                </label>
                            ))}
                        </fieldset>

                        <fieldset className="pref-grupo">
                            <legend>Tamaño del texto</legend>
                            {TAMANOS.map(([v, t]) => (
                                <label key={v} className="pref-opcion">
                                    <input type="radio" name="pref-tamano" value={v}
                                        checked={preferencias.tamano === v}
                                        onChange={() => cambiar("tamano", v)} />
                                    <span>{t}</span>
                                </label>
                            ))}
                        </fieldset>

                        <fieldset className="pref-grupo">
                            <legend>Lectura y movimiento</legend>
                            <label className="pref-opcion">
                                <input type="checkbox" checked={preferencias.reducirMovimiento}
                                    onChange={(e) => cambiar("reducirMovimiento", e.target.checked)} />
                                <span>Reducir animaciones y movimiento</span>
                            </label>
                            <label className="pref-opcion">
                                <input type="checkbox" checked={preferencias.subrayarEnlaces}
                                    onChange={(e) => cambiar("subrayarEnlaces", e.target.checked)} />
                                <span>Subrayar todos los enlaces</span>
                            </label>
                            <label className="pref-opcion">
                                <input type="checkbox" checked={preferencias.espaciado}
                                    onChange={(e) => cambiar("espaciado", e.target.checked)} />
                                <span>Aumentar el espaciado entre letras, palabras y líneas</span>
                            </label>
                        </fieldset>

                        <div className="pref-acciones">
                            <button type="button" className="btn-secondary" onClick={restablecer}>
                                Restablecer
                            </button>
                            <button type="button" className="btn-primary" onClick={cerrar}>
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
