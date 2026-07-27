import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/useAuth";
import CambiarPasswordForm from "../components/forms/CambiarPasswordForm";


export default function PrivateRoute({ children, roles }) {
  const { usuario, cargando, actualizarUsuarioLocal } = useAuth();

  if (cargando) {
    return <div style={{ padding: 40 }}>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.debeCambiarPassword) {
    return (
      <CambiarPasswordForm
        obligatorio={true}
        onExito={() => actualizarUsuarioLocal({ debeCambiarPassword: false })}
      />
    );
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}
