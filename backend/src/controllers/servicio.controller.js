const servicioService = require("../services/servicio.service");

class ServicioController {

    async obtenerTodos(req, res) {

        try {

            const servicios = await servicioService.obtenerTodos();

            return res.status(200).json({
                success: true,
                data: servicios,
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async obtenerPorId(req, res) {

        try {

            const servicio = await servicioService.obtenerPorId(req.params.id);

            if (!servicio) {

                return res.status(404).json({
                    success: false,
                    message: "Servicio no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                data: servicio,
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async crear(req, res) {

        try {

            const servicio = await servicioService.crear(req.body);

            return res.status(201).json({
                success: true,
                message: "Servicio creado correctamente.",
                data: servicio,
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async actualizar(req, res) {

        try {

            const servicio = await servicioService.actualizar(
                req.params.id,
                req.body
            );

            if (!servicio) {

                return res.status(404).json({
                    success: false,
                    message: "Servicio no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Servicio actualizado correctamente.",
                data: servicio,
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async eliminar(req, res) {

        try {

            const eliminado = await servicioService.eliminar(req.params.id);

            if (!eliminado) {

                return res.status(404).json({
                    success: false,
                    message: "Servicio no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Servicio eliminado correctamente.",
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

}

module.exports = new ServicioController();