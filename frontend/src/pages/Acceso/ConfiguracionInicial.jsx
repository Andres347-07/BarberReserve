import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import "../Login/Login.css";
import "../../components/acceso/Acceso.css";

import PanelMarca from "./PanelMarca";
import CampoTexto from "../../components/acceso/CampoTexto";
import CodigoRecuperacion from "../../components/acceso/CodigoRecuperacion";
import authService from "../../services/authService";
import { useAuth } from "../../contexts/useAuth";
import useTituloPagina from "../../hooks/useTituloPagina";
import enfocarPrimerError from "../../utils/enfocarPrimerError";
import { AYUDA_PASSWORD, errorPassword } from "../../utils/password";

const EMAIL_VALIDO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Primer uso del sistema: el dueño de la barbería crea su propia cuenta
 * desde el navegador (antes había que hacerlo con Postman).
 */
export default function ConfiguracionInicial() {
    useTituloPagina("Configuración inicial");
    const { usuario, login } = useAuth();
    const navigate = useNavigate();

    const [estado, setEstado] = useState(null);
    const [errorCarga, setErrorCarga] = useState("");
    const [paso, setPaso] = useState(1);
    const [form, setForm] = useState({
        nombreNegocio: "", nombre: "", email: "", password: "", confirmar: "", codigoInstalacion: "",
    });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [guardado, setGuardado] = useState(false);
    const [errorGuardado, setErrorGuardado] = useState("");

    const refTitulo = useRef(null);
    const refForm = useRef(null);

    useEffect(() => {
        authService
            .estadoInstalacion()
            .then(setEstado)
            .catch(() => setErrorCarga("No se pudo conectar con el servidor. Intenta de nuevo en un momento."));
    }, []);

    useEffect(() => {
        if (paso === 2) refTitulo.current?.focus();
    }, [paso]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrores((er) => ({ ...er, [name]: "" }));
        setErrorGeneral("");
    };

    const validar = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = "Escribe tu nombre.";
        if (!form.email.trim()) e.email = "Escribe tu correo electrónico.";
        else if (!EMAIL_VALIDO.test(form.email.trim())) e.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
        const ep = errorPassword(form.password);
        if (ep) e.password = ep;
        if (form.confirmar !== form.password) e.confirmar = "Las contraseñas no coinciden.";
        if (estado?.requiereCodigo && !form.codigoInstalacion.trim()) e.codigoInstalacion = "Escribe el código de instalación.";
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const enviar = async (ev) => {
        ev.preventDefault();
        if (!validar()) {
            enfocarPrimerError(refForm.current);
            return;
        }
        setEnviando(true);
        try {
            const datos = await authService.configuracionInicial({
                nombreNegocio: form.nombreNegocio.trim(),
                nombre: form.nombre.trim(),
                email: form.email.trim(),
                password: form.password,
                codigoInstalacion: form.codigoInstalacion.trim(),
            });
            setResultado(datos);
            setPaso(2);
        } catch (error) {
            const mensaje = error.response?.data?.message || "No se pudo completar la configuración.";
            if (error.response?.status === 403 && estado?.requiereCodigo) {
                setErrores({ codigoInstalacion: mensaje });
                enfocarPrimerError(refForm.current);
            } else {
                setErrorGeneral(mensaje);
            }
        } finally {
            setEnviando(false);
        }
    };

    const entrar = async () => {
        if (!guardado) {
            setErrorGuardado("Confirma que guardaste el código antes de continuar.");
            document.getElementById("check-guardado")?.focus();
            return;
        }
        try {
            await login(form.email.trim(), form.password);
            navigate("/dashboard", { replace: true });
        } catch {
            navigate("/login", { replace: true });
        }
    };

    if (usuario && paso === 1) return <Navigate to="/panel" replace />;

    let contenido;
    if (errorCarga) {
        contenido = (
            <>
                <h1>Configuración inicial</h1>
                <p className="acceso-error-general" role="alert">{errorCarga}</p>
            </>
        );
    } else if (!estado) {
        contenido = <p role="status">Cargando…</p>;
    } else if (estado.instalado && paso === 1) {
        contenido = (
            <>
                <h1>Esta barbería ya está configurada</h1>
                <p className="acceso-intro">
                    El dueño del negocio ya creó su cuenta. Si trabajas aquí, pídele que te cree un usuario.
                </p>
                <Link to="/login" className="btn-primary">Ir a iniciar sesión</Link>
            </>
        );
    } else if (!estado.disponible) {
        contenido = (
            <>
                <h1>Configuración inicial no disponible</h1>
                <p className="acceso-intro">
                    Por seguridad, el servidor necesita un código de instalación para crear la cuenta del dueño.
                    Quien instaló el sistema debe definir la variable <code>CODIGO_INSTALACION</code>.
                </p>
            </>
        );
    } else if (paso === 1) {
        contenido = (
            <>
                <ol className="acceso-pasos" aria-label="Pasos de la configuración">
                    <li aria-current="step">1. Tus datos</li>
                    <li>2. Código de recuperación</li>
                </ol>
                <h1>Bienvenido a Barber Reserve</h1>
                <p className="acceso-intro">
                    Crea la cuenta del dueño de la barbería. Con ella podrás registrar a tus barberos y
                    administradores. Solo se hace una vez.
                </p>

                {errorGeneral && <p className="acceso-error-general" role="alert">{errorGeneral}</p>}

                <form ref={refForm} className="acceso-form" onSubmit={enviar} noValidate>
                    <fieldset>
                        <legend>Tu barbería</legend>
                        <CampoTexto
                            id="ci-negocio" etiqueta="Nombre de la barbería (opcional)" name="nombreNegocio"
                            maxLength={80} autoComplete="organization" value={form.nombreNegocio} onChange={cambiar}
                            ayuda="Aparece en el portal de reservas. Puedes cambiarlo después en Configuración."
                        />
                    </fieldset>

                    <fieldset>
                        <legend>Tu cuenta de dueño</legend>
                        <CampoTexto id="ci-nombre" etiqueta="Tu nombre" name="nombre" maxLength={80}
                            autoComplete="name" value={form.nombre} onChange={cambiar} error={errores.nombre} />
                        <CampoTexto id="ci-email" etiqueta="Correo electrónico" name="email" type="email"
                            autoComplete="username" value={form.email} onChange={cambiar} error={errores.email}
                            ayuda="Lo usarás para iniciar sesión." />
                        <CampoTexto id="ci-password" etiqueta="Contraseña" name="password" type="password"
                            autoComplete="new-password" value={form.password} onChange={cambiar}
                            error={errores.password} ayuda={AYUDA_PASSWORD} />
                        <CampoTexto id="ci-confirmar" etiqueta="Repite la contraseña" name="confirmar" type="password"
                            autoComplete="new-password" value={form.confirmar} onChange={cambiar} error={errores.confirmar} />
                    </fieldset>

                    {estado.requiereCodigo && (
                        <fieldset>
                            <legend>Seguridad</legend>
                            <CampoTexto id="ci-codigo" etiqueta="Código de instalación" name="codigoInstalacion"
                                autoComplete="off" spellCheck={false} value={form.codigoInstalacion} onChange={cambiar}
                                error={errores.codigoInstalacion}
                                ayuda="Te lo entrega la persona que instaló el sistema. Evita que un desconocido se adueñe de tu barbería." />
                        </fieldset>
                    )}

                    <div className="acceso-acciones">
                        <button type="submit" className="btn-primary" disabled={enviando}>
                            {enviando ? "Creando cuenta…" : "Crear cuenta de dueño"}
                        </button>
                    </div>
                </form>
            </>
        );
    } else {
        contenido = (
            <>
                <ol className="acceso-pasos" aria-label="Pasos de la configuración">
                    <li className="hecho">1. Tus datos</li>
                    <li aria-current="step">2. Código de recuperación</li>
                </ol>
                <h1 ref={refTitulo} tabIndex={-1}>Guarda tu código de recuperación</h1>
                <p className="acceso-intro">
                    Tu cuenta quedó creada. Si algún día olvidas la contraseña, este código te permite
                    recuperarla sin ayuda de nadie. <strong>Solo se muestra esta vez.</strong>
                </p>

                <CodigoRecuperacion
                    codigo={resultado.codigoRecuperacion}
                    email={resultado.usuario.email}
                    negocio={form.nombreNegocio.trim() || "Barber Reserve"}
                />

                <p className="acceso-aviso">
                    Guárdalo en un lugar seguro: una foto en tu celular, una nota en papel o el archivo descargado.
                    No lo compartas con tus empleados.
                </p>

                <div className="acceso-form">
                    <label className="acceso-check" htmlFor="check-guardado">
                        <input
                            id="check-guardado" type="checkbox" checked={guardado}
                            aria-invalid={errorGuardado ? "true" : undefined}
                            aria-describedby={errorGuardado ? "check-guardado-error" : undefined}
                            onChange={(e) => { setGuardado(e.target.checked); setErrorGuardado(""); }}
                        />
                        Ya guardé mi código de recuperación
                    </label>
                    {errorGuardado && <p className="error-text" id="check-guardado-error">{errorGuardado}</p>}
                </div>

                <div className="acceso-acciones">
                    <button type="button" className="btn-primary" onClick={entrar}>Entrar al panel</button>
                </div>
            </>
        );
    }

    return (
        <div className="login">
            <PanelMarca />
            <main className="login-right">
                <Link to="/" className="login-volver">
                    <FaArrowLeft aria-hidden="true" /> Volver al portal de reservas
                </Link>
                <div className="acceso-card">{contenido}</div>
            </main>
        </div>
    );
}
