const barberoService = require("../services/barbero.service");

class BarberoController {


    async obtenerTodos(req, res) {

        try {

            const barberos = await barberoService.obtenerTodos();

            return res.status(200).json({
                success: true,
                data: barberos,
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

            const barbero = await barberoService.obtenerPorId(req.params.id);


            if (!barbero) {

                return res.status(404).json({
                    success: false,
                    message: "Barbero no encontrado.",
                });

            }


            return res.status(200).json({
                success: true,
                data: barbero,
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


            const barbero = await barberoService.crear(req.body);



            return res.status(201).json({

                success: true,

                message:
                    "Barbero creado correctamente.",

                data: barbero,

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


            const barbero =
                await barberoService.actualizar(
                    req.params.id,
                    req.body
                );



            if (!barbero) {


                return res.status(404).json({

                    success: false,

                    message:
                        "Barbero no encontrado.",

                });


            }



            return res.status(200).json({

                success: true,

                message:
                    "Barbero actualizado correctamente.",

                data: barbero,

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


            const eliminado =
                await barberoService.eliminar(req.params.id);



            if (!eliminado) {


                return res.status(404).json({

                    success: false,

                    message:
                        "Barbero no encontrado.",

                });


            }



            return res.status(200).json({

                success: true,

                message:
                    "Barbero eliminado correctamente.",

            });



        } catch (error) {


            return res.status(500).json({

                success: false,

                message: error.message,

            });


        }

    }


}


module.exports = new BarberoController();