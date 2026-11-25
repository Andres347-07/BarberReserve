import { useState } from "react";
import { FaKey, FaBars, FaUserCircle } from "react-icons/fa";

import { useAuth } from "../../contexts/useAuth";
import CambiarPasswordForm from "../forms/CambiarPasswordForm";
import useToast from "../../hooks/useToast";
import Toast from "../Toast";
import Notificaciones from "./Notificaciones";
import PreferenciasBoton from "../preferencias/PreferenciasBoton";

import "./Navbar.css";

function fechaLegible() {
  return new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

export default function Navbar({ menuAbierto = false, onAlternarMenu }) {
  const { usuario } = useAuth();
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();

  return (
    <header className="navbar">
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <div className="navbar-izquierda">
        <button
          type="button"
          className="navbar-menu-btn"
          onClick={onAlternarMenu}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
        >
          <FaBars aria-hidden="true" />
        </button>

        <p className="navbar-fecha">{fechaLegible()}</p>
      </div>

      <div className="navbar-derecha">

        <PreferenciasBoton />

        <Notificaciones />

        <button
          type="button"
          className="navbar-icon-btn"
          onClick={() => setMostrarCambiarPassword(true)}
          aria-label="Cambiar contraseña"
          title="Cambiar contraseña"
        >
          <FaKey aria-hidden="true" />
        </button>

        <div className="navbar-usuario">
          <FaUserCircle aria-hidden="true" className="navbar-avatar" />
          <div>
            <p className="navbar-nombre">{usuario?.nombre}</p>
            <p className="navbar-rol">
              <span className="sr-only">Rol: </span>
              {usuario?.esPropietario ? "Dueño" : usuario?.rol === "admin" ? "Administrador" : "Barbero"}
            </p>
          </div>
        </div>

      </div>

      {mostrarCambiarPassword && (
        <CambiarPasswordForm
          obligatorio={false}
          onCancelar={() => setMostrarCambiarPassword(false)}
          onExito={() => {
            setMostrarCambiarPassword(false);
            mostrarToast("Contraseña actualizada correctamente.");
          }}
        />
      )}

    </header>
  );
}
