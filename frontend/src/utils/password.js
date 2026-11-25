/**
 * Misma política de contraseñas que el servidor: 8 a 72 caracteres,
 * con letras y números. Devuelve el mensaje de error o "" si es válida.
 */
export const AYUDA_PASSWORD = "Mínimo 8 caracteres, con letras y números.";

export function errorPassword(password, etiqueta = "La contraseña") {
    if (!password) return `${etiqueta} es obligatoria.`;
    if (password.length < 8) return `${etiqueta} debe tener al menos 8 caracteres.`;
    if (password.length > 72) return `${etiqueta} no puede superar 72 caracteres.`;
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password) || !/\d/.test(password)) {
        return `${etiqueta} debe combinar letras y números.`;
    }
    return "";
}
