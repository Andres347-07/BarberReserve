const sequelize = require("../database/connection");
const { Cliente, Barbero, Servicio, Horario } = require("../models");
const clienteService = require("../services/cliente.service");
const horarioService = require("../services/horario.service");
const reservaService = require("../services/reserva.service");

describe("cliente.service — eliminación bloqueada por reservas asociadas", () => {
    let clienteConReserva, clienteSinReserva, barbero, servicio;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        barbero = await Barbero.create({
            nombre: "Andres Soto",
            especialidad: "Fade",
            telefono: "3000000000",
            correo: "andres.cliente-test@test.com",
        });

        servicio = await Servicio.create({
            nombre: "Corte clasico",
            descripcion: "Corte con tijera y maquina",
            duracion: 30,
            precio: 25000,
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-03",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

        clienteConReserva = await Cliente.create({
            nombre: "Carlos Ramirez",
            telefono: "3111111111",
            correo: "carlos.cliente-test@test.com",
        });

        clienteSinReserva = await Cliente.create({
            nombre: "Laura Gomez",
            telefono: "3222222222",
            correo: "laura.cliente-test@test.com",
        });

        await reservaService.crear({
            clienteId: clienteConReserva.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-08-03",
            hora: "09:00",
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("rechaza eliminar un cliente que tiene reservas asociadas", async () => {
        await expect(
            clienteService.eliminar(clienteConReserva.id)
        ).rejects.toThrow(/reservas asociadas/i);

        const sigueExistiendo = await Cliente.findByPk(clienteConReserva.id);
        expect(sigueExistiendo).not.toBeNull();
    });

    test("permite eliminar un cliente sin reservas asociadas", async () => {
        const resultado = await clienteService.eliminar(clienteSinReserva.id);
        expect(resultado).toBe(true);

        const yaNoExiste = await Cliente.findByPk(clienteSinReserva.id);
        expect(yaNoExiste).toBeNull();
    });
});
