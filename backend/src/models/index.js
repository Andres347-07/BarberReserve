const Cliente = require("./Cliente");
const Barbero = require("./Barbero");
const Servicio = require("./Servicio");
const Horario = require("./Horario");
const Reserva = require("./Reserva");
const Usuario = require("./Usuario");
const PlantillaHorario = require("./PlantillaHorario");
const Bloqueo = require("./Bloqueo");
const Notificacion = require("./Notificacion");
const Configuracion = require("./Configuracion");
const LimiteSolicitud = require("./LimiteSolicitud");


/*
|---------------------------------------
| RELACIONES
|---------------------------------------


/* Cliente -> Reserva */

Cliente.hasMany(Reserva, {
    foreignKey: "clienteId",
    as: "reservas",
});

Reserva.belongsTo(Cliente, {
    foreignKey: "clienteId",
    as: "cliente",
});



/* Barbero -> Horario */

Barbero.hasMany(Horario, {
    foreignKey: "barberoId",
    as: "horarios",
});

Horario.belongsTo(Barbero, {
    foreignKey: "barberoId",
    as: "barbero",
});



/* Barbero -> Reserva */

Barbero.hasMany(Reserva, {
    foreignKey: "barberoId",
    as: "reservas",
});

Reserva.belongsTo(Barbero, {
    foreignKey: "barberoId",
    as: "barbero",
});



/* Servicio -> Reserva */

Servicio.hasMany(Reserva, {
    foreignKey: "servicioId",
    as: "reservas",
});

Reserva.belongsTo(Servicio, {
    foreignKey: "servicioId",
    as: "servicio",
});



/* Barbero -> Usuario (cuenta de acceso opcional para el barbero) */

Barbero.hasOne(Usuario, {
    foreignKey: "barberoId",
    as: "usuario",
});

Usuario.belongsTo(Barbero, {
    foreignKey: "barberoId",
    as: "barbero",
});


/* Barbero -> Plantilla semanal y bloqueos */
Barbero.hasMany(PlantillaHorario, { foreignKey: "barberoId", as: "plantilla" });
PlantillaHorario.belongsTo(Barbero, { foreignKey: "barberoId", as: "barbero" });
Barbero.hasMany(Bloqueo, { foreignKey: "barberoId", as: "bloqueos" });
Bloqueo.belongsTo(Barbero, { foreignKey: "barberoId", as: "barbero" });

/* Barbero <-> Servicio: qué servicios realiza cada barbero */
Barbero.belongsToMany(Servicio, { through: "barbero_servicios", foreignKey: "barberoId", otherKey: "servicioId", as: "servicios" });
Servicio.belongsToMany(Barbero, { through: "barbero_servicios", foreignKey: "servicioId", otherKey: "barberoId", as: "barberos" });

/* Usuario -> Notificación */
Usuario.hasMany(Notificacion, { foreignKey: "usuarioId", as: "notificaciones" });
Notificacion.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
Notificacion.belongsTo(Reserva, { foreignKey: "reservaId", as: "reserva", constraints: false });

module.exports = {
    LimiteSolicitud,
    Cliente,
    Barbero,
    Servicio,
    Horario,
    Reserva,
    Usuario,
    PlantillaHorario,
    Bloqueo,
    Notificacion,
    Configuracion,
};
