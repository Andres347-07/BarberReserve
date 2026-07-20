import api from "./api";

const horarioService = {

    async obtenerHorarios() {

        const { data } = await api.get("/horarios");
        return data.data;

    },

    async crearHorario(horario) {

        const { data } = await api.post("/horarios", horario);
        return data;

    },

    async actualizarHorario(id, horario) {

        const { data } = await api.put(`/horarios/${id}`, horario);
        return data;

    },

    async eliminarHorario(id) {

        const { data } = await api.delete(`/horarios/${id}`);
        return data;

    }

};

export default horarioService;