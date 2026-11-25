import { useEffect, useState } from "react";

import configuracionService from "../../services/configuracionService";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";
import enfocarPrimerError from "../../utils/enfocarPrimerError";

import { useAuth } from "../../contexts/useAuth";
import SeguridadDueno from "./SeguridadDueno";

import "./Configuracion.css";

const CAMPOS = [
    { grupo: "Agenda", nombre: "minutosLimpieza", etiqueta: "Minutos de limpieza entre clientes", ayuda: "Tiempo que se reserva después de cada servicio para limpiar y preparar la silla.", min: 0, max: 30, unidad: "min" },
    { grupo: "Agenda", nombre: "intervaloCupos", etiqueta: "Mostrar cupos cada", ayuda: "Cada cuántos minutos se ofrece una hora para reservar.", tipo: "select", opciones: [[0, "Según la duración del servicio"], [5, "5 minutos"], [10, "10 minutos"], [15, "15 minutos"], [20, "20 minutos"], [30, "30 minutos"], [60, "60 minutos"]] },
    { grupo: "Agenda", nombre: "minutosToleranciaNoAsistio", etiqueta: "Tolerancia antes de marcar “No asistió”", ayuda: "Minutos de espera después de la hora de la cita.", min: 0, max: 60, unidad: "min" },
    { grupo: "Reservas en línea", nombre: "anticipacionMinutos", etiqueta: "Anticipación mínima para reservar", ayuda: "Un cliente no puede reservar una hora que empiece antes de este tiempo.", min: 0, max: 1440, unidad: "min" },
    { grupo: "Reservas en línea", nombre: "diasMaximos", etiqueta: "Reservar hasta con", ayuda: "Días hacia adelante que el cliente ve en el calendario.", min: 1, max: 180, unidad: "días" },
    { grupo: "Reservas en línea", nombre: "horasLimiteCancelacion", etiqueta: "Cancelación en línea hasta", ayuda: "Horas antes de la cita en que el cliente aún puede cancelar desde el portal.", min: 0, max: 72, unidad: "horas antes" },
    { grupo: "Jornada laboral", nombre: "horasSemanalesMaximas", etiqueta: "Horas semanales máximas por barbero", ayuda: "Tope para advertir al guardar una plantilla. En Colombia, 42 horas desde el 15 de julio de 2026 (Ley 2101 de 2021).", min: 1, max: 60, unidad: "horas" },
];

export default function Configuracion() {
    const { usuario } = useAuth();
    const [valores, setValores] = useState(null);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const { toast, mostrarToast, cerrarToast } = useToast();

    useEffect(() => {
        configuracionService.obtener().then(setValores).catch(() => mostrarToast("No fue posible cargar la configuración.", "error"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cambiar = (e) => {
        setValores((v) => ({ ...v, [e.target.name]: e.target.value }));
        setErrores((x) => ({ ...x, [e.target.name]: "" }));
    };

    const guardar = async (e) => {
        e.preventDefault();
        const nuevos = {};
        if (!valores.nombreNegocio || valores.nombreNegocio.trim().length < 3) nuevos.nombreNegocio = "Escriba el nombre del negocio (mínimo 3 caracteres).";
        CAMPOS.filter((c) => c.tipo !== "select").forEach((c) => {
            const n = Number(valores[c.nombre]);
            if (valores[c.nombre] === "" || !Number.isInteger(n) || n < c.min || n > c.max) {
                nuevos[c.nombre] = `Escriba un número entero entre ${c.min} y ${c.max}.`;
            }
        });
        setErrores(nuevos);
        if (Object.keys(nuevos).length) { enfocarPrimerError(e.currentTarget); return; }

        setGuardando(true);
        try {
            const datos = { nombreNegocio: valores.nombreNegocio };
            CAMPOS.forEach((c) => { datos[c.nombre] = Number(valores[c.nombre]); });
            const res = await configuracionService.guardar(datos);
            setValores(res.data);
            mostrarToast("Configuración guardada. Aplica a las nuevas reservas.");
        } catch (err) {
            mostrarToast(err.response?.data?.message || "No fue posible guardar.", "error");
        } finally {
            setGuardando(false);
        }
    };

    const campo = (c) => {
        const id = `config-${c.nombre}`;
        const describe = [`${id}-ayuda`, errores[c.nombre] ? `${id}-error` : null].filter(Boolean).join(" ");
        return (
            <div className="form-group" key={c.nombre}>
                <label htmlFor={id}>{c.etiqueta}</label>
                <div className="config-control">
                    {c.tipo === "select" ? (
                        <select id={id} name={c.nombre} value={valores[c.nombre]} onChange={cambiar} aria-describedby={describe}>
                            {c.opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                        </select>
                    ) : (
                        <input
                            id={id} name={c.nombre} type="number" inputMode="numeric"
                            min={c.min} max={c.max} value={valores[c.nombre]} onChange={cambiar}
                            aria-invalid={!!errores[c.nombre]} aria-describedby={describe}
                        />
                    )}
                    {c.unidad && <span className="config-unidad" aria-hidden="true">{c.unidad}</span>}
                </div>
                <p className="campo-ayuda" id={`${id}-ayuda`}>{c.ayuda}{c.unidad ? ` (en ${c.unidad.replace(" antes", "")})` : ""}</p>
                {errores[c.nombre] && <p className="error-text" id={`${id}-error`}>{errores[c.nombre]}</p>}
            </div>
        );
    };

    return (
        <div className="configuracion-page">
            <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

            <div className="config-header">
                <h1>Configuración del negocio</h1>
                <p className="page-subtitle">Reglas de la agenda y de las reservas en línea. Los cambios aplican a las nuevas citas.</p>
            </div>

            {!valores ? <p role="status">Cargando…</p> : (
                <form onSubmit={guardar} noValidate className="config-form">
                    <fieldset className="config-grupo">
                        <legend>Negocio</legend>
                        <div className="form-group">
                            <label htmlFor="config-nombreNegocio">Nombre de la barbería</label>
                            <input
                                id="config-nombreNegocio" name="nombreNegocio" type="text" maxLength={80}
                                value={valores.nombreNegocio} onChange={cambiar}
                                aria-invalid={!!errores.nombreNegocio}
                                aria-describedby={errores.nombreNegocio ? "config-nombreNegocio-error" : undefined}
                            />
                            {errores.nombreNegocio && <p className="error-text" id="config-nombreNegocio-error">{errores.nombreNegocio}</p>}
                        </div>
                    </fieldset>

                    {["Agenda", "Reservas en línea", "Jornada laboral"].map((g) => (
                        <fieldset className="config-grupo" key={g}>
                            <legend>{g}</legend>
                            <div className="config-campos">
                                {CAMPOS.filter((c) => c.grupo === g).map(campo)}
                            </div>
                        </fieldset>
                    ))}

                    <div className="form-buttons">
                        <button type="submit" className="btn-primary" disabled={guardando}>
                            {guardando ? "Guardando…" : "Guardar configuración"}
                        </button>
                    </div>
                </form>
            )}

            {usuario?.esPropietario && <SeguridadDueno email={usuario.email} />}
        </div>
    );
}
