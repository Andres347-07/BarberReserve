const Servicio = require("../models/Servicio");
const Reserva = require("../models/Reserva");

class ServicioService {

    async obtenerTodos() {
        return await Servicio.findAll({
            order: [["id", "ASC"]],
        });
    }

    async obtenerPorId(id) {
        return await Servicio.findByPk(id);
    }

   
    validar(datos) {

        if (datos.duracion !== undefined) {
            const duracion = Number(datos.duracion);

            if (Number.isNaN(duracion) || duracion <= 0) {
                throw new Error("La duración debe ser mayor que cero.");
            }
        }

        if (datos.precio !== undefined) {
            const precio = Number(datos.precio);

            if (Number.isNaN(precio) || precio <= 0) {
                throw new Error("El precio debe ser un valor positivo.");
            }
        }
    }

    async crear(datos) {

        this.validar(datos);

        return await Servicio.create(datos);
    }

    async actualizar(id, datos) {

        const servicio = await Servicio.findByPk(id);

        if (!servicio) return null;

        this.validar(datos);

        await servicio.update(datos);

        return servicio;

    }

    async eliminar(id) {

        const servicio = await Servicio.findByPk(id);

        if (!servicio) return null;

        const tieneReservas = await Reserva.count({ where: { servicioId: id } });

        if (tieneReservas > 0) {
            throw new Error(
                "No es posible eliminar este servicio porque posee reservas asociadas."
            );
        }

        await servicio.destroy();

        return true;

    }

}

module.exports = new ServicioService();
