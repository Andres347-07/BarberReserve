import api from "./api";

const clienteService = {

    async obtenerClientes() {

        const { data } = await api.get("/clientes");
        return data.data;

    },

    async crearCliente(cliente) {

        const { data } = await api.post("/clientes", cliente);
        return data;

    },

    async actualizarCliente(id, cliente) {

        const { data } = await api.put(`/clientes/${id}`, cliente);
        return data;

    },

    async eliminarCliente(id) {

        const { data } = await api.delete(`/clientes/${id}`);
        return data;

    }

};

export default clienteService;