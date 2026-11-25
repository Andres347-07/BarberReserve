import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITULOS = {
    "/dashboard": "Dashboard",
    "/clientes": "Clientes",
    "/barberos": "Barberos",
    "/servicios": "Servicios",
    "/horarios": "Horarios",
    "/reservas": "Reservas",
    "/agenda": "Agenda",
    "/usuarios": "Gestión de usuarios",
    "/configuracion": "Configuración",
    "/accesibilidad": "Declaración de accesibilidad",
    "/no-autorizado": "No autorizado",
    "/login": "Iniciar sesión",
    "/": "Inicio",
    "/reservar": "Reservar una cita",
    "/mi-reserva": "Consultar mi reserva",
};

/**
 * Título de pestaña único por página (WCAG 2.4.2). Los lectores de pantalla
 * lo anuncian al navegar dentro de la aplicación de una sola página.
 */
export default function useTituloPagina(tituloForzado) {
    const { pathname } = useLocation();

    useEffect(() => {
        const titulo = tituloForzado || TITULOS[pathname];
        document.title = titulo ? `${titulo} · Barber Reserve` : "Barber Reserve";
    }, [pathname, tituloForzado]);
}
