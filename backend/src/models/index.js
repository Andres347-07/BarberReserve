const Cliente = require("./Cliente");
const Barbero = require("./Barbero");
const Servicio = require("./Servicio");

/*
|--------------------------------------------------------------------------
| Relaciones
|--------------------------------------------------------------------------
|
| Aquí se registrarán todas las relaciones entre modelos.
| Por ahora solamente dejamos importados los modelos base.
| Cuando creemos Horario y Reserva agregaremos las asociaciones.
|
*/

module.exports = {
    Cliente,
    Barbero,
    Servicio,
};