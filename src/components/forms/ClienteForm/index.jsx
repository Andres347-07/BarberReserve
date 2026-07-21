import { useState } from "react";

import "./ClienteForm.css";

export default function ClienteForm({
    onCancel,
    onSave,
    cliente = null
}) {

    const [formulario, setFormulario] = useState({
        nombre: cliente?.nombre || "",
        telefono: cliente?.telefono || "",
        correo: cliente?.correo || ""
    });

    const [errores, setErrores] = useState({});

    const validarFormulario = () => {

        const nuevosErrores = {};

        // Nombre
        if (!formulario.nombre.trim()) {

            nuevosErrores.nombre = "El nombre es obligatorio.";

        } else if (formulario.nombre.trim().length < 3) {

            nuevosErrores.nombre = "El nombre debe tener mínimo 3 caracteres.";

        }

        // Teléfono
        if (!formulario.telefono.trim()) {

            nuevosErrores.telefono = "El teléfono es obligatorio.";

        } else if (!/^[0-9]{10}$/.test(formulario.telefono)) {

            nuevosErrores.telefono = "Debe contener exactamente 10 dígitos.";

        }

        // Correo
        if (!formulario.correo.trim()) {

            nuevosErrores.correo = "El correo es obligatorio.";

        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formulario.correo)
        ) {

            nuevosErrores.correo = "Ingrese un correo válido.";

        }

        setErrores(nuevosErrores);

        return Object.keys(nuevosErrores).length === 0;

    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormulario((prev) => ({
            ...prev,
            [name]: value
        }));

        setErrores((prev) => ({
            ...prev,
            [name]: ""
        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        if (!validarFormulario()) {

            return;

        }

        onSave(formulario);

    };

    return (

        <div className="cliente-form-container">

            <form
                className="cliente-form"
                onSubmit={handleSubmit}
            >

                <h2>
                    {cliente ? "Editar Cliente" : "Nuevo Cliente"}
                </h2>

                <p>
                    {cliente
                        ? "Modifique la información del cliente."
                        : "Complete la información para registrar un nuevo cliente."}
                </p>

                <div className="form-group">

                    <label>
                        Nombre completo
                    </label>

                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre completo"
                    />

                    {errores.nombre && (
                        <span className="error-text">
                            {errores.nombre}
                        </span>
                    )}

                </div>

                <div className="form-group">

                    <label>
                        Teléfono
                    </label>

                    <input
                        type="text"
                        name="telefono"
                        value={formulario.telefono}
                        onChange={handleChange}
                        placeholder="Ingrese el número telefónico"
                    />

                    {errores.telefono && (
                        <span className="error-text">
                            {errores.telefono}
                        </span>
                    )}

                </div>

                <div className="form-group">

                    <label>
                        Correo electrónico
                    </label>

                    <input
                        type="email"
                        name="correo"
                        value={formulario.correo}
                        onChange={handleChange}
                        placeholder="Ingrese el correo electrónico"
                    />

                    {errores.correo && (
                        <span className="error-text">
                            {errores.correo}
                        </span>
                    )}

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
                        {cliente ? "Guardar cambios" : "Guardar"}
                    </button>

                </div>

            </form>

        </div>

    );

}