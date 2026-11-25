import { useEffect } from "react";

const ENFOCABLES = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Comportamiento accesible de una ventana modal (WCAG 2.1.2 / 2.4.3):
 *  - mueve el foco al primer elemento enfocable al abrir,
 *  - mantiene Tab / Shift+Tab dentro del diálogo,
 *  - Escape cierra (si se indica onCerrar),
 *  - devuelve el foco al elemento que abrió el diálogo al cerrarse.
 */
export default function useDialogo(ref, { activo, onCerrar, enfocarPrimero = true } = {}) {
    useEffect(() => {
        if (!activo || !ref.current) return undefined;

        const nodo = ref.current;
        const anterior = document.activeElement;

        const enfocables = () => Array.from(nodo.querySelectorAll(ENFOCABLES))
            .filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (enfocarPrimero) {
            const preferido = nodo.querySelector("[data-autofocus]") || enfocables()[0];
            (preferido || nodo).focus();
        }

        const alPresionar = (e) => {
            if (e.key === "Escape" && onCerrar) {
                e.stopPropagation();
                onCerrar();
                return;
            }

            if (e.key !== "Tab") return;

            const lista = enfocables();
            if (lista.length === 0) return;

            const primero = lista[0];
            const ultimo = lista[lista.length - 1];

            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        };

        nodo.addEventListener("keydown", alPresionar);

        return () => {
            nodo.removeEventListener("keydown", alPresionar);
            if (anterior && typeof anterior.focus === "function" && document.contains(anterior)) {
                anterior.focus();
            }
        };
        // onCerrar puede cambiar en cada render; solo importa al abrir.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activo]);
}
