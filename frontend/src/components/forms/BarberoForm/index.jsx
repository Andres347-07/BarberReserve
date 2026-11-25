import enfocarPrimerError from "../../../utils/enfocarPrimerError";
import { useEffect, useState } from "react";
import servicioService from "../../../services/servicioService";

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
        estado: barbero?.estado || "Activo",
        // Servicios que realiza (vacío = todos).
        servicios: (barbero?.servicios || []).map((s) => s.id)

    });

    const [catalogo, setCatalogo] = useState([]);

    useEffect(() => {
        servicioService.obtenerServicios()
            .then((lista) => setCatalogo(lista.filter((s) => s.estado === "Activo")))
            .catch(() => setCatalogo([]));
    }, []);

    const alternarServicio = (id) => {
        setFormulario((prev) => ({
            ...prev,
            servicios: prev.servicios.includes(id)
                ? prev.servicios.filter((x) => x !== id)
                : [...prev.servicios, id],
        }));
    };


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

            enfocarPrimerError(e.currentTarget);

            return;

        }


        onSave(formulario);

    };




    return (

        <div className="barbero-form-container">


            <form
                className="barbero-form"
                onSubmit={handleSubmit}
                noValidate
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


                    <label htmlFor="campo-nombre">Nombre completo</label>


                    <input
                        id="campo-nombre"
                        aria-invalid={!!errores.nombre}
                        aria-describedby={errores.nombre ? "error-nombre" : undefined}
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre"
                    />


                    {errores.nombre && (
                        <span className="error-text" id="error-nombre">
                            {errores.nombre}
                        </span>

                    )}


                </div>





                <div className="form-group">


                    <label htmlFor="campo-especialidad">Especialidad</label>


                    <input
                        id="campo-especialidad"
                        aria-invalid={!!errores.especialidad}
                        aria-describedby={errores.especialidad ? "error-especialidad" : undefined}
                        type="text"
                        name="especialidad"
                        value={formulario.especialidad}
                        onChange={handleChange}
                        placeholder="Ej: Fade y Barba"
                    />


                    {errores.especialidad && (
                        <span className="error-text" id="error-especialidad">
                            {errores.especialidad}
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
                        placeholder="Ingrese el teléfono"
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
                        placeholder="Ingrese el correo"
                    />


                    {errores.correo && (
                        <span className="error-text" id="error-correo">
                            {errores.correo}
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





                <fieldset className="servicios-fieldset">
                    <legend>Servicios que realiza</legend>
                    <p className="campo-ayuda" id="ayuda-servicios">
                        Si no marca ninguno, el barbero aparecerá disponible para todos los servicios.
                    </p>
                    {catalogo.length === 0 && <p className="campo-ayuda">No hay servicios activos.</p>}
                    <div className="servicios-opciones">
                        {catalogo.map((s) => (
                            <label key={s.id} className="servicio-check">
                                <input
                                    type="checkbox"
                                    checked={formulario.servicios.includes(s.id)}
                                    onChange={() => alternarServicio(s.id)}
                                    aria-describedby="ayuda-servicios"
                                />
                                <span>{s.nombre}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

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