const sequelize = require("../database/connection");
const { Barbero, Usuario, Horario, Reserva, Cliente, Servicio } = require("../models");
const barberoService = require("../services/barbero.service");
const horarioService = require("../services/horario.service");
const reservaService = require("../services/reserva.service");

describe("barbero.service — creación automática de usuario y reglas de eliminación", () => {

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("crear() registra el barbero y su usuario de acceso automáticamente", async () => {
        const { barbero, passwordTemporal } = await barberoService.crear({
            nombre: "Felipe Torres",
            especialidad: "Barba",
            telefono: "3010000000",
            correo: "felipe@test.com",
        });

        expect(barbero.id).toBeDefined();
        expect(typeof passwordTemporal).toBe("string");
        expect(passwordTemporal.length).toBeGreaterThanOrEqual(8);

        const usuario = await Usuario.findOne({ where: { barberoId: barbero.id } });
        expect(usuario).not.toBeNull();
        expect(usuario.rol).toBe("barbero");
        expect(usuario.email).toBe("felipe@test.com");
    });

    test("no permite crear un barbero con un correo ya usado por otro usuario", async () => {
        await expect(
            barberoService.crear({
                nombre: "Otro Barbero",
                especialidad: "Fade",
                telefono: "3020000000",
                correo: "felipe@test.com",
            })
        ).rejects.toThrow();
    });

    test("al desactivar un barbero, su usuario también queda inactivo", async () => {
        const barbero = await Barbero.findOne({ where: { correo: "felipe@test.com" } });

        await barberoService.actualizar(barbero.id, { estado: "Inactivo" });

        const usuario = await Usuario.findOne({ where: { barberoId: barbero.id } });
        expect(usuario.activo).toBe(false);
    });

    test("bloquea la eliminación de un barbero que tiene horarios registrados", async () => {
        const barbero = await Barbero.create({
            nombre: "Diego Ruiz",
            especialidad: "Corte clasico",
            telefono: "3030000000",
            correo: "diego.barbero-test@test.com",
            estado: "Activo",
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-10",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

        await expect(barberoService.eliminar(barbero.id)).rejects.toThrow(/información relacionada/i);
    });

    test("permite eliminar un barbero sin horarios ni reservas, junto con su usuario", async () => {
        const { barbero } = await barberoService.crear({
            nombre: "Barbero Sin Uso",
            especialidad: "Fade",
            telefono: "3040000000",
            correo: "sinuso@test.com",
        });

        const resultado = await barberoService.eliminar(barbero.id);
        expect(resultado).toBe(true);

        const usuario = await Usuario.findOne({ where: { barberoId: barbero.id } });
        expect(usuario).toBeNull();
    });

    test("bloquea la eliminación de un barbero que tiene reservas registradas", async () => {
        const barbero = await Barbero.create({
            nombre: "Carlos Mora",
            especialidad: "Fade",
            telefono: "3050000000",
            correo: "carlos.barbero-test@test.com",
            estado: "Activo",
        });

        const cliente = await Cliente.create({
            nombre: "Cliente Prueba Barbero",
            telefono: "3211111111",
            correo: "cliente.barbero-test@test.com",
        });

        const servicio = await Servicio.create({
            nombre: "Servicio Prueba",
            descripcion: "Servicio de prueba",
            duracion: 30,
            precio: 20000,
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-11",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

        await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-08-11",
            hora: "09:00",
        });

        await expect(barberoService.eliminar(barbero.id)).rejects.toThrow(/información relacionada/i);
    });
});
