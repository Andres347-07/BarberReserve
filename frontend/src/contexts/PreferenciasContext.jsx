import { createContext, useContext, useEffect, useState } from "react";

const CLAVE = "barberreserve.preferencias";

const PREFERENCIAS_INICIALES = {
    contraste: "estandar",      // "estandar" | "alto"
    tamano: 100,                // 100 | 115 | 130 | 150 (%)
    reducirMovimiento: false,
    subrayarEnlaces: false,
    espaciado: false,           // WCAG 1.4.12 (espaciado del texto)
};

function leer() {
    try {
        const guardadas = JSON.parse(window.localStorage.getItem(CLAVE) || "{}");
        return { ...PREFERENCIAS_INICIALES, ...guardadas };
    } catch {
        return { ...PREFERENCIAS_INICIALES };
    }
}

const PreferenciasContext = createContext(null);

/**
 * Personalización de la interfaz (B8). Se guarda en este navegador y se
 * aplica con atributos en <html>, que activan reglas de CSS globales.
 * Si el sistema operativo ya pide reducir el movimiento, se respeta aunque
 * la opción no esté marcada.
 */
export function PreferenciasProvider({ children }) {
    const [preferencias, setPreferencias] = useState(leer);

    useEffect(() => {
        const html = document.documentElement;
        html.dataset.contraste = preferencias.contraste;
        html.dataset.tamano = String(preferencias.tamano);
        html.classList.toggle("reducir-movimiento", preferencias.reducirMovimiento);
        html.classList.toggle("subrayar-enlaces", preferencias.subrayarEnlaces);
        html.classList.toggle("espaciado-amplio", preferencias.espaciado);
        try {
            window.localStorage.setItem(CLAVE, JSON.stringify(preferencias));
        } catch {
            // almacenamiento no disponible: la preferencia dura solo esta visita
        }
    }, [preferencias]);

    const cambiar = (campo, valor) => setPreferencias((p) => ({ ...p, [campo]: valor }));
    const restablecer = () => setPreferencias({ ...PREFERENCIAS_INICIALES });

    return (
        <PreferenciasContext.Provider value={{ preferencias, cambiar, restablecer }}>
            {children}
        </PreferenciasContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferencias() {
    return useContext(PreferenciasContext);
}
