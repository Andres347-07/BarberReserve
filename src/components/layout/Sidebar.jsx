import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaUserTie,
  FaCut,
  FaClock,
  FaCalendarAlt,
  FaClipboardList,
} from "react-icons/fa";

const menu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FaHome />,
  },
  {
    name: "Clientes",
    path: "/clientes",
    icon: <FaUsers />,
  },
  {
    name: "Barberos",
    path: "/barberos",
    icon: <FaUserTie />,
  },
  {
    name: "Servicios",
    path: "/servicios",
    icon: <FaCut />,
  },
  {
    name: "Horarios",
    path: "/horarios",
    icon: <FaClock />,
  },
  {
    name: "Reservas",
    path: "/reservas",
    icon: <FaCalendarAlt />,
  },
  {
    name: "Agenda",
    path: "/agenda",
    icon: <FaClipboardList />,
  },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        background: "#101827",
        color: "white",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 40 }}>BarberReserve</h2>

      {menu.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px",
            marginBottom: 10,
            textDecoration: "none",
            color: "white",
            borderRadius: 10,
            background: isActive ? "#2F66F5" : "transparent",
          })}
        >
          {item.icon}
          {item.name}
        </NavLink>
      ))}
    </aside>
  );
}