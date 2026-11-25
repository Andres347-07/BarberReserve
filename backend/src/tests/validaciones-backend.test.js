const sequelize = require("../database/connection");
const clienteService = require("../services/cliente.service");
const barberoService = require("../services/barbero.service");
const horarioService = require("../services/horario.service");
const { Barbero } = require("../models");

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe("Validaciones de formato en el backend (Clientes y Barberos) — 13.12", () => {

    test("rechaza un cliente con nombre de menos de 3 caracteres, aunque el frontend no lo filtre", async () => {
        await expect(
            clienteService.crear({ nombre: "Al", telefono: "3001112233", correo: "al@test.com" })
        ).rejects.toThrow(/mínimo 3 caracteres/i);
    });

    test("rechaza un cliente con teléfono que no tiene exactamente 10 dígitos", async () => {
        await expect(
            clienteService.crear({ nombre: "Ana Pérez", telefono: "12345", correo: "ana@test.com" })
        ).rejects.toThrow(/exactamente 10 dígitos/i);
    });

    test("rechaza un cliente con un correo sin formato válido", async () => {
        await expect(
            clienteService.crear({ nombre: "Ana Pérez", telefono: "3001112233", correo: "no-es-un-correo" })
        ).rejects.toThrow(/correo electrónico válido/i);
    });

    test("acepta un cliente con datos válidos", async () => {
        const cliente = await clienteService.crear({
            nombre: "Ana Pérez", telefono: "3001112233", correo: "ana.valida@test.com",
        });
        expect(cliente.id).toBeDefined();
    });

    test("rechaza un barbero con especialidad de menos de 3 caracteres", async () => {
        await expect(
            barberoService.crear({
                nombre: "Luis Gómez", especialidad: "Fa", telefono: "3101112233", correo: "luis@test.com",
            })
        ).rejects.toThrow(/especialidad debe contener mínimo 3 caracteres/i);
    });

    test("rechaza un barbero con teléfono inválido", async () => {
        await expect(
            barberoService.crear({
                nombre: "Luis Gómez", especialidad: "Fade", telefono: "abc", correo: "luis2@test.com",
            })
        ).rejects.toThrow(/exactamente 10 dígitos/i);
    });
});

describe("Horarios — un barbero Inactivo no puede recibir turnos (8.11 / 13.6)", () => {
    let barberoInactivo;

    beforeAll(async () => {
        barberoInactivo = await Barbero.create({
            nombre: "Barbero Inactivo Test",
            especialidad: "Fade",
            telefono: "3151112233",
            correo: "inactivo.horario-test@test.com",
            estado: "Inactivo",
        });
    });

    test("rechaza crear un turno individual para un barbero Inactivo", async () => {
        await expect(
            horarioService.crear({
                barberoId: barberoInactivo.id,
                fecha: "2099-09-01",
                horaInicio: "08:00",
                horaFin: "14:00",
                estado: "Activo",
            })
        ).rejects.toThrow(/Inactivo/);
    });

    test("rechaza planificar una semana completa para un barbero Inactivo", async () => {
        await expect(
            horarioService.crearSemana({
                barberoId: barberoInactivo.id,
                semana: "2099-09-01",
                dias: [{ fecha: "2099-09-01", horaInicio: "08:00", horaFin: "14:00", estado: "Activo" }],
            })
        ).rejects.toThrow(/Inactivo/);
    });
});
