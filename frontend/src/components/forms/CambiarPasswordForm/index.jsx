import { useState } from "react";

import "./CambiarPasswordForm.css";

import authService from "../../../services/authService";

export default function CambiarPasswordForm({ obligatorio = false, onExito, onCancelar }) {

    const [formulario, setFormulario] = useState({
        passwordActual: "",
        passwordNueva: "",
        confirmarPassword: "",
    });

    const [error, setError] = useState("");
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
            <form className="cambiar-password-form" onSubmit={handleSubmit}>

                <h2>{obligatorio ? "Debe cambiar su contraseña" : "Cambiar contraseña"}</h2>

                <p>
                    {obligatorio
                        ? "Por seguridad, antes de continuar debe reemplazar la contraseña temporal por una propia."
                        : "Ingrese su contraseña actual y la nueva contraseña."}
                </p>

                <div className="form-group">
                    <label>Contraseña actual</label>
                    <input
                        type="password"
                        name="passwordActual"
                        value={formulario.passwordActual}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input
                        type="password"
                        name="passwordNueva"
                        value={formulario.passwordNueva}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Confirmar nueva contraseña</label>
                    <input
                        type="password"
                        name="confirmarPassword"
                        value={formulario.confirmarPassword}
                        onChange={handleChange}
                    />
                </div>

                {error && <span className="error-text">{error}</span>}

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
