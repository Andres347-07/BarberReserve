import { NavLink } from "react-router-dom";

import {
    FaHome,
    FaUsers,
    FaUserTie,
    FaCut,
    FaClock,
    FaCalendarAlt,
    FaClipboardList,
    FaUserCog,
    FaSignOutAlt,
    FaTimes,
    FaGlobe,
    FaSlidersH,
} from "react-icons/fa";

import { useAuth } from "../../contexts/useAuth";
import logo from "../../assets/logo/logo-small.png";

import "./Sidebar.css";

const menuAdmin = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome aria-hidden="true" /> },
    { name: "Clientes", path: "/clientes", icon: <FaUsers aria-hidden="true" /> },
    { name: "Barberos", path: "/barberos", icon: <FaUserTie aria-hidden="true" /> },
    { name: "Servicios", path: "/servicios", icon: <FaCut aria-hidden="true" /> },
    { name: "Horarios", path: "/horarios", icon: <FaClock aria-hidden="true" /> },
    { name: "Reservas", path: "/reservas", icon: <FaCalendarAlt aria-hidden="true" /> },
    { name: "Agenda", path: "/agenda", icon: <FaClipboardList aria-hidden="true" /> },
    { name: "Gestión de Usuarios", path: "/usuarios", icon: <FaUserCog aria-hidden="true" /> },
    { name: "Configuración", path: "/configuracion", icon: <FaSlidersH aria-hidden="true" /> },
];

const menuBarbero = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome aria-hidden="true" /> },
    { name: "Mi agenda", path: "/agenda", icon: <FaClipboardList aria-hidden="true" /> },
];

export default function Sidebar({ abierto = false, onCerrar }) {

    const { usuario, logout } = useAuth();

    const menu = usuario?.rol === "admin" ? menuAdmin : menuBarbero;

    return (

        <aside id="menu-principal" className={`sidebar ${abierto ? "sidebar-abierto" : ""}`}>

            <div className="sidebar-brand">
                <img src={logo} alt="" className="sidebar-logo" width="36" height="36" />
                <p className="sidebar-title">
                    Barber<span>Reserve</span>
                </p>
                <button
                    type="button"
                    className="sidebar-cerrar"
                    onClick={onCerrar}
                    aria-label="Cerrar menú"
                >
                    <FaTimes aria-hidden="true" />
                </button>
            </div>

            <nav aria-label="Menú principal" className="sidebar-nav">
                <ul>
                    {menu.map((item) => (
                        <li key={item.path}>
                            {/* NavLink añade aria-current="page" al enlace activo */}
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <a className="sidebar-link sidebar-link-sutil" href="/" target="_blank" rel="noreferrer">
                    <FaGlobe aria-hidden="true" />
                    <span>Ver portal de clientes<span className="sr-only"> (se abre en una pestaña nueva)</span></span>
                </a>

                <button type="button" className="sidebar-link sidebar-logout" onClick={logout}>
                    <FaSignOutAlt aria-hidden="true" />
                    <span>Cerrar sesión</span>
                </button>
            </div>

        </aside>

    );

}
