const sequelize = require("../database/connection");
const { Barbero, Cliente, Servicio } = require("../models");
const agendaService = require("../services/agenda.service");
const horarioService = require("../services/horario.service");
const reservaService = require("../services/reserva.service");

describe("agenda.service — orden cronológico y filtros del administrador", () => {
    let barberoA, barberoB, cliente, servicio;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        barberoA = await Barbero.create({
            nombre: "Felipe Agenda Test",
            especialidad: "Fade",
            telefono: "3100000000",
            correo: "felipe.agenda-test@test.com",
            estado: "Activo",
        });

        barberoB = await Barbero.create({
            nombre: "Diego Agenda Test",
            especialidad: "Barba",
            telefono: "3110000000",
            correo: "diego.agenda-test@test.com",
            estado: "Activo",
        });

        cliente = await Cliente.create({
            nombre: "Cliente Agenda Test",
            telefono: "3251111111",
            correo: "cliente.agenda-test@test.com",
        });

        servicio = await Servicio.create({
            nombre: "Servicio Agenda Test",
            descripcion: "Servicio de prueba",
            duracion: 30,
            precio: 20000,
        });

        for (const barbero of [barberoA, barberoB]) {
            await horarioService.crear({
                barberoId: barbero.id,
                fecha: "2026-08-27",
                horaInicio: "08:00",
                horaFin: "18:00",
                estado: "Activo",
            });
        }

       
        await reservaService.crear({
            clienteId: cliente.id, barberoId: barberoB.id, servicioId: servicio.id,
            fecha: "2026-08-27", hora: "11:00",
        });
        await reservaService.crear({
            clienteId: cliente.id, barberoId: barberoA.id, servicioId: servicio.id,
            fecha: "2026-08-27", hora: "08:00",
        });
        await reservaService.crear({
            clienteId: cliente.id, barberoId: barberoB.id, servicioId: servicio.id,
            fecha: "2026-08-27", hora: "09:00",
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("la agenda combinada de todos los barberos queda ordenada estrictamente por hora", async () => {
        const agenda = await agendaService.obtenerDia({ fecha: "2026-08-27" });

        const horas = agenda.reservas.map((r) => r.hora.slice(0, 5));
        expect(horas).toEqual(["08:00", "09:00", "11:00"]);
    });

    test("el filtro por barbero (uso del administrador) devuelve solo sus reservas", async () => {
        const agenda = await agendaService.obtenerDia({ fecha: "2026-08-27", barberoId: barberoB.id });

        expect(agenda.reservas).toHaveLength(2);
        agenda.reservas.forEach((r) => expect(r.barberoId).toBe(barberoB.id));
    });

    test("el filtro por estado (uso del administrador) funciona correctamente", async () => {
        const todasPendientes = await agendaService.obtenerDia({ fecha: "2026-08-27", estado: "Pendiente" });
        expect(todasPendientes.reservas).toHaveLength(3);

        const finalizadas = await agendaService.obtenerDia({ fecha: "2026-08-27", estado: "Finalizada" });
        expect(finalizadas.reservas).toHaveLength(0);
    });
});
