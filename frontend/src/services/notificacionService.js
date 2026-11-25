import api from "./api";

const notificacionService = {
    async listar() {
        const { data } = await api.get("/notificaciones");
        return data.data;
    },
    async marcarLeida(id) {
        const { data } = await api.patch(`/notificaciones/${id}/leida`);
        return data;
    },
    async marcarTodas() {
        const { data } = await api.patch("/notificaciones/leidas");
        return data;
    },
};

export default notificacionService;
