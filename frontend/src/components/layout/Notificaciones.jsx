import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";

import notificacionService from "../../services/notificacionService";
import useDialogo from "../../hooks/useDialogo";

const INTERVALO_MS = 60000;

function hace(fechaISO) {
    const min = Math.round((Date.now() - new Date(fechaISO).getTime()) / 60000);
    if (min < 1) return "hace un momento";
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    return new Date(fechaISO).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

/**
 * Campana de notificaciones: nuevas citas en línea, cancelaciones y
 * reasignaciones. Se consulta cada minuto. El número de avisos sin leer
 * forma parte del nombre del botón ("Notificaciones, 2 sin leer"), y la
 * llegada de avisos nuevos se anuncia sin interrumpir.
 */
export default function Notificaciones() {
    const [datos, setDatos] = useState({ notificaciones: [], noLeidas: 0 });
    const [abierto, setAbierto] = useState(false);
    const [anuncio, setAnuncio] = useState("");
    const previas = useRef(null);
    const refPanel = useRef(null);
    const refBoton = useRef(null);

    const cargar = async () => {
        try {
            const d = await notificacionService.listar();
            if (previas.current !== null && d.noLeidas > previas.current) {
                setAnuncio(`Tiene ${d.noLeidas - previas.current} notificación(es) nueva(s).`);
            }
            previas.current = d.noLeidas;
            setDatos(d);
        } catch {
            // sin conexión: se reintenta en el siguiente ciclo
        }
    };

    useEffect(() => {
        cargar();
        const id = setInterval(cargar, INTERVALO_MS);
        return () => clearInterval(id);
    }, []);

    const cerrar = () => {
        setAbierto(false);
        refBoton.current?.focus();
    };

    useDialogo(refPanel, { activo: abierto, onCerrar: cerrar });

    useEffect(() => {
        if (!abierto) return undefined;
        const fuera = (e) => {
            if (!refPanel.current?.contains(e.target) && !refBoton.current?.contains(e.target)) setAbierto(false);
        };
        document.addEventListener("mousedown", fuera);
        return () => document.removeEventListener("mousedown", fuera);
    }, [abierto]);

    const marcarTodas = async () => {
        await notificacionService.marcarTodas();
        previas.current = 0;
        cargar();
    };

    const marcar = async (n) => {
        if (n.leida) return;
        await notificacionService.marcarLeida(n.id);
        previas.current = Math.max(0, (previas.current || 1) - 1);
        cargar();
    };

    const { notificaciones, noLeidas } = datos;

    return (
        <div className="notif">
            <button
                ref={refBoton}
                type="button"
                className="navbar-icon-btn notif-boton"
                aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
                aria-expanded={abierto}
                aria-haspopup="dialog"
                onClick={() => setAbierto((v) => !v)}
            >
                <FaBell aria-hidden="true" />
                {noLeidas > 0 && <span className="notif-contador" aria-hidden="true">{noLeidas > 9 ? "9+" : noLeidas}</span>}
            </button>

            <p className="sr-only" role="status" aria-live="polite">{anuncio}</p>

            {abierto && (
                <div ref={refPanel} className="notif-panel" role="dialog" aria-modal="false" aria-labelledby="notif-titulo">
                    <div className="notif-cabecera">
                        <h2 id="notif-titulo">Notificaciones</h2>
                        {noLeidas > 0 && (
                            <button type="button" className="btn-ghost btn-compacto" onClick={marcarTodas}>
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {notificaciones.length === 0 ? (
                        <p className="notif-vacio">No tiene notificaciones.</p>
                    ) : (
                        <ul className="notif-lista">
                            {notificaciones.map((n) => (
                                <li key={n.id} className={n.leida ? "" : "no-leida"}>
                                    <button type="button" className="notif-item" onClick={() => marcar(n)}>
                                        {!n.leida && <span className="sr-only">Sin leer: </span>}
                                        <span className="notif-mensaje">{n.mensaje}</span>
                                        <span className="notif-hora">{hace(n.createdAt)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button type="button" className="btn-secondary btn-compacto notif-cerrar" onClick={cerrar}>
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}
