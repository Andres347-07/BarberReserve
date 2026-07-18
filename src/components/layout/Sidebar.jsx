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

import "./Sidebar.css";

const menu = [

    {
        name:"Dashboard",
        path:"/dashboard",
        icon:<FaHome />,
    },

    {
        name:"Clientes",
        path:"/clientes",
        icon:<FaUsers />,
    },

    {
        name:"Barberos",
        path:"/barberos",
        icon:<FaUserTie />,
    },

    {
        name:"Servicios",
        path:"/servicios",
        icon:<FaCut />,
    },

    {
        name:"Horarios",
        path:"/horarios",
        icon:<FaClock />,
    },

    {
        name:"Reservas",
        path:"/reservas",
        icon:<FaCalendarAlt />,
    },

    {
        name:"Agenda",
        path:"/agenda",
        icon:<FaClipboardList />,
    },

];

export default function Sidebar(){

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

        </aside>

    );

}