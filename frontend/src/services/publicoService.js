import axios from "axios";
import { urlApi, vigilarLentitud } from "./urlApi";

/**
 * Cliente HTTP del portal público. Es independiente de `api.js`: no envía el
 * token del panel ni redirige al login, porque estas rutas no requieren
 * iniciar sesión.
 */
const apiPublica = axios.create({
    baseURL: urlApi(),
    headers: { "Content-Type": "application/json" },
});

vigilarLentitud(apiPublica);

const publicoService = {
    async obtenerConfiguracion() {
        const { data } = await apiPublica.get("/publico/configuracion");
        return data.data;
    },

    async obtenerServicios() {
        const { data } = await apiPublica.get("/publico/servicios");
        return data.data;
    },

    async obtenerBarberos() {
        const { data } = await apiPublica.get("/publico/barberos");
        return data.data;
    },

    async obtenerDiasDisponibles({ barberoId, servicioId, desde, hasta }) {
        const { data } = await apiPublica.get("/publico/dias-disponibles", {
            params: { barberoId, servicioId, desde, hasta },
        });
        return data.data;
    },

    async obtenerHorasDisponibles({ barberoId, servicioId, fecha }) {
        const { data } = await apiPublica.get("/publico/horas-disponibles", {
            params: { barberoId, servicioId, fecha },
        });
        return data.data;
    },

    async crearReserva(reserva) {
        const { data } = await apiPublica.post("/publico/reservas", reserva);
        return data.data;
    },

    async consultarReserva({ codigo, correo }) {
        const { data } = await apiPublica.post("/publico/reservas/consultar", { codigo, correo });
        return data.data;
    },

    async cancelarReserva({ codigo, correo }) {
        const { data } = await apiPublica.post("/publico/reservas/cancelar", { codigo, correo });
        return data.data;
    },
};

export function mensajeDeError(error, porDefecto = "Ocurrió un error. Intente de nuevo.") {
    if (!error?.response) return "No fue posible conectar con la barbería. Revise su conexión e intente de nuevo.";
    return error.response.data?.message || porDefecto;
}

export default publicoService;
