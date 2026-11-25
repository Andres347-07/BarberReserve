import { useState } from "react";
import { FaCopy, FaDownload, FaPrint } from "react-icons/fa";

import "./Acceso.css";

/**
 * Muestra un código de recuperación una sola vez, con opciones para
 * copiarlo, descargarlo como archivo de texto o imprimirlo.
 */
export default function CodigoRecuperacion({ codigo, email, negocio = "Barber Reserve" }) {
    const [estado, setEstado] = useState("");

    const texto =
        `${negocio} — Código de recuperación del dueño\n\n` +
        `Cuenta: ${email || ""}\n` +
        `Código: ${codigo}\n\n` +
        "Sirve para recuperar el acceso si olvidas tu contraseña.\n" +
        "Guárdalo en un lugar seguro y no lo compartas. Se usa una sola vez:\n" +
        "al usarlo, el sistema te entregará uno nuevo.\n";

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(codigo);
            setEstado("Código copiado al portapapeles.");
        } catch {
            setEstado("No se pudo copiar automáticamente. Selecciona el código y cópialo.");
        }
    };

    const descargar = () => {
        const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "codigo-recuperacion-barberreserve.txt";
        enlace.click();
        URL.revokeObjectURL(url);
        setEstado("Archivo descargado.");
    };

    return (
        <div className="codigo-recuperacion">
            <p className="codigo-recuperacion__etiqueta" id="etiqueta-codigo">Tu código de recuperación</p>
            <p className="codigo-recuperacion__valor" aria-labelledby="etiqueta-codigo" translate="no">
                {codigo}
            </p>
            <div className="codigo-recuperacion__acciones">
                <button type="button" className="btn-secondary" onClick={copiar}>
                    <FaCopy aria-hidden="true" /> Copiar
                </button>
                <button type="button" className="btn-secondary" onClick={descargar}>
                    <FaDownload aria-hidden="true" /> Descargar
                </button>
                <button type="button" className="btn-secondary" onClick={() => window.print()}>
                    <FaPrint aria-hidden="true" /> Imprimir
                </button>
            </div>
            <p className="codigo-recuperacion__estado" role="status">{estado}</p>
        </div>
    );
}
