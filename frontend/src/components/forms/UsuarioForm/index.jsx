import enfocarPrimerError from "../../../utils/enfocarPrimerError";
import { useEffect, useState } from "react";

import "./UsuarioForm.css";

import barberoService from "../../../services/barberoService";

export default function UsuarioForm({
    usuario = null,
    onCancel,
    onSave,
}) {

    const esEdicion = !!usuario;

    const [barberosSinUsuario, setBarberosSinUsuario] = useState([]);
    const [errores, setErrores] = useState({});

    const [formulario, setFormulario] = useState({
        nombre: usuario?.nombre || "",
        email: usuario?.email || "",
        password: "",
        confirmarPassword: "",
        rol: usuario?.rol || "admin",
        barberoId: usuario?.barberoId || "",
        activo: usuario?.activo ?? true,
    });

    useEffect(() => {
        if (esEdicion) return;

        barberoService
            .obtenerBarberos()
            .then((barberos) => setBarberosSinUsuario(barberos.filter((b) => b.estado === "Activo")))
            .catch(() => {});
    }, [esEdicion]);

    const validar = () => {
        const nuevosErrores = {};

        if (!formulario.nombre.trim()) {
            nuevosErrores.nombre = "El nombre es obligatorio.";
        }

        if (!formulario.email.trim()) {
            nuevosErrores.email = "El correo electrónico es obligatorio.";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formulario.email)) {
            nuevosErrores.email = "Ingrese un correo electrónico válido.";
        }

        if (!esEdicion) {
            if (!formulario.password) {
                nuevosErrores.password = "La contraseña es obligatoria.";
            } else if (formulario.password.length < 6) {
                nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres.";
            }

            if (formulario.confirmarPassword !== formulario.password) {
                nuevosErrores.confirmarPassword = "Las contraseñas no coinciden.";
            }

            if (!formulario.rol) {
                nuevosErrores.rol = "El rol es obligatorio.";
            }

            if (formulario.rol === "barbero" && !formulario.barberoId) {
                nuevosErrores.barberoId = "Debe indicar a qué barbero pertenece esta cuenta.";
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario((prev) => ({ ...prev, [name]: value }));
        setErrores((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validar()) {
            enfocarPrimerError(e.currentTarget);
            return;
        }

        if (esEdicion) {
            onSave({ nombre: formulario.nombre, email: formulario.email, activo: formulario.activo === "true" || formulario.activo === true });
        } else {
            onSave({
                nombre: formulario.nombre,
                email: formulario.email,
                password: formulario.password,
                rol: formulario.rol,
                barberoId: formulario.rol === "barbero" ? formulario.barberoId : undefined,
            });
        }
    };

    return (
        <div className="usuario-form-container">
            <form className="usuario-form" onSubmit={handleSubmit} noValidate>

                <h2>{esEdicion ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                <p>
                    {esEdicion
                        ? "Modifique la información de la cuenta."
                        : "Complete la información para crear una nueva cuenta de acceso."}
                </p>

                <div className="form-group">
                    <label htmlFor="campo-nombre">Nombre completo</label>
                    <input
                        id="campo-nombre"
                        aria-invalid={!!errores.nombre}
                        aria-describedby={errores.nombre ? "error-nombre" : undefined} type="text" name="nombre" value={formulario.nombre} onChange={handleChange} />
                    {errores.nombre && <span className="error-text" id="error-nombre">{errores.nombre}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="campo-email">Correo electrónico</label>
                    <input
                        id="campo-email"
                        aria-invalid={!!errores.email}
                        aria-describedby={errores.email ? "error-email" : undefined} type="email" name="email" value={formulario.email} onChange={handleChange} />
                    {errores.email && <span className="error-text" id="error-email">{errores.email}</span>}
                </div>

                {!esEdicion && (
                    <>
                        <div className="form-group">
                            <label htmlFor="campo-password">Contraseña</label>
                            <input
                        id="campo-password"
                        aria-invalid={!!errores.password}
                        aria-describedby={errores.password ? "error-password" : undefined} type="password" name="password" value={formulario.password} onChange={handleChange} />
                            {errores.password && <span className="error-text" id="error-password">{errores.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="campo-confirmarPassword">Confirmar contraseña</label>
                            <input
                        id="campo-confirmarPassword"
                        aria-invalid={!!errores.confirmarPassword}
                        aria-describedby={errores.confirmarPassword ? "error-confirmarPassword" : undefined} type="password" name="confirmarPassword" value={formulario.confirmarPassword} onChange={handleChange} />
                            {errores.confirmarPassword && <span className="error-text" id="error-confirmarPassword">{errores.confirmarPassword}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="campo-rol">Rol</label>
                            <select
                        id="campo-rol"
                        aria-invalid={!!errores.rol}
                        aria-describedby={errores.rol ? "error-rol" : undefined} name="rol" value={formulario.rol} onChange={handleChange}>
                                <option value="admin">Administrador</option>
                                <option value="barbero">Barbero</option>
                            </select>
                            {errores.rol && <span className="error-text" id="error-rol">{errores.rol}</span>}
                        </div>

                        {formulario.rol === "barbero" && (
                            <div className="form-group">
                                <label htmlFor="campo-barberoId">Barbero asociado</label>
                                <select
                        id="campo-barberoId"
                        aria-invalid={!!errores.barberoId}
                        aria-describedby={errores.barberoId ? "error-barberoId" : undefined} name="barberoId" value={formulario.barberoId} onChange={handleChange}>
                                    <option value="">Seleccione un barbero</option>
                                    {barberosSinUsuario.map((b) => (
                                        <option key={b.id} value={b.id}>{b.nombre}</option>
                                    ))}
                                </select>
                                {errores.barberoId && <span className="error-text" id="error-barberoId">{errores.barberoId}</span>}
                            </div>
                        )}
                    </>
                )}

                {esEdicion && (
                    <div className="form-group">
                        <label htmlFor="campo-activo">Estado</label>
                        <select
                        id="campo-activo" name="activo" value={formulario.activo} onChange={handleChange}>
                            <option value={true}>Activo</option>
                            <option value={false}>Inactivo</option>
                        </select>
                    </div>
                )}

                <div className="form-buttons">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                        {esEdicion ? "Guardar cambios" : "Guardar"}
                    </button>
                </div>

            </form>
        </div>
    );
}
