import { useState } from "react";

import authService from "../../services/authService";
import CodigoRecuperacion from "../../components/acceso/CodigoRecuperacion";
import "../../components/acceso/Acceso.css";

/**
 * Solo para el dueño: generar un código de recuperación nuevo (por ejemplo,
 * si perdió el anterior o cree que alguien lo vio). El anterior deja de servir.
 */
export default function SeguridadDueno({ email }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [codigo, setCodigo] = useState("");
    const [enviando, setEnviando] = useState(false);

    const generar = async (e) => {
        e.preventDefault();
        if (!password) {
            setError("Escribe tu contraseña para confirmar.");
            return;
        }
        setEnviando(true);
        try {
            const datos = await authService.regenerarCodigoRecuperacion(password);
            setCodigo(datos.codigoRecuperacion);
            setPassword("");
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo generar el código.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <section className="config-grupo config-seguridad" aria-labelledby="titulo-seguridad">
            <h2 id="titulo-seguridad">Seguridad de la cuenta del dueño</h2>
            <p className="page-subtitle">
                El código de recuperación te permite recuperar tu contraseña desde “¿Olvidaste tu contraseña?”.
                Genera uno nuevo si perdiste el anterior o crees que alguien lo vio: el anterior dejará de servir.
            </p>

            {codigo ? (
                <>
                    <CodigoRecuperacion codigo={codigo} email={email} />
                    <p className="acceso-aviso">Guárdalo ahora: no se volverá a mostrar.</p>
                    <button type="button" className="btn-secondary" onClick={() => setCodigo("")}>Listo, ya lo guardé</button>
                </>
            ) : (
                <form onSubmit={generar} noValidate className="acceso-form config-seguridad-form">
                    <div className="form-group">
                        <label htmlFor="seg-password">Tu contraseña</label>
                        <input
                            id="seg-password" type="password" autoComplete="current-password" value={password}
                            aria-invalid={error ? "true" : undefined}
                            aria-describedby={error ? "seg-password-error" : undefined}
                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        />
                        {error && <p className="error-text" id="seg-password-error" role="alert">{error}</p>}
                    </div>
                    <button type="submit" className="btn-primary" disabled={enviando}>
                        {enviando ? "Generando…" : "Generar nuevo código de recuperación"}
                    </button>
                </form>
            )}
        </section>
    );
}
