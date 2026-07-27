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


    const [errores, setErrores] = useState({});



    // ===============================
    // Validaciones
    // ===============================
    const validarFormulario = () => {

        const nuevosErrores = {};


        // Nombre

        if (!formulario.nombre.trim()) {

            nuevosErrores.nombre =
                "El nombre es obligatorio.";

        } else if (formulario.nombre.trim().length < 3) {

            nuevosErrores.nombre =
                "El nombre debe contener mínimo 3 caracteres.";

        }



        // Especialidad

        if (!formulario.especialidad.trim()) {

            nuevosErrores.especialidad =
                "La especialidad es obligatoria.";

        } else if (formulario.especialidad.trim().length < 3) {

            nuevosErrores.especialidad =
                "La especialidad debe contener mínimo 3 caracteres.";

        }



        // Teléfono

        if (!formulario.telefono.trim()) {

            nuevosErrores.telefono =
                "El teléfono es obligatorio.";

        } else if (!/^[0-9]{10}$/.test(formulario.telefono)) {

            nuevosErrores.telefono =
                "El teléfono debe contener exactamente 10 dígitos.";

        }



        // Correo

        if (!formulario.correo.trim()) {

            nuevosErrores.correo =
                "El correo electrónico es obligatorio.";

        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                formulario.correo
            )
        ) {

            nuevosErrores.correo =
                "Ingrese un correo electrónico válido.";

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


                    <label>
                        Nombre completo
                    </label>


                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre"
                    />


                    {errores.nombre && (

                        <span className="error-text">
                            {errores.nombre}
                        </span>

                    )}


                </div>





                <div className="form-group">


                    <label>
                        Especialidad
                    </label>


                    <input
                        type="text"
                        name="especialidad"
                        value={formulario.especialidad}
                        onChange={handleChange}
                        placeholder="Ej: Fade y Barba"
                    />


                    {errores.especialidad && (

                        <span className="error-text">
                            {errores.especialidad}
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
                        placeholder="Ingrese el teléfono"
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
                        placeholder="Ingrese el correo"
                    />


                    {errores.correo && (

                        <span className="error-text">
                            {errores.correo}
                        </span>

                    )}


                </div>





                <div className="form-group">


                    <label>
                        Estado
                    </label>


                    <select
                        name="estado"
                        value={formulario.estado}
                        onChange={handleChange}
                    >

                        <option value="Activo">
                            Activo
                        </option>

                        <option value="Inactivo">
                            Inactivo
                        </option>


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