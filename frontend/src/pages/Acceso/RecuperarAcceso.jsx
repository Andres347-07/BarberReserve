import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import "../Login/Login.css";
import "../../components/acceso/Acceso.css";

import PanelMarca from "./PanelMarca";
import CampoTexto from "../../components/acceso/CampoTexto";
import CodigoRecuperacion from "../../components/acceso/CodigoRecuperacion";
import authService from "../../services/authService";
import useTituloPagina from "../../hooks/useTituloPagina";
import enfocarPrimerError from "../../utils/enfocarPrimerError";
import { AYUDA_PASSWORD, errorPassword } from "../../utils/password";

/**
 * "¿Olvidaste tu contraseña?"
 * - Barberos y administradores: el dueño se la restablece desde Usuarios.
 * - Dueño: usa su código de recuperación (no hace falta correo ni soporte).
 */
export default function RecuperarAcceso() {
    useTituloPagina("Recuperar acceso");

    const [form, setForm] = useState({ email: "", codigo: "", password: "", confirmar: "" });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [nuevoCodigo, setNuevoCodigo] = useState("");

    const refForm = useRef(null);
    const refTitulo = useRef(null);

    useEffect(() => {
        if (nuevoCodigo) refTitulo.current?.focus();
    }, [nuevoCodigo]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrores((er) => ({ ...er, [name]: "" }));
        setErrorGeneral("");
    };

    const enviar = async (ev) => {
        ev.preventDefault();
        const e = {};
        if (!form.email.trim()) e.email = "Escribe el correo de tu cuenta.";
        if (!form.codigo.trim()) e.codigo = "Escribe tu código de recuperación.";
        const ep = errorPassword(form.password, "La nueva contraseña");
        if (ep) e.password = ep;
        if (form.confirmar !== form.password) e.confirmar = "Las contraseñas no coinciden.";
        setErrores(e);
        if (Object.keys(e).length) {
            enfocarPrimerError(refForm.current);
            return;
        }

        setEnviando(true);
        try {
            const datos = await authService.recuperarAcceso({
                email: form.email.trim(),
                codigoRecuperacion: form.codigo,
                passwordNueva: form.password,
            });
            setNuevoCodigo(datos.codigoRecuperacion);
        } catch (error) {
            setErrorGeneral(error.response?.data?.message || "No se pudo recuperar el acceso.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="login">
            <PanelMarca />
            <main className="login-right">
                <Link to="/login" className="login-volver">
                    <FaArrowLeft aria-hidden="true" /> Volver a iniciar sesión
                </Link>

                <div className="acceso-card">
                    {nuevoCodigo ? (
                        <>
                            <h1 ref={refTitulo} tabIndex={-1}>Contraseña actualizada</h1>
                            <p className="acceso-intro">
                                Ya puedes iniciar sesión con tu nueva contraseña. El código que usaste dejó de
                                servir; este es tu <strong>nuevo código de recuperación</strong>. Guárdalo, solo se muestra esta vez.
                            </p>
                            <CodigoRecuperacion codigo={nuevoCodigo} email={form.email.trim()} />
                            <div className="acceso-acciones">
                                <Link to="/login" className="btn-primary">Iniciar sesión</Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1>¿Olvidaste tu contraseña?</h1>
                            <p className="acceso-intro">
                                <strong>Si eres barbero o administrador</strong>, pídele al dueño de la barbería que
                                restablezca tu contraseña desde el módulo Usuarios. Te dará una contraseña temporal.
                            </p>
                            <p className="acceso-intro">
                                <strong>Si eres el dueño</strong>, usa el código de recuperación que guardaste al
                                configurar el sistema.
                            </p>

                            {errorGeneral && <p className="acceso-error-general" role="alert">{errorGeneral}</p>}

                            <form ref={refForm} className="acceso-form" onSubmit={enviar} noValidate>
                                <CampoTexto id="ra-email" etiqueta="Correo del dueño" name="email" type="email"
                                    autoComplete="username" value={form.email} onChange={cambiar} error={errores.email} />
                                <CampoTexto id="ra-codigo" etiqueta="Código de recuperación" name="codigo"
                                    autoComplete="off" spellCheck={false} value={form.codigo} onChange={cambiar}
                                    error={errores.codigo} ayuda="Ejemplo: K7QM-3XWD-P9RT-H2NB. No importan los guiones ni las mayúsculas." />
                                <CampoTexto id="ra-password" etiqueta="Nueva contraseña" name="password" type="password"
                                    autoComplete="new-password" value={form.password} onChange={cambiar}
                                    error={errores.password} ayuda={AYUDA_PASSWORD} />
                                <CampoTexto id="ra-confirmar" etiqueta="Repite la nueva contraseña" name="confirmar" type="password"
                                    autoComplete="new-password" value={form.confirmar} onChange={cambiar} error={errores.confirmar} />
                                <div className="acceso-acciones">
                                    <button type="submit" className="btn-primary" disabled={enviando}>
                                        {enviando ? "Verificando…" : "Cambiar contraseña"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
