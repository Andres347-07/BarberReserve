import enfocarPrimerError from "../../../utils/enfocarPrimerError";
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

            nuevosErrores.nombre = "El nombre debe contener mínimo 3 caracteres.";

        }

        // Teléfono
        if (!formulario.telefono.trim()) {

            nuevosErrores.telefono = "El teléfono es obligatorio.";

        } else if (!/^[0-9]{10}$/.test(formulario.telefono)) {

            nuevosErrores.telefono = "El teléfono debe contener exactamente 10 dígitos.";

        }

        // Correo
        if (!formulario.correo.trim()) {

            nuevosErrores.correo = "El correo electrónico es obligatorio.";

        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formulario.correo)
        ) {

            nuevosErrores.correo = "Ingrese un correo electrónico válido.";

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

            enfocarPrimerError(e.currentTarget);

            return;

        }

        onSave(formulario);

    };

    return (

        <div className="cliente-form-container">

            <form
                className="cliente-form"
                onSubmit={handleSubmit}
                noValidate
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

                    <label htmlFor="campo-nombre">Nombre completo</label>

                    <input
                        id="campo-nombre"
                        aria-invalid={!!errores.nombre}
                        aria-describedby={errores.nombre ? "error-nombre" : undefined}
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre completo"
                    />

                    {errores.nombre && (
                        <span className="error-text" id="error-nombre">
                            {errores.nombre}
                        </span>
                    )}

                </div>

                <div className="form-group">

                    <label htmlFor="campo-telefono">Teléfono</label>

                    <input
                        id="campo-telefono"
                        aria-invalid={!!errores.telefono}
                        aria-describedby={errores.telefono ? "error-telefono" : undefined}
                        type="text"
                        name="telefono"
                        value={formulario.telefono}
                        onChange={handleChange}
                        placeholder="Ingrese el número telefónico"
                    />

                    {errores.telefono && (
                        <span className="error-text" id="error-telefono">
                            {errores.telefono}
                        </span>
                    )}

                </div>

                <div className="form-group">

                    <label htmlFor="campo-correo">Correo electrónico</label>

                    <input
                        id="campo-correo"
                        aria-invalid={!!errores.correo}
                        aria-describedby={errores.correo ? "error-correo" : undefined}
                        type="email"
                        name="correo"
                        value={formulario.correo}
                        onChange={handleChange}
                        placeholder="Ingrese el correo electrónico"
                    />

                    {errores.correo && (
                        <span className="error-text" id="error-correo">
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