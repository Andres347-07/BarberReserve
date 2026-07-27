const Cliente = require("./Cliente");
const Barbero = require("./Barbero");
const Servicio = require("./Servicio");
const Horario = require("./Horario");
const Reserva = require("./Reserva");
const Usuario = require("./Usuario");


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


module.exports = {
    Cliente,
    Barbero,
    Servicio,
    Horario,
    Reserva,
    Usuario,
};
