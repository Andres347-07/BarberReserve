import { useEffect, useState } from "react";

import "./HorarioSemanaForm.css";

import horarioService from "../../../services/horarioService";
import TablaTurnos from "../../horarios/TablaTurnos";
import { validarTurno } from "../../horarios/utilHorario";

function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

/**
 * Semana específica (excepciones): cambia el turno de fechas concretas sin
 * tocar la plantilla. Los días que no se modifican conservan el turno de la
 * plantilla.
 */
export default function HorarioSemanaForm({ barbero, onCancel, onSave }) {
    const [semana, setSemana] = useState(null);
    const [dias, setDias] = useState([]);
    const [original, setOriginal] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [errores, setErrores] = useState({});

    useEffect(() => {
        horarioService
            .obtenerSemanaActual(barbero.id)
            .then((data) => {
                setSemana(data);
                setDias(data.dias);
                setOriginal(data.dias);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "No fue posible cargar la semana actual.");
            })
            .finally(() => setCargando(false));
    }, [barbero.id]);

    const actualizarDia = (index, campo, valor) => {
        setDias((prev) => prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));
        setErrores((prev) => ({ ...prev, [index]: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const nuevos = {};
        dias.forEach((d, i) => { const m = validarTurno(d); if (m) nuevos[i] = m; });
        setErrores(nuevos);
        if (Object.keys(nuevos).length) return;

        // Solo se guardan como excepción los días modificados (o que ya eran excepción).
        const cambiados = dias.filter((d, i) => d.origen === "excepcion" || JSON.stringify(d) !== JSON.stringify(original[i]));
        if (cambiados.length === 0) {
            setError("No hay cambios: todos los días siguen la plantilla semanal.");
            return;
        }

        onSave({
            barberoId: barbero.id,
            semana: semana.semana,
            dias: cambiados.map(({ fecha, horaInicio, horaFin, pausaInicio, pausaFin, estado }) => ({
                fecha,
                horaInicio: estado === "Descanso" ? null : horaInicio,
                horaFin: estado === "Descanso" ? null : horaFin,
                pausaInicio: estado === "Descanso" || !pausaInicio ? null : pausaInicio,
                pausaFin: estado === "Descanso" || !pausaFin ? null : pausaFin,
                estado,
            })),
        });
    };

    if (cargando) return <p role="status">Cargando la semana actual…</p>;

    return (
        <form className="horario-card" onSubmit={handleSubmit} noValidate aria-labelledby="titulo-semana">
            <div className="horario-card-header">
                <div>
                    <h2 id="titulo-semana">Semana específica</h2>
                    {semana && (
                        <p className="page-subtitle">
                            Semana del {formatearFecha(semana.semana)} al {formatearFecha(semana.semanaFin)}.
                            Los cambios aplican solo a estas fechas (festivo, vacaciones, horario especial).
                        </p>
                    )}
                </div>
            </div>

            <div aria-live="assertive">
                {error && <p className="error-text" role="alert">{error}</p>}
            </div>

            {dias.length > 0 && (
                <TablaTurnos
                    dias={dias}
                    onCambiar={actualizarDia}
                    errores={errores}
                    mostrarFecha
                    caption={`Turnos de ${barbero.nombre} para la semana actual`}
                />
            )}

            <div className="form-buttons">
                {onCancel && (
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                )}
                <button type="submit" className="btn-primary" disabled={!semana}>
                    Guardar cambios de la semana
                </button>
            </div>
        </form>
    );
}
