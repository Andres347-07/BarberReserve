import api from "./api";

const reservaService = {

    async obtenerReservas(filtros = {}) {

        const { data } = await api.get("/reservas", { params: filtros });
        return data.data;

    },

    async obtenerHorasDisponibles(barberoId, fecha, servicioId, excluirReservaId) {

        const { data } = await api.get("/reservas/horas-disponibles", {
            params: { barberoId, fecha, servicioId, excluirReservaId },
        });
        return data.data;

    },

    async crearReserva(reserva) {

        const { data } = await api.post("/reservas", reserva);
        return data;

    },

    async actualizarReserva(id, reserva) {

        const { data } = await api.put(`/reservas/${id}`, reserva);
        return data;

    },

    async cancelarReserva(id) {

        const { data } = await api.patch(`/reservas/${id}/cancelar`);
        return data;

    },

    async eliminarReserva(id) {

        const { data } = await api.delete(`/reservas/${id}`);
        return data;

    }

};

export default reservaService;
