import api from "./api";

const configuracionService = {
    async obtener() {
        const { data } = await api.get("/configuracion");
        return data.data;
    },
    async guardar(config) {
        const { data } = await api.put("/configuracion", config);
        return data;
    },
};

export default configuracionService;
