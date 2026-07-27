import { createContext, useEffect, useState } from "react";

import api from "../services/api";
import authService from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCargando(false);
      return;
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    authService
      .obtenerPerfil()
      .then((perfil) => setUsuario(perfil))
      .catch(() => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common.Authorization;
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (email, password) => {
    const { token, usuario } = await authService.login(email, password);

    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUsuario(usuario);

    return usuario;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
    setUsuario(null);
  };

  
  const actualizarUsuarioLocal = (cambios) => {
    setUsuario((prev) => (prev ? { ...prev, ...cambios } : prev));
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, actualizarUsuarioLocal }}>
      {children}
    </AuthContext.Provider>
  );
}
