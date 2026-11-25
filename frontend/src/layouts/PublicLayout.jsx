import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaUserLock, FaThLarge } from "react-icons/fa";

import logo from "../assets/logo/logo-small.png";
import Footer from "../components/layout/Footer";
import { useAuth } from "../contexts/useAuth";
import useTituloPagina from "../hooks/useTituloPagina";
import PreferenciasBoton from "../components/preferencias/PreferenciasBoton";

import "../pages/Portal/Portal.css";

/**
 * Interfaz independiente para clientes: no requiere iniciar sesión y
 * comparte la identidad visual del panel administrativo.
 */
export default function PublicLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario } = useAuth();
  const { pathname } = useLocation();

  useTituloPagina();

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <div className="portal">
      <a href="#contenido-portal" className="skip-link">Saltar al contenido principal</a>

      <header className="portal-header">
        <div className="portal-contenedor portal-header-fila">
          <Link to="/" className="portal-marca">
            <img src={logo} alt="" width="40" height="40" />
            <span>Barber<span>Reserve</span><span className="sr-only">, ir al inicio</span></span>
          </Link>

          <button
            type="button"
            className="portal-menu-btn"
            aria-expanded={menuAbierto}
            aria-controls="portal-nav"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            {menuAbierto ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>

          <nav id="portal-nav" aria-label="Navegación del portal" className={`portal-nav ${menuAbierto ? "abierto" : ""}`}>
            <ul>
              <li><NavLink to="/" end>Inicio</NavLink></li>
              <li><NavLink to="/reservar">Reservar cita</NavLink></li>
              <li><NavLink to="/mi-reserva">Mi reserva</NavLink></li>
              <li><PreferenciasBoton variante="portal" /></li>
              <li>
                {usuario ? (
                  <Link to={usuario.rol === "admin" ? "/dashboard" : "/agenda"} className="portal-nav-personal">
                    <FaThLarge aria-hidden="true" /> Ir al panel
                  </Link>
                ) : (
                  <Link to="/login" className="portal-nav-personal">
                    <FaUserLock aria-hidden="true" /> Acceso personal
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenido-portal" tabIndex={-1} className="portal-main">
        <Outlet />
      </main>

      <Footer variante="portal" />
    </div>
  );
}
