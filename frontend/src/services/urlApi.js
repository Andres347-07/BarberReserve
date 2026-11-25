/**
 * URL base del backend.
 *
 * VITE_API_URL puede venir como URL completa ("https://api.ejemplo.com/api")
 * o solo como dominio ("barberreserve-api.onrender.com"), que es lo que Render
 * entrega cuando el valor se toma de otro servicio. En ese caso se completa
 * con https:// y /api. También acepta una ruta relativa ("/api") cuando
 * frontend y API están en el mismo dominio.
 */
export function urlApi(valor = import.meta.env.VITE_API_URL) {
    if (!valor) return "http://localhost:4000/api";
    let url = valor.trim().replace(/\/+$/, "");
    // Mismo dominio (por ejemplo "/api" detrás de un proxy): se usa tal cual
    if (url.startsWith("/")) return url;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!/\/api$/i.test(url)) url = `${url}/api`;
    return url;
}

/**
 * Aviso de "servidor despertando".
 * En el plan gratuito de Render el backend se apaga tras 15 minutos sin uso y
 * la primera petición puede tardar hasta un minuto. Si una petición tarda más
 * de ESPERA_MS se emite un evento para que la interfaz lo explique.
 */
const ESPERA_MS = 4000;
let pendientes = 0;
let temporizador = null;

function emitir(lento) {
    window.dispatchEvent(new CustomEvent("barberreserve:servidor-lento", { detail: { lento } }));
}

function terminar() {
    pendientes = Math.max(0, pendientes - 1);
    if (pendientes === 0) {
        clearTimeout(temporizador);
        temporizador = null;
        emitir(false);
    }
}

export function vigilarLentitud(cliente) {
    cliente.interceptors.request.use((config) => {
        pendientes += 1;
        if (!temporizador) temporizador = setTimeout(() => emitir(true), ESPERA_MS);
        return config;
    });
    cliente.interceptors.response.use(
        (respuesta) => {
            terminar();
            return respuesta;
        },
        (error) => {
            terminar();
            return Promise.reject(error);
        }
    );
}
