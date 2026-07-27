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

} from "react-icons/fa";

import { useAuth } from "../../contexts/useAuth";

import "./Sidebar.css";

const menuAdmin = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Clientes", path: "/clientes", icon: <FaUsers /> },
    { name: "Barberos", path: "/barberos", icon: <FaUserTie /> },
    { name: "Servicios", path: "/servicios", icon: <FaCut /> },
    { name: "Horarios", path: "/horarios", icon: <FaClock /> },
    { name: "Reservas", path: "/reservas", icon: <FaCalendarAlt /> },
    { name: "Agenda", path: "/agenda", icon: <FaClipboardList /> },
    { name: "Gestión de Usuarios", path: "/usuarios", icon: <FaUserCog /> },
];

const menuBarbero = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Agenda", path: "/agenda", icon: <FaClipboardList /> },
];

export default function Sidebar(){

    const { usuario, logout } = useAuth();

    const menu = usuario?.rol === "admin" ? menuAdmin : menuBarbero;

    return(

        <aside className="sidebar">

            <h2 className="sidebar-title">

                BarberReserve

            </h2>

            {menu.map((item)=>(

                <NavLink

                    key={item.path}

                    to={item.path}

                    className={({isActive})=>

                        isActive
                        ? "sidebar-link active"
                        : "sidebar-link"

                    }

                >

                    {item.icon}

                    <span>{item.name}</span>

                </NavLink>

            ))}

            <button className="sidebar-link sidebar-logout" onClick={logout}>
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
            </button>

        </aside>

    );

}
