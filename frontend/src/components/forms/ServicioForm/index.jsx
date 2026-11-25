import enfocarPrimerError from "../../../utils/enfocarPrimerError";
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

            enfocarPrimerError(e.currentTarget);

            return;

        }


        onSave(formulario);

    };





    return (

        <div className="servicio-form-container">


            <form
                className="servicio-form"
                onSubmit={handleSubmit}
                noValidate
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


                    <label htmlFor="campo-nombre">Nombre</label>


                    <input
                        id="campo-nombre"
                        aria-invalid={!!errores.nombre}
                        aria-describedby={errores.nombre ? "error-nombre" : undefined}
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Corte Clásico"
                    />


                    {errores.nombre && (
                        <span className="error-text" id="error-nombre">
                            {errores.nombre}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label htmlFor="campo-descripcion">Descripción</label>


                    <input
                        id="campo-descripcion"
                        aria-invalid={!!errores.descripcion}
                        aria-describedby={errores.descripcion ? "error-descripcion" : undefined}
                        type="text"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción del servicio"
                    />


                    {errores.descripcion && (
                        <span className="error-text" id="error-descripcion">
                            {errores.descripcion}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label htmlFor="campo-duracion">Duración (minutos)</label>


                    <input
                        id="campo-duracion"
                        aria-invalid={!!errores.duracion}
                        aria-describedby={errores.duracion ? "error-duracion" : undefined}
                        type="number"
                        name="duracion"
                        value={formulario.duracion}
                        onChange={handleChange}
                        placeholder="45"
                    />


                    {errores.duracion && (
                        <span className="error-text" id="error-duracion">
                            {errores.duracion}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label htmlFor="campo-precio">Precio</label>


                    <input
                        id="campo-precio"
                        aria-invalid={!!errores.precio}
                        aria-describedby={errores.precio ? "error-precio" : undefined}
                        type="number"
                        name="precio"
                        value={formulario.precio}
                        onChange={handleChange}
                        placeholder="25000"
                    />


                    {errores.precio && (
                        <span className="error-text" id="error-precio">
                            {errores.precio}
                        </span>

                    )}


                </div>






                <div className="form-group">


                    <label htmlFor="campo-estado">Estado</label>


                    <select
                        id="campo-estado"
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