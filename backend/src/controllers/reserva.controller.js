const reservaService = require("../services/reserva.service");

class ReservaController {

    async obtenerTodas(req, res) {

        try {

            const reservas = await reservaService.obtenerTodas();

            return res.status(200).json({
                success: true,
                data: reservas,
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

            const reserva = await reservaService.obtenerPorId(req.params.id);

            if (!reserva) {

                return res.status(404).json({
                    success: false,
                    message: "Reserva no encontrada.",
                });

            }

            return res.status(200).json({
                success: true,
                data: reserva,
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

            const reserva = await reservaService.crear(req.body);

            return res.status(201).json({
                success: true,
                message: "Reserva creada correctamente.",
                data: reserva,
            });

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: error.message,
            });

        }

    }

    async actualizar(req, res) {

        try {

            const reserva = await reservaService.actualizar(
                req.params.id,
                req.body
            );

            if (!reserva) {

                return res.status(404).json({
                    success: false,
                    message: "Reserva no encontrada.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Reserva actualizada correctamente.",
                data: reserva,
            });

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: error.message,
            });

        }

    }

    async eliminar(req, res) {

        try {

            const eliminado = await reservaService.eliminar(req.params.id);

            if (!eliminado) {

                return res.status(404).json({
                    success: false,
                    message: "Reserva no encontrada.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Reserva eliminada correctamente.",
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

}

module.exports = new ReservaController();