/**
 * Tras una validación fallida, lleva el foco al primer campo inválido del
 * formulario para que el usuario de teclado o lector de pantalla escuche
 * el error asociado (WCAG 3.3.1).
 *
 * Cuando el error llega del servidor (después de un await), React puede
 * pintar el campo marcado un poco más tarde; por eso se reintenta durante
 * unos 300 ms hasta encontrarlo.
 */
export default function enfocarPrimerError(formulario, intentos = 10) {
    if (!formulario) return;
    setTimeout(() => {
        const campo = formulario.querySelector('[aria-invalid="true"]');
        if (campo) campo.focus();
        else if (intentos > 1) enfocarPrimerError(formulario, intentos - 1);
    }, intentos === 10 ? 0 : 30);
}
