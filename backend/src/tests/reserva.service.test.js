const sequelize = require("../database/connection");
const { Barbero, Cliente, Servicio, Horario, Reserva } = require("../models");
const reservaService = require("../services/reserva.service");
const horarioService = require("../services/horario.service");

describe("reserva.service — validación de disponibilidad (turnos semanales)", () => {
    let barbero, cliente, servicio;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        barbero = await Barbero.create({
            nombre: "Andres Soto",
            especialidad: "Fade",
            telefono: "3000000000",
            correo: "andres@test.com",
        });

        cliente = await Cliente.create({
            nombre: "Carlos Ramirez",
            telefono: "3111111111",
            correo: "carlos@test.com",
        });

        servicio = await Servicio.create({
            nombre: "Corte clasico",
            descripcion: "Corte con tijera y maquina",
            duracion: 30,
            precio: 25000,
        });

        
        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-07-27",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

       
        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-07-28",
            estado: "Descanso",
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("crea una reserva válida dentro del turno", async () => {
        const reserva = await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-07-27",
            hora: "09:00",
        });

        expect(reserva.id).toBeDefined();
        expect(reserva.estado).toBe("Pendiente");
        expect(reserva.duracion).toBe(30);
    });

    test("rechaza una reserva que se solapa con otra existente", async () => {
        await expect(
            reservaService.crear({
                clienteId: cliente.id,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: "2026-07-27",
                hora: "09:15", 
            })
        ).rejects.toThrow(/ya existe una reserva en ese horario/i);
    });

    test("rechaza una reserva en un día de Descanso", async () => {
        await expect(
            reservaService.crear({
                clienteId: cliente.id,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: "2026-07-28",
                hora: "09:00",
            })
        ).rejects.toThrow(/no se encuentra disponible/i);
    });

    test("rechaza una reserva fuera del rango horario del turno", async () => {
        await expect(
            reservaService.crear({
                clienteId: cliente.id,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: "2026-07-27",
                hora: "15:00", 
            })
        ).rejects.toThrow(/fuera del turno/i);
    });

    test("permite una segunda reserva ese mismo día si no se solapa", async () => {
        const reserva = await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-07-27",
            hora: "10:00",
        });

        expect(reserva.id).toBeDefined();
    });
});
