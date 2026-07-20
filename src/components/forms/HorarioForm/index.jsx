import { useState } from "react";

import "./HorarioForm.css";

export default function HorarioForm({
    horario = null,
    onCancel,
    onSave
}) {

    const [formulario, setFormulario] = useState({

        barberoId: horario?.barberoId || "",
        diaSemana: horario?.diaSemana || "",
        horaInicio: horario?.horaInicio || "",
        horaFin: horario?.horaFin || "",
        activo: horario?.activo ?? true

    });

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormulario((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSave(formulario);

    };

    return (

        <div className="horario-form-container">

            <form
                className="horario-form"
                onSubmit={handleSubmit}
            >

                <h2>
                    {horario ? "Editar Horario" : "Nuevo Horario"}
                </h2>

                <p>

                    {horario
                        ? "Modifique la información del horario."
                        : "Complete la información del nuevo horario."}

                </p>

                <div className="form-group">

                    <label>Barbero ID</label>

                    <input
                        type="number"
                        name="barberoId"
                        value={formulario.barberoId}
                        onChange={handleChange}
                    />

                </div>

                <div className="form-group">

                    <label>Día</label>

                    <input
                        type="text"
                        name="diaSemana"
                        value={formulario.diaSemana}
                        onChange={handleChange}
                    />

                </div>

                <div className="form-group">

                    <label>Hora inicio</label>

                    <input
                        type="time"
                        name="horaInicio"
                        value={formulario.horaInicio}
                        onChange={handleChange}
                    />

                </div>

                <div className="form-group">

                    <label>Hora fin</label>

                    <input
                        type="time"
                        name="horaFin"
                        value={formulario.horaFin}
                        onChange={handleChange}
                    />

                </div>

                <div className="form-group">

                    <label>

                        <input
                            type="checkbox"
                            name="activo"
                            checked={formulario.activo}
                            onChange={handleChange}
                        />

                        Activo

                    </label>

                </div>

                <div className="form-buttons">

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="btn-primary"
                    >
                        {horario ? "Guardar cambios" : "Guardar"}
                    </button>

                </div>

            </form>

        </div>

    );

}