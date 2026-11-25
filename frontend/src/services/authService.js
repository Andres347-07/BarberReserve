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
    // Cambiar la contraseña cierra las demás sesiones; esta recibe un token nuevo
    if (data?.data?.token) {
      localStorage.setItem("token", data.data.token);
      api.defaults.headers.common.Authorization = `Bearer ${data.data.token}`;
    }
    return data;
  },

  // ---- Configuración inicial y dueño del negocio ----

  async estadoInstalacion() {
    const { data } = await api.get("/auth/estado-instalacion");
    return data.data; // { instalado, requiereCodigo, disponible }
  },

  async configuracionInicial(datos) {
    const { data } = await api.post("/auth/configuracion-inicial", datos);
    return data.data; // { usuario, codigoRecuperacion }
  },

  async recuperarAcceso(datos) {
    const { data } = await api.post("/auth/recuperar-acceso", datos);
    return data.data; // { codigoRecuperacion }
  },

  async regenerarCodigoRecuperacion(password) {
    const { data } = await api.post("/auth/codigo-recuperacion", { password });
    return data.data;
  },

  async transferirPropiedad(usuarioId, password) {
    const { data } = await api.post("/auth/transferir-propiedad", { usuarioId, password });
    return data.data; // { nuevoDueño, codigoRecuperacion }
  },
};

export default authService;
