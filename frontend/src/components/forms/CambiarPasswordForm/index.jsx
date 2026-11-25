import { useRef, useState } from "react";
import useDialogo from "../../../hooks/useDialogo";

import "./CambiarPasswordForm.css";

import authService from "../../../services/authService";

export default function CambiarPasswordForm({ obligatorio = false, onExito, onCancelar }) {

    const [formulario, setFormulario] = useState({
        passwordActual: "",
        passwordNueva: "",
        confirmarPassword: "",
    });

    const [error, setError] = useState("");
    const refDialogo = useRef(null);

    // Como ventana modal: foco atrapado, Escape para cerrar y retorno del foco.
    useDialogo(refDialogo, { activo: true, onCerrar: obligatorio ? undefined : onCancelar });
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formulario.passwordActual || !formulario.passwordNueva) {
            setError("Complete todos los campos.");
            return;
        }

        if (formulario.passwordNueva.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (formulario.passwordNueva !== formulario.confirmarPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setEnviando(true);

        try {
            await authService.cambiarPassword({
                passwordActual: formulario.passwordActual,
                passwordNueva: formulario.passwordNueva,
            });

            onExito();
        } catch (err) {
            setError(err.response?.data?.message || "No fue posible cambiar la contraseña.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className={obligatorio ? "cambiar-password-pantalla" : "cambiar-password-overlay"}>
            <form
                ref={refDialogo}
                className="cambiar-password-form"
                onSubmit={handleSubmit}
                role="dialog"
                aria-modal={obligatorio ? undefined : "true"}
                aria-labelledby="titulo-cambiar-password"
                noValidate
            >

                <h2 id="titulo-cambiar-password">{obligatorio ? "Debe cambiar su contraseña" : "Cambiar contraseña"}</h2>

                <p>
                    {obligatorio
                        ? "Por seguridad, antes de continuar debe reemplazar la contraseña temporal por una propia."
                        : "Ingrese su contraseña actual y la nueva contraseña."}
                </p>

                <div className="form-group">
                    <label htmlFor="campo-passwordActual">Contraseña actual</label>
                    <input
                        id="campo-passwordActual"
                        type="password"
                        name="passwordActual"
                        autoComplete="current-password"
                        aria-describedby={error ? "error-password" : undefined}
                        value={formulario.passwordActual}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="campo-passwordNueva">Nueva contraseña</label>
                    <input
                        id="campo-passwordNueva"
                        type="password"
                        name="passwordNueva"
                        autoComplete="new-password"
                        aria-describedby={error ? "error-password" : undefined}
                        value={formulario.passwordNueva}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="campo-confirmarPassword">Confirmar nueva contraseña</label>
                    <input
                        id="campo-confirmarPassword"
                        type="password"
                        name="confirmarPassword"
                        autoComplete="new-password"
                        aria-describedby={error ? "error-password" : undefined}
                        value={formulario.confirmarPassword}
                        onChange={handleChange}
                    />
                </div>

                <div aria-live="assertive">
                    {error && <span className="error-text" id="error-password" role="alert">{error}</span>}
                </div>

                <div className="form-buttons">
                    {!obligatorio && (
                        <button type="button" className="btn-secondary" onClick={onCancelar}>
                            Cancelar
                        </button>
                    )}

                    <button type="submit" className="btn-primary" disabled={enviando}>
                        {enviando ? "Guardando..." : "Guardar"}
                    </button>
                </div>

            </form>
        </div>
    );
}
