const sequelize = require("../database/connection");
const { Servicio, Cliente, Barbero } = require("../models");
const servicioService = require("../services/servicio.service");
const horarioService = require("../services/horario.service");
const reservaService = require("../services/reserva.service");

describe("servicio.service — validaciones y eliminación bloqueada por reservas", () => {

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("rechaza crear un servicio con duración menor o igual a cero", async () => {
        await expect(
            servicioService.crear({
                nombre: "Corte rapido",
                descripcion: "Corte de prueba",
                duracion: 0,
                precio: 20000,
            })
        ).rejects.toThrow(/duración debe ser mayor que cero/i);
    });

    test("rechaza crear un servicio con precio negativo", async () => {
        await expect(
            servicioService.crear({
                nombre: "Corte rapido",
                descripcion: "Corte de prueba",
                duracion: 30,
                precio: -5000,
            })
        ).rejects.toThrow(/precio debe ser un valor positivo/i);
    });

    test("crea un servicio válido correctamente", async () => {
        const servicio = await servicioService.crear({
            nombre: "Corte clasico",
            descripcion: "Corte con tijera y maquina",
            duracion: 30,
            precio: 25000,
        });

        expect(servicio.id).toBeDefined();
        expect(servicio.estado).toBe("Activo");
    });

    test("rechaza actualizar un servicio con duración inválida", async () => {
        const servicio = await Servicio.findOne({ where: { nombre: "Corte clasico" } });

        await expect(
            servicioService.actualizar(servicio.id, { duracion: -10 })
        ).rejects.toThrow(/duración debe ser mayor que cero/i);
    });

    test("bloquea la eliminación de un servicio que tiene reservas asociadas", async () => {
        const servicio = await Servicio.findOne({ where: { nombre: "Corte clasico" } });

        const barbero = await Barbero.create({
            nombre: "Barbero Servicio Test",
            especialidad: "Fade",
            telefono: "3060000000",
            correo: "barbero.servicio-test@test.com",
            estado: "Activo",
        });

        const cliente = await Cliente.create({
            nombre: "Cliente Servicio Test",
            telefono: "3221111111",
            correo: "cliente.servicio-test@test.com",
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-12",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

        await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-08-12",
            hora: "09:00",
        });

        await expect(servicioService.eliminar(servicio.id)).rejects.toThrow(/reservas asociadas/i);
    });

    test("permite eliminar un servicio sin reservas asociadas", async () => {
        const servicio = await servicioService.crear({
            nombre: "Servicio Sin Uso",
            descripcion: "Servicio de prueba sin reservas",
            duracion: 20,
            precio: 15000,
        });

        const resultado = await servicioService.eliminar(servicio.id);
        expect(resultado).toBe(true);
    });
});
