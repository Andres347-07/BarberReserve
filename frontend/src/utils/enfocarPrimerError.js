/**
 * Tras una validación fallida, lleva el foco al primer campo inválido del
 * formulario para que el usuario de teclado o lector de pantalla escuche
 * el error asociado (WCAG 3.3.1). Se ejecuta después del re-render.
 */
export default function enfocarPrimerError(formulario) {
    if (!formulario) return;
    setTimeout(() => {
        formulario.querySelector('[aria-invalid="true"]')?.focus();
    }, 0);
}
