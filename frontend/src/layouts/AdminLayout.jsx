import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import useTituloPagina from "../hooks/useTituloPagina";

import "./AdminLayout.css";

export default function AdminLayout() {

    const [menuAbierto, setMenuAbierto] = useState(false);
    const location = useLocation();

    useTituloPagina();

    // Al navegar, el menú móvil se cierra.
    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);

    // Menú móvil: al abrir, el foco entra al menú; Escape lo cierra y
    // devuelve el foco al botón que lo abrió (WCAG 2.4.3).
    useEffect(() => {
        if (!menuAbierto) return undefined;
        if (window.matchMedia("(max-width: 900px)").matches) {
            setTimeout(() => document.querySelector("#menu-principal nav a")?.focus(), 50);
        }
        const alPresionar = (e) => {
            if (e.key === "Escape") {
                setMenuAbierto(false);
                document.querySelector(".navbar-menu-btn")?.focus();
            }
        };
        document.addEventListener("keydown", alPresionar);
        return () => document.removeEventListener("keydown", alPresionar);
    }, [menuAbierto]);

    return (

        <div className="admin-layout">

            <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>

            <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

            {menuAbierto && (
                <div className="admin-overlay" aria-hidden="true" onClick={() => setMenuAbierto(false)} />
            )}

            <div className="admin-content">

                <Navbar menuAbierto={menuAbierto} onAlternarMenu={() => setMenuAbierto((v) => !v)} />

                <main id="contenido-principal" className="admin-main" tabIndex={-1}>

                    <Outlet />

                </main>

                <Footer />

            </div>

        </div>

    );

}
