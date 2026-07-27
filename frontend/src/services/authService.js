import api from "./api";

const authService = {
  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data; // { token, usuario }
  },

  async registrarPrimerAdmin(datos) {
    const { data } = await api.post("/auth/register", datos);
    return data.data;
  },

  async crearUsuario(datos) {
    const { data } = await api.post("/auth/usuarios", datos);
    return data;
  },

  async obtenerPerfil() {
    const { data } = await api.get("/auth/me");
    return data.data;
  },

  async obtenerUsuarios() {
    const { data } = await api.get("/auth/usuarios");
    return data.data;
  },

  async actualizarUsuario(id, datos) {
    const { data } = await api.put(`/auth/usuarios/${id}`, datos);
    return data;
  },

  async restablecerPassword(id) {
    const { data } = await api.put(`/auth/usuarios/${id}/restablecer-password`);
    return data;
  },

  async cambiarPassword(datos) {
    const { data } = await api.put("/auth/cambiar-password", datos);
    return data;
  },
};

export default authService;
