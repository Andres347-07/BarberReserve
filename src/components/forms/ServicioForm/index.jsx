import { useState } from "react";

import "./ServicioForm.css";

export default function ServicioForm({
    onCancel,
    onSave,
    servicio = null
}) {

    const [formulario, setFormulario] = useState({

        nombre: servicio?.nombre || "",
        descripcion: servicio?.descripcion || "",
        duracion: servicio?.duracion || "",
        precio: servicio?.precio || "",
        estado: servicio?.estado || "Activo"

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

        <div className="servicio-form-container">

            <form
                className="servicio-form"
                onSubmit={handleSubmit}
            >

                <h2>

                    {servicio ? "Editar Servicio" : "Nuevo Servicio"}

                </h2>

                <p>

                    {servicio
                        ? "Modifique la información del servicio."
                        : "Complete la información para registrar un nuevo servicio."}

                </p>

                <div className="form-group">

                    <label>Nombre</label>

                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Corte Clásico"
                    />

                </div>

                <div className="form-group">

                    <label>Descripción</label>

                    <input
                        type="text"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción del servicio"
                    />

                </div>

                <div className="form-group">

                    <label>Duración (minutos)</label>

                    <input
                        type="number"
                        name="duracion"
                        value={formulario.duracion}
                        onChange={handleChange}
                        placeholder="45"
                    />

                </div>

                <div className="form-group">

                    <label>Precio</label>

                    <input
                        type="number"
                        name="precio"
                        value={formulario.precio}
                        onChange={handleChange}
                        placeholder="25000"
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
                        {servicio ? "Guardar cambios" : "Guardar"}
                    </button>

                </div>

            </form>

        </div>

    );

}