import { useState } from "react";

import "./BarberoForm.css";

export default function BarberoForm({
    onCancel,
    onSave,
    barbero = null
}) {

    const [formulario, setFormulario] = useState({

        nombre: barbero?.nombre || "",
        especialidad: barbero?.especialidad || "",
        telefono: barbero?.telefono || "",
        correo: barbero?.correo || "",
        estado: barbero?.estado || "Activo"

    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormulario((prev) => ({

            ...prev,
            [name]: value

        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSave(formulario);

    };

    return (

        <div className="barbero-form-container">

            <form
                className="barbero-form"
                onSubmit={handleSubmit}
            >

                <h2>
                    {barbero ? "Editar Barbero" : "Nuevo Barbero"}
                </h2>

                <p>

                    {barbero
                        ? "Modifique la información del barbero."
                        : "Complete la información para registrar un nuevo barbero."}

                </p>

                <div className="form-group">

                    <label>Nombre completo</label>

                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre"
                    />

                </div>

                <div className="form-group">

                    <label>Especialidad</label>

                    <input
                        type="text"
                        name="especialidad"
                        value={formulario.especialidad}
                        onChange={handleChange}
                        placeholder="Ej: Fade y Barba"
                    />

                </div>

                <div className="form-group">

                    <label>Teléfono</label>

                    <input
                        type="text"
                        name="telefono"
                        value={formulario.telefono}
                        onChange={handleChange}
                        placeholder="Ingrese el teléfono"
                    />

                </div>

                <div className="form-group">

                    <label>Correo electrónico</label>

                    <input
                        type="email"
                        name="correo"
                        value={formulario.correo}
                        onChange={handleChange}
                        placeholder="Ingrese el correo"
                    />

                </div>

                <div className="form-group">

                    <label>Estado</label>

                    <select
                        name="estado"
                        value={formulario.estado}
                        onChange={handleChange}
                    >

                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>

                    </select>

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
                        {barbero ? "Guardar cambios" : "Guardar"}
                    </button>

                </div>

            </form>

        </div>

    );

}