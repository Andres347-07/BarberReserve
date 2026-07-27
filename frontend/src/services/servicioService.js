import api from "./api";

const servicioService = {

    async obtenerServicios() {

        const { data } = await api.get("/servicios");
        return data.data;

    },

    async crearServicio(servicio) {

        const { data } = await api.post("/servicios", servicio);
        return data;

    },

    async actualizarServicio(id, servicio) {

        const { data } = await api.put(`/servicios/${id}`, servicio);
        return data;

    },

    async eliminarServicio(id) {

        const { data } = await api.delete(`/servicios/${id}`);
        return data;

    }

};

export default servicioService;