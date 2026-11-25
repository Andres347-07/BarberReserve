import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaUsers, FaChartLine, FaArrowLeft } from "react-icons/fa";

import "./Login.css";

import barberImage from "../../assets/images/barber-login.png";
import logo from "../../assets/logo/logo-small.png";
import useTituloPagina from "../../hooks/useTituloPagina";

import { useAuth } from "../../contexts/useAuth";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, mostrarToast, cerrarToast } = useToast();

  const [formulario, setFormulario] = useState({ email: "", password: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useTituloPagina("Iniciar sesión");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.email || !formulario.password) {
      setError("Ingresa tu correo y tu contraseña.");
      e.currentTarget.querySelector(formulario.email ? "input[name=password]" : "input[name=email]")?.focus();
      return;
    }

    setEnviando(true);

    try {
      const usuario = await login(formulario.email, formulario.password);
      navigate(usuario.rol === "admin" ? "/dashboard" : "/agenda", { replace: true });
    } catch (error) {
      const mensaje = error.response?.data?.message || "No se pudo iniciar sesión.";
      setError(mensaje);
      mostrarToast(mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <div
        className="login-left"
        style={{ backgroundImage: `url(${barberImage})` }}
      >
        <div className="overlay">

          <img src={logo} alt="" className="logo" />

          <p className="login-marca">
            Barber<span>Reserve</span>
          </p>

          <div className="separator"></div>

          <p className="description">
            La forma más sencilla de organizar las reservas de tu barbería.
          </p>

          <div className="features">

            <div className="feature">
              <FaCalendarAlt aria-hidden="true" />
              <span>Gestiona reservas fácilmente</span>
            </div>

            <div className="feature">
              <FaUsers aria-hidden="true" />
              <span>Administra clientes y barberos</span>
            </div>

            <div className="feature">
              <FaChartLine aria-hidden="true" />
              <span>Optimiza la organización de tu barbería</span>
            </div>

          </div>

        </div>
      </div>

      <main className="login-right">

        <Link to="/" className="login-volver">
          <FaArrowLeft aria-hidden="true" /> Volver al portal de reservas
        </Link>

        <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="titulo-login">

          <img src={logo} alt="Barber Reserve" className="card-logo"/>

          <h1 id="titulo-login">Acceso del personal</h1>

          <p>
            Inicia sesión para acceder al panel de la barbería.
          </p>

          <div aria-live="assertive">
            {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
          </div>

          <label htmlFor="campo-email">Correo electrónico</label>

          <input
                        id="campo-email"
            type="email"
            name="email"
            autoComplete="username"
            aria-invalid={!!error && !formulario.email}
            aria-describedby={error ? "login-error" : undefined}
            placeholder="ejemplo@correo.com"
            value={formulario.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="campo-password">Contraseña</label>

          <input
                        id="campo-password"
            type="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={!!error && !formulario.password}
            aria-describedby={error ? "login-error" : undefined}
            placeholder="Ingresa tu contraseña"
            value={formulario.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={enviando}>
            {enviando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <p className="login-cliente">
            ¿Eres cliente? <Link to="/reservar">Reserva tu cita aquí</Link>
          </p>

        </form>

      </main>

    </div>
  );
}
