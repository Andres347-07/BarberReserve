const clienteService = require("../services/cliente.service");

class ClienteController {

    async obtenerTodos(req, res) {

        try {

            const clientes = await clienteService.obtenerTodos();

            return res.status(200).json({
                success: true,
                data: clientes,
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

            const cliente = await clienteService.obtenerPorId(req.params.id);

            if (!cliente) {

                return res.status(404).json({
                    success: false,
                    message: "Cliente no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                data: cliente,
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

            const cliente = await clienteService.crear(req.body);

            return res.status(201).json({
                success: true,
                message: "Cliente creado correctamente.",
                data: cliente,
            });

        } catch (error) {

            if (
                error.message.includes("teléfono") ||
                error.message.includes("correo")
            ) {

                return res.status(409).json({
                    success: false,
                    message: error.message,
                });

            }

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async actualizar(req, res) {

        try {

            const cliente = await clienteService.actualizar(
                req.params.id,
                req.body
            );

            if (!cliente) {

                return res.status(404).json({
                    success: false,
                    message: "Cliente no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Cliente actualizado correctamente.",
                data: cliente,
            });

        } catch (error) {

            if (
                error.message.includes("teléfono") ||
                error.message.includes("correo")
            ) {

                return res.status(409).json({
                    success: false,
                    message: error.message,
                });

            }

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

    async eliminar(req, res) {

        try {

            const eliminado = await clienteService.eliminar(req.params.id);

            if (!eliminado) {

                return res.status(404).json({
                    success: false,
                    message: "Cliente no encontrado.",
                });

            }

            return res.status(200).json({
                success: true,
                message: "Cliente eliminado correctamente.",
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }

    }

}

module.exports = new ClienteController();