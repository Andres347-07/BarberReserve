const sequelize = require("../database/connection");
const { Barbero, Cliente, Servicio, Reserva } = require("../models");
const reservaService = require("../services/reserva.service");
const horarioService = require("../services/horario.service");

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe("reserva.service — horas disponibles (algoritmo de la especificación 9.6)", () => {
    let barbero, cliente, servicio;

    beforeAll(async () => {
        barbero = await Barbero.create({
            nombre: "Andres Horas Test",
            especialidad: "Fade",
            telefono: "3080000000",
            correo: "andres.horas-test@test.com",
            estado: "Activo",
        });

        cliente = await Cliente.create({
            nombre: "Cliente Horas Test",
            telefono: "3231111111",
            correo: "cliente.horas-test@test.com",
        });

        servicio = await Servicio.create({
            nombre: "Corte clasico horas test",
            descripcion: "Corte con tijera y maquina",
            duracion: 45,
            precio: 25000,
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-20",
            horaInicio: "08:00",
            horaFin: "18:00",
            estado: "Activo",
        });

        for (const hora of ["09:30", "11:00", "15:15"]) {
            await Reserva.create({
                clienteId: cliente.id,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: "2026-08-20",
                hora,
                duracion: 45,
                estado: "Pendiente",
            });
        }
    });

    test("calcula las horas disponibles exactamente como en el ejemplo de la especificación", async () => {
        const horas = await reservaService.obtenerHorasDisponibles({
            barberoId: barbero.id,
            fecha: "2026-08-20",
            servicioId: servicio.id,
        });

        expect(horas).toEqual([
            "08:00", "08:45", "10:15", "11:45", "12:30",
            "13:15", "14:00", "16:00", "16:45",
        ]);
    });

    test("devuelve un arreglo vacío si el barbero no tiene turno ese día", async () => {
        const horas = await reservaService.obtenerHorasDisponibles({
            barberoId: barbero.id,
            fecha: "2026-08-21",
            servicioId: servicio.id,
        });

        expect(horas).toEqual([]);
    });
});

describe("reserva.service — estados secuenciales del barbero y actualización automática del cliente", () => {
    let barbero, cliente, servicio, reserva;
    const usuarioBarbero = (barberoId) => ({ rol: "barbero", barberoId });

    beforeAll(async () => {
        barbero = await Barbero.create({
            nombre: "Barbero Estado Test",
            especialidad: "Fade",
            telefono: "3090000000",
            correo: "barbero.estado-test@test.com",
            estado: "Activo",
        });

        cliente = await Cliente.create({
            nombre: "Cliente Estado Test",
            telefono: "3241111111",
            correo: "cliente.estado-test@test.com",
            totalVisitas: 2,
        });

        servicio = await Servicio.create({
            nombre: "Servicio Estado Test",
            descripcion: "Servicio de prueba",
            duracion: 30,
            precio: 20000,
        });

        await horarioService.crear({
            barberoId: barbero.id,
            fecha: "2026-08-24",
            horaInicio: "08:00",
            horaFin: "14:00",
            estado: "Activo",
        });

        reserva = await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha: "2026-08-24",
            hora: "09:00",
        });
    });

    test("el barbero no puede saltar directamente a Finalizada desde Pendiente", async () => {
        await expect(
            reservaService.actualizar(reserva.id, { estado: "Finalizada" }, usuarioBarbero(barbero.id))
        ).rejects.toThrow(/no es posible cambiar/i);
    });

    test("el barbero puede avanzar de Pendiente a En proceso", async () => {
        const actualizada = await reservaService.actualizar(
            reserva.id,
            { estado: "En proceso" },
            usuarioBarbero(barbero.id)
        );

        expect(actualizada.estado).toBe("En proceso");
    });

    test("el barbero no puede regresar de En proceso a Pendiente", async () => {
        await expect(
            reservaService.actualizar(reserva.id, { estado: "Pendiente" }, usuarioBarbero(barbero.id))
        ).rejects.toThrow(/no es posible cambiar/i);
    });

    test("un admin no puede editar una reserva que ya no está Pendiente", async () => {
        await expect(
            reservaService.actualizar(reserva.id, { hora: "10:00" }, { rol: "admin" })
        ).rejects.toThrow(/no es posible modificar/i);
    });

    test("al finalizar el servicio, se actualiza automáticamente la última cita y las visitas del cliente", async () => {
        const actualizada = await reservaService.actualizar(
            reserva.id,
            { estado: "Finalizada" },
            usuarioBarbero(barbero.id)
        );

        expect(actualizada.estado).toBe("Finalizada");

        const clienteActualizado = await Cliente.findByPk(cliente.id);
        expect(clienteActualizado.ultimaCita).toBe("2026-08-24");
        expect(clienteActualizado.totalVisitas).toBe(3);
    });

    test("una reserva Finalizada ya no puede eliminarse", async () => {
        await expect(reservaService.eliminar(reserva.id)).rejects.toThrow(/no es posible eliminar/i);
    });

    test("el barbero ya no puede cambiar el estado de una reserva Finalizada", async () => {
        await expect(
            reservaService.actualizar(reserva.id, { estado: "En proceso" }, usuarioBarbero(barbero.id))
        ).rejects.toThrow(/ya fue finalizada/i);
    });
});
