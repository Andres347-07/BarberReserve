import { useState } from "react";
import { FaKey } from "react-icons/fa";

import { useAuth } from "../../contexts/useAuth";
import CambiarPasswordForm from "../forms/CambiarPasswordForm";
import useToast from "../../hooks/useToast";
import Toast from "../Toast";

export default function Navbar() {
  const { usuario } = useAuth();
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();

  return (
    <header
      style={{
        height: 80,
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <h3>BarberReserve</h3>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

        <button
          onClick={() => setMostrarCambiarPassword(true)}
          title="Cambiar contraseña"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
          }}
        >
          <FaKey />
        </button>

        <div style={{ textAlign: "right" }}>
          <div>{usuario?.nombre}</div>
          <small style={{ color: "#6b7280", textTransform: "capitalize" }}>
            {usuario?.rol}
          </small>
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
