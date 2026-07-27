import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaUsers, FaChartLine } from "react-icons/fa";

import "./Login.css";

import barberImage from "../../assets/images/barber-login.png";
import logo from "../../assets/logo/logo.png";

import { useAuth } from "../../contexts/useAuth";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, mostrarToast, cerrarToast } = useToast();

  const [formulario, setFormulario] = useState({ email: "", password: "" });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.email || !formulario.password) {
      mostrarToast("Ingresa tu correo y tu contraseña.", "error");
      return;
    }

    setEnviando(true);

    try {
      const usuario = await login(formulario.email, formulario.password);
      navigate(usuario.rol === "admin" ? "/dashboard" : "/agenda", { replace: true });
    } catch (error) {
      mostrarToast(
        error.response?.data?.message || "No se pudo iniciar sesión.",
        "error"
      );
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

          <img src={logo} alt="Logo" className="logo" />

          <h1>
            Barber<span>Reserve</span>
          </h1>

          <div className="separator"></div>

          <p className="description">
            La forma más sencilla de organizar las reservas de tu barbería.
          </p>

          <div className="features">

            <div className="feature">
              <FaCalendarAlt />
              <span>Gestiona reservas fácilmente</span>
            </div>

            <div className="feature">
              <FaUsers />
              <span>Administra clientes y barberos</span>
            </div>

            <div className="feature">
              <FaChartLine />
              <span>Optimiza la organización de tu barbería</span>
            </div>

          </div>

        </div>
      </div>

      <div className="login-right">

        <form className="card" onSubmit={handleSubmit}>

          <img src={logo} alt="" className="card-logo"/>

          <h2>Bienvenido a BarberReserve</h2>

          <p>
            Inicia sesión para acceder a la plataforma
          </p>

          <label>Correo electrónico</label>

          <input
            type="email"
            name="email"
            placeholder="ejemplo@correo.com"
            value={formulario.email}
            onChange={handleChange}
            required
          />

          <label>Contraseña</label>

          <input
            type="password"
            name="password"
            placeholder="Ingresa tu contraseña"
            value={formulario.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={enviando}>
            {enviando ? "Ingresando..." : "Iniciar sesión"}
          </button>

        </form>

      </div>

    </div>
  );
}
