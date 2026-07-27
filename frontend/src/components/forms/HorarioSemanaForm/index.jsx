import { useEffect, useState } from "react";

import "./HorarioSemanaForm.css";

import horarioService from "../../../services/horarioService";

function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

export default function HorarioSemanaForm({ barbero, onCancel, onSave }) {
    const [semana, setSemana] = useState(null);
    const [dias, setDias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        horarioService
            .obtenerSemanaActual(barbero.id)
            .then((data) => {
                setSemana(data);
                setDias(data.dias);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "No fue posible cargar la semana actual.");
            })
            .finally(() => setCargando(false));
    }, [barbero.id]);

    const actualizarDia = (index, campo, valor) => {
        setDias((prev) =>
            prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d))
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSave({
            barberoId: barbero.id,
            semana: semana.semana,
            dias: dias.map(({ fecha, horaInicio, horaFin, estado }) => ({
                fecha,
                horaInicio: estado === "Descanso" ? null : horaInicio,
                horaFin: estado === "Descanso" ? null : horaFin,
                estado,
            })),
        });
    };

    if (cargando) {
        return (
            <div className="horario-form-container">
                <div className="horario-form">
                    <p>Cargando la semana actual...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="horario-form-container">
            <form className="horario-form" onSubmit={handleSubmit}>
                <h2>Configurar Horario — {barbero.nombre}</h2>

                {semana && (
                    <p>
                        Semana del {formatearFecha(semana.semana)} al {formatearFecha(semana.semanaFin)}
                    </p>
                )}

                {error && <span className="error-text">{error}</span>}

                {dias.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 480, marginTop: 16, borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th>Día</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dias.map((dia, i) => (
                                <tr key={dia.fecha}>
                                    <td>{dia.dia}</td>
                                    <td>{formatearFecha(dia.fecha)}</td>
                                    <td>
                                        <select
                                            value={dia.estado}
                                            onChange={(e) => actualizarDia(i, "estado", e.target.value)}
                                        >
                                            <option value="Activo">Activo</option>
                                            <option value="Descanso">Descanso</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            disabled={dia.estado === "Descanso"}
                                            value={dia.horaInicio}
                                            onChange={(e) => actualizarDia(i, "horaInicio", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            disabled={dia.estado === "Descanso"}
                                            value={dia.horaFin}
                                            onChange={(e) => actualizarDia(i, "horaFin", e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

                <div className="form-buttons">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={!semana}>
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}
