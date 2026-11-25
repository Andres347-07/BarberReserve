import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
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
import Configuracion from "../pages/Configuracion";
import Inicio from "../pages/Portal/Inicio";
import Reservar from "../pages/Portal/Reservar";
import MiReserva from "../pages/Portal/MiReserva";
import Accesibilidad from "../pages/Portal/Accesibilidad";

function InicioSegunRol() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.rol === "admin" ? "/dashboard" : "/agenda"} replace />;
}

function NoAutorizado() {
  return (
    <div style={{ padding: 40 }}>
      <h1>No autorizado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="portal-contenedor portal-pagina">
      <h1 className="reservar-titulo">Página no encontrada</h1>
      <p className="page-subtitle" style={{ margin: "8px 0 20px" }}>La dirección que buscas no existe o cambió.</p>
      <Link to="/" className="btn-primary">Volver al inicio</Link>
    </div>
  );
}

export default function AppRouter() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Portal público de clientes (sin iniciar sesión) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/mi-reserva" element={<MiReserva />} />
          <Route path="/accesibilidad" element={<Accesibilidad />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>

        {/* Entrada al panel: redirige según el rol (antes estaba en "/") */}
        <Route path="/panel" element={<InicioSegunRol />} />

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
          <Route
            path="/configuracion"
            element={
              <PrivateRoute roles={["admin"]}>
                <Configuracion />
              </PrivateRoute>
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );

}
