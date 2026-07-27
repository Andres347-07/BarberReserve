import api from "./api";

const agendaService = {
  async obtenerDia(filtros = {}) {
    const { data } = await api.get("/agenda", { params: filtros });
    return data.data; // { fecha, turno, reservas }
  },
};

export default agendaService;
