import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "../contexts/useAuth";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Clientes from "../pages/Clientes";
import Barberos from "../pages/Barberos";
import Servicios from "../pages/Servicios";
import Horarios from "../pages/Horarios";
import Reservas from "../pages/Reservas";
import Agenda from "../pages/Agenda";
import Usuarios from "../pages/Usuarios";

function InicioSegunRol() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.rol === "admin" ? "/dashboard" : "/agenda"} replace />;
}

function NoAutorizado() {
  return (
    <div style={{ padding: 40 }}>
      <h2>No autorizado</h2>
      <p>No tienes permisos para acceder a esta sección.</p>
    </div>
  );
}

export default function AppRouter() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<InicioSegunRol />} />

        <Route path="/login" element={<Login />} />

        <Route
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >

          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* Accesibles para ambos roles (adaptan su contenido según el rol) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />

          {                                  
                                                    }
          <Route
            path="/reservas"
            element={
              <PrivateRoute roles={["admin"]}>
                <Reservas />
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <PrivateRoute roles={["admin"]}>
                <Clientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/barberos"
            element={
              <PrivateRoute roles={["admin"]}>
                <Barberos />
              </PrivateRoute>
            }
          />
          <Route
            path="/servicios"
            element={
              <PrivateRoute roles={["admin"]}>
                <Servicios />
              </PrivateRoute>
            }
          />
          <Route
            path="/horarios"
            element={
              <PrivateRoute roles={["admin"]}>
                <Horarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute roles={["admin"]}>
                <Usuarios />
              </PrivateRoute>
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );

}
