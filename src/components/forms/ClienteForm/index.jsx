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