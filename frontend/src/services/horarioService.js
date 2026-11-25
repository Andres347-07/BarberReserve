import api from "./api";

const horarioService = {

    async obtenerHorarios(filtros = {}) {

        const { data } = await api.get("/horarios", { params: filtros });
        return data.data;

    },

    async obtenerSemanaActual(barberoId) {

        const { data } = await api.get("/horarios/semana-actual", { params: { barberoId } });
        return data.data;

    },

    async crearHorario(horario) {

        const { data } = await api.post("/horarios", horario);
        return data;

    },

    async crearSemana(payload) {

        const { data } = await api.post("/horarios/semana", payload);
        return data;

    },

    async actualizarHorario(id, horario) {

        const { data } = await api.put(`/horarios/${id}`, horario);
        return data;

    },

    async obtenerPlantilla(barberoId) {
        const { data } = await api.get(`/horarios/plantilla/${barberoId}`);
        return data.data;
    },

    async obtenerMiPlantilla() {
        const { data } = await api.get("/horarios/plantilla/mia");
        return data.data;
    },

    async guardarPlantilla(barberoId, dias) {
        const { data } = await api.put(`/horarios/plantilla/${barberoId}`, { dias });
        return data;
    },

    async obtenerBloqueos(filtros = {}) {
        const { data } = await api.get("/horarios/bloqueos", { params: filtros });
        return data.data;
    },

    async crearBloqueo(bloqueo) {
        const { data } = await api.post("/horarios/bloqueos", bloqueo);
        return data;
    },

    async eliminarBloqueo(id) {
        const { data } = await api.delete(`/horarios/bloqueos/${id}`);
        return data;
    },

    async eliminarHorario(id) {

        const { data } = await api.delete(`/horarios/${id}`);
        return data;

    }

};

export default horarioService;
