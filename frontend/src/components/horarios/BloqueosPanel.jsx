import { useEffect, useState } from "react";
import { FaTrash, FaLock } from "react-icons/fa";

import horarioService from "../../services/horarioService";
import ConfirmModal from "../common/ConfirmModal";
import { hoyISO, fechaLarga } from "../../utils/fechas";

/**
 * Bloqueos de tiempo (diligencia, capacitación, cita médica). Lo usan el
 * administrador (para cualquier barbero) y el barbero (para su agenda).
 */
export default function BloqueosPanel({ barberoId, mostrarToast, titulo = "Bloqueos de tiempo", fechaInicial }) {
    const [lista, setLista] = useState([]);
    const [form, setForm] = useState({ fecha: fechaInicial || hoyISO(), horaInicio: "", horaFin: "", motivo: "" });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [aEliminar, setAEliminar] = useState(null);

    const cargar = () => horarioService.obtenerBloqueos({ barberoId, desde: hoyISO() }).then(setLista).catch(() => {});

    useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [barberoId]);

    const cambiar = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setErrores((p) => ({ ...p, [e.target.name]: "" }));
    };

    const crear = async (e) => {
        e.preventDefault();
        const n = {};
        if (!form.fecha) n.fecha = "Elija la fecha.";
        else if (form.fecha < hoyISO()) n.fecha = "La fecha no puede estar en el pasado.";
        if (!form.horaInicio) n.horaInicio = "Indique desde qué hora.";
        if (!form.horaFin) n.horaFin = "Indique hasta qué hora.";
        else if (form.horaInicio && form.horaFin <= form.horaInicio) n.horaFin = "Debe ser posterior a la hora de inicio.";
        setErrores(n);
        setErrorGeneral("");
        if (Object.keys(n).length) {
            setTimeout(() => e.target.querySelector('[aria-invalid="true"]')?.focus(), 0);
            return;
        }
        try {
            await horarioService.crearBloqueo({ ...form, barberoId });
            mostrarToast("Horario bloqueado. Los clientes ya no podrán reservar en esa franja.");
            setForm((p) => ({ ...p, horaInicio: "", horaFin: "", motivo: "" }));
            cargar();
        } catch (err) {
            setErrorGeneral(err.response?.data?.message || "No fue posible bloquear el horario.");
        }
    };

    const eliminar = async () => {
        const b = aEliminar;
        setAEliminar(null);
        try {
            await horarioService.eliminarBloqueo(b.id);
            mostrarToast("Bloqueo eliminado. El horario vuelve a estar disponible.");
            cargar();
        } catch (err) {
            mostrarToast(err.response?.data?.message || "No fue posible eliminar el bloqueo.", "error");
        }
    };

    const campo = (name, label, type, extra = {}) => (
        <div className="form-group">
            <label htmlFor={`bloqueo-${name}`}>{label}</label>
            <input
                id={`bloqueo-${name}`}
                name={name}
                type={type}
                value={form[name]}
                onChange={cambiar}
                aria-invalid={!!errores[name]}
                aria-describedby={errores[name] ? `bloqueo-error-${name}` : undefined}
                {...extra}
            />
            {errores[name] && <p className="error-text" id={`bloqueo-error-${name}`}>{errores[name]}</p>}
        </div>
    );

    return (
        <section className="horario-card" aria-labelledby="titulo-bloqueos">
            <h2 id="titulo-bloqueos">{titulo}</h2>
            <p className="page-subtitle">Bloquee una franja para que nadie pueda reservar en ella. No se puede bloquear encima de una cita.</p>

            <form className="bloqueo-form" onSubmit={crear} noValidate>
                {campo("fecha", "Fecha", "date", { min: hoyISO() })}
                {campo("horaInicio", "Desde", "time", { step: 900 })}
                {campo("horaFin", "Hasta", "time", { step: 900 })}
                {campo("motivo", "Motivo (opcional)", "text", { maxLength: 120, placeholder: "Ej.: diligencia personal" })}
                <div className="bloqueo-accion">
                    <button type="submit" className="btn-primary"><FaLock aria-hidden="true" /> Bloquear</button>
                </div>
            </form>

            <div aria-live="assertive">
                {errorGeneral && <p className="error-text" role="alert">{errorGeneral}</p>}
            </div>

            <h3 className="bloqueos-subtitulo">Próximos bloqueos</h3>
            {lista.length === 0 ? (
                <p className="page-subtitle">No hay bloqueos programados.</p>
            ) : (
                <ul className="bloqueos-lista">
                    {lista.map((b) => (
                        <li key={b.id}>
                            <span>
                                <strong className="capitalizar">{fechaLarga(b.fecha)}</strong>, {b.horaInicio.slice(0, 5)} a {b.horaFin.slice(0, 5)}
                                {b.motivo && <> — {b.motivo}</>}
                            </span>
                            <button
                                type="button"
                                className="btn-cancelar-reserva"
                                onClick={() => setAEliminar(b)}
                                aria-label={`Eliminar bloqueo del ${fechaLarga(b.fecha)} de ${b.horaInicio.slice(0, 5)} a ${b.horaFin.slice(0, 5)}`}
                            >
                                <FaTrash aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmModal
                abierto={!!aEliminar}
                titulo="¿Eliminar el bloqueo?"
                mensaje="La franja volverá a estar disponible para reservas."
                confirmarTexto="Sí, eliminar"
                onConfirmar={eliminar}
                onCancelar={() => setAEliminar(null)}
            />
        </section>
    );
}
