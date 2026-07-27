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



    const [errores, setErrores] = useState({});




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



        // Descripción

        if (!formulario.descripcion.trim()) {

            nuevosErrores.descripcion =
                "La descripción es obligatoria.";

        } else if (formulario.descripcion.trim().length < 5) {

            nuevosErrores.descripcion =
                "La descripción debe tener mínimo 5 caracteres.";

        }



        // Duración

        if (!formulario.duracion) {

            nuevosErrores.duracion =
                "La duración es obligatoria.";

        } else if (Number(formulario.duracion) <= 0) {

            nuevosErrores.duracion =
                "La duración debe ser mayor que cero.";

        }



        // Precio

        if (!formulario.precio) {

            nuevosErrores.precio =
                "El precio es obligatorio.";

        } else if (Number(formulario.precio) <= 0) {

            nuevosErrores.precio =
                "El precio debe ser un valor positivo.";

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


                    <label>
                        Nombre
                    </label>


                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Corte Clásico"
                    />


                    {errores.nombre && (

                        <span className="error-text">
                            {errores.nombre}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label>
                        Descripción
                    </label>


                    <input
                        type="text"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción del servicio"
                    />


                    {errores.descripcion && (

                        <span className="error-text">
                            {errores.descripcion}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label>
                        Duración (minutos)
                    </label>


                    <input
                        type="number"
                        name="duracion"
                        value={formulario.duracion}
                        onChange={handleChange}
                        placeholder="45"
                    />


                    {errores.duracion && (

                        <span className="error-text">
                            {errores.duracion}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label>
                        Precio
                    </label>


                    <input
                        type="number"
                        name="precio"
                        value={formulario.precio}
                        onChange={handleChange}
                        placeholder="25000"
                    />


                    {errores.precio && (

                        <span className="error-text">
                            {errores.precio}
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

                        {servicio ? "Guardar cambios" : "Guardar"}

                    </button>


                </div>



            </form>


        </div>

    );

}