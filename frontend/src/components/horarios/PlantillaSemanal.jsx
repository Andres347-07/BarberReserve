import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

import horarioService from "../../services/horarioService";
import TablaTurnos from "./TablaTurnos";
import { horasDelTurno, formatoHoras, validarTurno } from "./utilHorario";

const PRESETS = {
    partido: { estado: "Activo", horaInicio: "08:00", horaFin: "18:00", pausaInicio: "12:00", pausaFin: "14:00" },
    corrido: { estado: "Activo", horaInicio: "08:00", horaFin: "15:00", pausaInicio: "", pausaFin: "" },
};

/**
 * Plantilla semanal de un barbero: se configura una vez y se repite cada
 * semana. Muestra el total de horas y advierte si supera el tope legal.
 */
export default function PlantillaSemanal({ barbero, mostrarToast }) {
    const [datos, setDatos] = useState(null);
    const [dias, setDias] = useState([]);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [advertencia, setAdvertencia] = useState("");

    useEffect(() => {
        horarioService.obtenerPlantilla(barbero.id)
            .then((d) => { setDatos(d); setDias(d.dias); })
            .catch((e) => setError(e.response?.data?.message || "No fue posible cargar la plantilla."));
    }, [barbero.id]);

    const cambiar = (i, campo, valor) => {
        setDias((prev) => prev.map((d, j) => (j === i ? { ...d, [campo]: valor } : d)));
        setErrores((prev) => ({ ...prev, [i]: "" }));
    };

    const aplicarPreset = (tipo) => {
        setDias((prev) => prev.map((d) => (d.diaSemana <= 5 ? { ...d, ...PRESETS[tipo] } : d)));
        setErrores({});
    };

    const total = dias.reduce((t, d) => t + horasDelTurno(d), 0);
    const maximo = datos?.horasSemanalesMaximas || 42;
    const excede = total > maximo;

    const guardar = async (e) => {
        e.preventDefault();
        const nuevos = {};
        dias.forEach((d, i) => { const m = validarTurno(d); if (m) nuevos[i] = m; });
        setErrores(nuevos);
        setError("");
        if (Object.keys(nuevos).length) {
            const primero = Number(Object.keys(nuevos)[0]);
            setTimeout(() => document.querySelector(`[aria-label="Hora de entrada del ${dias[primero].dia}"]`)?.focus(), 0);
            return;
        }

        setGuardando(true);
        try {
            const res = await horarioService.guardarPlantilla(barbero.id, dias.map((d) => ({
                diaSemana: d.diaSemana,
                estado: d.estado,
                horaInicio: d.horaInicio || null,
                horaFin: d.horaFin || null,
                pausaInicio: d.pausaInicio || null,
                pausaFin: d.pausaFin || null,
            })));
            setDatos(res.data);
            setAdvertencia(res.data.advertencia || "");
            mostrarToast(res.data.advertencia ? "Plantilla guardada con una advertencia." : "Plantilla semanal guardada.", res.data.advertencia ? "warning" : "success");
        } catch (err) {
            setError(err.response?.data?.message || "No fue posible guardar la plantilla.");
        } finally {
            setGuardando(false);
        }
    };

    if (!datos && !error) return <p role="status">Cargando plantilla…</p>;

    return (
        <form onSubmit={guardar} noValidate className="horario-card" aria-labelledby="titulo-plantilla">
            <div className="horario-card-header">
                <div>
                    <h2 id="titulo-plantilla">Plantilla semanal</h2>
                    <p className="page-subtitle">
                        Se repite todas las semanas. Para un día puntual (festivo, vacaciones) use “Semana específica”.
                    </p>
                </div>
                <div className="horario-presets" role="group" aria-label="Aplicar un horario típico de lunes a viernes">
                    <button type="button" className="btn-secondary btn-compacto" onClick={() => aplicarPreset("partido")}>
                        L-V partido 8–12 / 2–6
                    </button>
                    <button type="button" className="btn-secondary btn-compacto" onClick={() => aplicarPreset("corrido")}>
                        L-V corrido 8–3
                    </button>
                </div>
            </div>

            {!datos?.configurada && (
                <p className="aviso-info">Este barbero aún no tiene plantilla. Se muestra una sugerencia: revísela y guárdela.</p>
            )}

            <div aria-live="assertive">
                {error && <p className="error-text" role="alert">{error}</p>}
            </div>

            <TablaTurnos dias={dias} onCambiar={cambiar} errores={errores} caption={`Plantilla semanal de ${barbero.nombre}`} />

            <div className={`horas-resumen ${excede ? "excede" : ""}`} aria-live="polite">
                {excede && <FaExclamationTriangle aria-hidden="true" />}
                <span>
                    Total semanal: <strong>{formatoHoras(total)}</strong> de un máximo de {maximo} h (jornada ordinaria, Ley 2101 de 2021).
                    {excede && " Supera el tope si el barbero es empleado."}
                </span>
            </div>

            {advertencia && <p className="aviso-advertencia" role="status">{advertencia}</p>}

            <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={guardando}>
                    {guardando ? "Guardando…" : "Guardar plantilla"}
                </button>
            </div>
        </form>
    );
}
