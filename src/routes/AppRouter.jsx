import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Clientes from "../pages/Clientes";
import Barberos from "../pages/Barberos";
import Servicios from "../pages/Servicios";
import Horarios from "../pages/Horarios";
import Reservas from "../pages/Reservas";
import Agenda from "../pages/Agenda";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/barberos" element={<Barberos />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/agenda" element={<Agenda />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}