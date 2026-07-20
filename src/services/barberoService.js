import api from "./api";

const barberoService = {

    async obtenerBarberos() {

        const { data } = await api.get("/barberos");
        return data.data;

    },

    async crearBarbero(barbero) {

        const { data } = await api.post("/barberos", barbero);
        return data;

    },

    async actualizarBarbero(id, barbero) {

        const { data } = await api.put(`/barberos/${id}`, barbero);
        return data;

    },

    async eliminarBarbero(id) {

        const { data } = await api.delete(`/barberos/${id}`);
        return data;

    }

};

export default barberoService;