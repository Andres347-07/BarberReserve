const horarioService = require("../services/horario.service");

class HorarioController {

    async obtenerTodos(req, res) {

        try {

            const horarios = await horarioService.obtenerTodos();

            return res.status(200).json({
                success: true,
                data: horarios,
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

            const horario = await horarioService.obtenerPorId(req.params.id);

            if (!horario) {
                return res.status(404).json({
                    success: false,
                    message: "Horario no encontrado.",
                });
            }

            return res.status(200).json({
                success: true,
                data: horario,
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

            const horario = await horarioService.crear(req.body);

            return res.status(201).json({
                success: true,
                message: "Horario creado correctamente.",
                data: horario,
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

            const horario = await horarioService.actualizar(
                req.params.id,
                req.body
            );

            if (!horario) {
                return res.status(404).json({
                    success: false,
                    message: "Horario no encontrado.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Horario actualizado correctamente.",
                data: horario,
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

            const eliminado = await horarioService.eliminar(req.params.id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: "Horario no encontrado.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Horario eliminado correctamente.",
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

}

module.exports = new HorarioController();