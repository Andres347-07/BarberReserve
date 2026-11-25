process.env.DESACTIVAR_LIMITE = "true";

const request = require("supertest");

const app = require("../app");
const sequelize = require("../database/connection");
const { aplicarMigraciones } = require("../database/migraciones");
const { Barbero, Cliente, Servicio, Reserva, Horario } = require("../models");
const reservaService = require("../services/reserva.service");
const horarioService = require("../services/horario.service");
const limitarSolicitudes = require("../middlewares/rateLimit.middleware");
const { sumarDias, hoyEnZona } = require("../utils/fechaHora");

// Fechas siempre futuras, para que la regla "no reservar en el pasado" no
// dependa del día en que se ejecuten las pruebas.
const MANANA = sumarDias(hoyEnZona(), 1);
const PASADO_MANANA = sumarDias(hoyEnZona(), 2);
const DIA_DESCANSO = sumarDias(hoyEnZona(), 3);

describe("Portal público — reservas sin iniciar sesión", () => {
    let barbero, barberoInactivo, servicio, servicioInactivo, clienteExistente;
    let restriccionBD;

    const datosCliente = {
        nombre: "Laura Gómez",
        telefono: "3009998877",
        correo: "Laura.Gomez@Correo.com",
    };

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        const { exclusion } = await aplicarMigraciones(sequelize, { silencioso: true });
        restriccionBD = exclusion;

        barbero = await Barbero.create({
            nombre: "Barbero Portal",
            especialidad: "Fade",
            telefono: "3001112233",
            correo: "barbero.portal@test.com",
            estado: "Activo",
        });

        barberoInactivo = await Barbero.create({
            nombre: "Barbero Inactivo Portal",
            especialidad: "Barba",
            telefono: "3001112234",
            correo: "inactivo.portal@test.com",
            estado: "Inactivo",
        });

        servicio = await Servicio.create({
            nombre: "Corte Portal",
            descripcion: "Corte de prueba",
            duracion: 30,
            precio: 25000,
            estado: "Activo",
        });

        servicioInactivo = await Servicio.create({
            nombre: "Servicio Oculto",
            descripcion: "No debe mostrarse",
            duracion: 30,
            precio: 10000,
            estado: "Inactivo",
        });

        clienteExistente = await Cliente.create({
            nombre: "Cliente Existente",
            telefono: "3110001122",
            correo: "existente@test.com",
        });

        for (const fecha of [MANANA, PASADO_MANANA]) {
            await horarioService.crear({
                barberoId: barbero.id, fecha, horaInicio: "08:00", horaFin: "12:00", estado: "Activo",
            });
        }

        await horarioService.crear({ barberoId: barbero.id, fecha: DIA_DESCANSO, estado: "Descanso" });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe("catálogo", () => {
        test("lista solo servicios activos, con precio y duración", async () => {
            const res = await request(app).get("/api/publico/servicios");
            expect(res.status).toBe(200);
            const nombres = res.body.data.map((s) => s.nombre);
            expect(nombres).toContain("Corte Portal");
            expect(nombres).not.toContain("Servicio Oculto");
            expect(res.body.data[0]).toHaveProperty("precio");
            expect(res.body.data[0]).toHaveProperty("duracion");
        });

        test("lista solo barberos activos y nunca expone su teléfono ni su correo", async () => {
            const res = await request(app).get("/api/publico/barberos");
            expect(res.status).toBe(200);
            expect(res.body.data.map((b) => b.nombre)).toEqual(["Barbero Portal"]);
            expect(res.body.data[0].telefono).toBeUndefined();
            expect(res.body.data[0].correo).toBeUndefined();
        });

        test("las rutas administrativas siguen protegidas", async () => {
            const res = await request(app).get("/api/clientes");
            expect(res.status).toBe(401);
        });
    });

    describe("disponibilidad", () => {
        test("calcula horas libres respetando turno y duración del servicio", async () => {
            const res = await request(app)
                .get("/api/publico/horas-disponibles")
                .query({ barberoId: barbero.id, servicioId: servicio.id, fecha: MANANA });
            expect(res.status).toBe(200);
            expect(res.body.data[0]).toBe("08:00");
            // 2.1: cupos cada 15 minutos; un corte de 30 min puede empezar hasta las 11:30.
            expect(res.body.data).toHaveLength(15);
            expect(res.body.data[res.body.data.length - 1]).toBe("11:30");
        });

        test("un día de descanso no tiene horas disponibles", async () => {
            const res = await request(app)
                .get("/api/publico/horas-disponibles")
                .query({ barberoId: barbero.id, servicioId: servicio.id, fecha: DIA_DESCANSO });
            expect(res.body.data).toEqual([]);
        });

        test("una fecha pasada no tiene horas disponibles", async () => {
            const ayer = sumarDias(hoyEnZona(), -1);
            await Horario.create({ barberoId: barbero.id, fecha: ayer, horaInicio: "08:00", horaFin: "12:00", estado: "Activo" });
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: barbero.id, servicioId: servicio.id, fecha: ayer });
            expect(horas).toEqual([]);
        });

        test("hoy solo ofrece horas posteriores a la hora actual", async () => {
            const hoy = hoyEnZona();
            await Horario.create({ barberoId: barbero.id, fecha: hoy, horaInicio: "08:00", horaFin: "12:00", estado: "Activo" });

            const relojOriginal = reservaService.reloj;
            reservaService.reloj = () => ({ fecha: hoy, minutos: 10 * 60 + 5 }); // 10:05
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: barbero.id, servicioId: servicio.id, fecha: hoy });
            reservaService.reloj = relojOriginal;

            expect(horas).toEqual(["10:15", "10:30", "10:45", "11:00", "11:15", "11:30"]);
        });

        test("rechaza un barbero inactivo", async () => {
            const res = await request(app)
                .get("/api/publico/horas-disponibles")
                .query({ barberoId: barberoInactivo.id, servicioId: servicio.id, fecha: MANANA });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/inactivo/i);
        });

        test("días disponibles marca turnos activos, descansos y días sin turno", async () => {
            const res = await request(app)
                .get("/api/publico/dias-disponibles")
                .query({ barberoId: barbero.id, servicioId: servicio.id, desde: MANANA, hasta: sumarDias(MANANA, 3) });
            expect(res.status).toBe(200);
            const porFecha = Object.fromEntries(res.body.data.map((d) => [d.fecha, d]));
            expect(porFecha[MANANA].horasDisponibles).toBeGreaterThan(0);
            expect(porFecha[DIA_DESCANSO].estado).toBe("Descanso");
            expect(porFecha[DIA_DESCANSO].horasDisponibles).toBe(0);
            expect(porFecha[sumarDias(MANANA, 3)].estado).toBe("SinTurno");
        });

        test("días disponibles rechaza rangos mayores a 62 días", async () => {
            const res = await request(app)
                .get("/api/publico/dias-disponibles")
                .query({ barberoId: barbero.id, servicioId: servicio.id, desde: MANANA, hasta: sumarDias(MANANA, 90) });
            expect(res.status).toBe(400);
        });
    });

    describe("registro de reservas", () => {
        let codigo;

        test("crea la reserva, registra al cliente nuevo y devuelve un código", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                ...datosCliente,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: MANANA,
                hora: "09:00",
            });

            expect(res.status).toBe(201);
            expect(res.body.data.codigo).toMatch(/^BR-[A-Z0-9]{6}$/);
            expect(res.body.data.estado).toBe("Pendiente");
            codigo = res.body.data.codigo;

            const cliente = await Cliente.findOne({ where: { telefono: datosCliente.telefono } });
            expect(cliente.correo).toBe("laura.gomez@correo.com");

            const reserva = await Reserva.findOne({ where: { codigo } });
            expect(reserva.origen).toBe("web");
        });

        test("la hora reservada desaparece de la disponibilidad", async () => {
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: barbero.id, servicioId: servicio.id, fecha: MANANA });
            expect(horas).not.toContain("09:00");
        });

        test("rechaza una reserva que se cruza con otra del mismo barbero", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                nombre: "Otro Cliente",
                telefono: "3201234567",
                correo: "otro@test.com",
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: MANANA,
                hora: "09:15",
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/ya existe una reserva/i);
            // No debe quedar un cliente huérfano creado a medias.
            expect(await Cliente.count({ where: { telefono: "3201234567" } })).toBe(0);
        });

        test("rechaza que el mismo cliente reserve dos citas que se cruzan (duplicado)", async () => {
            const otroBarbero = await Barbero.create({
                nombre: "Segundo Barbero", especialidad: "Corte", telefono: "3001112299",
                correo: "segundo@test.com", estado: "Activo",
            });
            await Horario.create({ barberoId: otroBarbero.id, fecha: MANANA, horaInicio: "08:00", horaFin: "12:00", estado: "Activo" });

            const res = await request(app).post("/api/publico/reservas").send({
                ...datosCliente,
                barberoId: otroBarbero.id,
                servicioId: servicio.id,
                fecha: MANANA,
                hora: "09:00",
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cliente ya tiene otra reserva/i);
        });

        test("reutiliza un cliente existente cuando teléfono y correo coinciden", async () => {
            const antes = await Cliente.count();
            const res = await request(app).post("/api/publico/reservas").send({
                nombre: "Cliente Existente",
                telefono: clienteExistente.telefono,
                correo: "EXISTENTE@test.com",
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: MANANA,
                hora: "10:00",
            });
            expect(res.status).toBe(201);
            expect(await Cliente.count()).toBe(antes);
        });

        test("rechaza datos de contacto que no coinciden con un cliente registrado", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                nombre: "Suplantador",
                telefono: clienteExistente.telefono,
                correo: "distinto@test.com",
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: PASADO_MANANA,
                hora: "08:00",
            });
            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/no coinciden/i);
        });

        test.each([
            [{ nombre: "" }, /nombre es obligatorio/i],
            [{ nombre: "Al" }, /mínimo 3/i],
            [{ telefono: "123" }, /10 dígitos/i],
            [{ correo: "no-es-correo" }, /correo electrónico válido/i],
            [{ fecha: "19-11-2026" }, /AAAA-MM-DD/],
            [{ hora: "25:00" }, /HH:MM/],
            [{ servicioId: undefined }, /seleccionar un servicio/i],
        ])("valida los datos en el servidor: %o", async (cambio, mensaje) => {
            const res = await request(app).post("/api/publico/reservas").send({
                ...datosCliente,
                telefono: "3157778899",
                correo: "valida@test.com",
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: PASADO_MANANA,
                hora: "11:00",
                ...cambio,
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(mensaje);
        });

        test("rechaza reservas en horarios pasados", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                ...datosCliente,
                barberoId: barbero.id,
                servicioId: servicio.id,
                fecha: sumarDias(hoyEnZona(), -1),
                hora: "09:00",
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/ya pasó/i);
        });

        test("rechaza un servicio inactivo y un día de descanso", async () => {
            const inactivo = await request(app).post("/api/publico/reservas").send({
                ...datosCliente, barberoId: barbero.id, servicioId: servicioInactivo.id, fecha: PASADO_MANANA, hora: "08:00",
            });
            expect(inactivo.status).toBe(400);
            expect(inactivo.body.message).toMatch(/inactivo/i);

            const descanso = await request(app).post("/api/publico/reservas").send({
                ...datosCliente, barberoId: barbero.id, servicioId: servicio.id, fecha: DIA_DESCANSO, hora: "08:00",
            });
            expect(descanso.status).toBe(400);
            expect(descanso.body.message).toMatch(/no se encuentra disponible/i);
        });

        test("rechaza una hora cuyo servicio terminaría después del turno", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                ...datosCliente, barberoId: barbero.id, servicioId: servicio.id, fecha: PASADO_MANANA, hora: "11:45",
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/fuera del turno/i);
        });

        describe("consulta y cancelación", () => {
            test("consulta exige código y correo correctos", async () => {
                const malo = await request(app).post("/api/publico/reservas/consultar").send({ codigo, correo: "otro@test.com" });
                expect(malo.status).toBe(404);

                const formato = await request(app).post("/api/publico/reservas/consultar").send({ codigo: "123", correo: datosCliente.correo });
                expect(formato.status).toBe(400);

                const bueno = await request(app)
                    .post("/api/publico/reservas/consultar")
                    .send({ codigo: codigo.toLowerCase(), correo: datosCliente.correo.toUpperCase() });
                expect(bueno.status).toBe(200);
                expect(bueno.body.data.estado).toBe("Pendiente");
                expect(bueno.body.data.barbero.nombre).toBe("Barbero Portal");
                // No expone datos internos del cliente ni identificadores.
                expect(bueno.body.data.cliente.correo).toBeUndefined();
                expect(bueno.body.data.id).toBeUndefined();
            });

            test("cancelar libera el horario de inmediato", async () => {
                const res = await request(app).post("/api/publico/reservas/cancelar").send({ codigo, correo: datosCliente.correo });
                expect(res.status).toBe(200);
                expect(res.body.data.estado).toBe("Cancelada");

                const horas = await reservaService.obtenerHorasDisponibles({ barberoId: barbero.id, servicioId: servicio.id, fecha: MANANA });
                expect(horas).toContain("09:00");
            });

            test("no permite cancelar dos veces", async () => {
                const res = await request(app).post("/api/publico/reservas/cancelar").send({ codigo, correo: datosCliente.correo });
                expect(res.status).toBe(409);
            });

            test("otra persona puede reservar el horario liberado", async () => {
                const res = await request(app).post("/api/publico/reservas").send({
                    nombre: "Nuevo Cliente",
                    telefono: "3204445566",
                    correo: "nuevo@test.com",
                    barberoId: barbero.id,
                    servicioId: servicio.id,
                    fecha: MANANA,
                    hora: "09:00",
                });
                expect(res.status).toBe(201);
            });

            test("una reserva cancelada no puede avanzar de estado", async () => {
                const reserva = await Reserva.findOne({ where: { codigo } });
                await expect(
                    reservaService.actualizar(reserva.id, { estado: "En proceso" }, { rol: "barbero", barberoId: barbero.id })
                ).rejects.toThrow(/cancelada/i);
            });
        });
    });

    describe("concurrencia", () => {
        test("de varias solicitudes simultáneas para el mismo horario solo una se confirma", async () => {
            const solicitudes = Array.from({ length: 6 }, (_, i) =>
                request(app).post("/api/publico/reservas").send({
                    nombre: `Cliente Concurrente ${i}`,
                    telefono: `350000000${i}`,
                    correo: `concurrente${i}@test.com`,
                    barberoId: barbero.id,
                    servicioId: servicio.id,
                    fecha: PASADO_MANANA,
                    hora: "10:00",
                })
            );

            const respuestas = await Promise.all(solicitudes);
            const exitosas = respuestas.filter((r) => r.status === 201);
            expect(exitosas).toHaveLength(1);

            const enBD = await Reserva.count({
                where: { barberoId: barbero.id, fecha: PASADO_MANANA, hora: "10:00", estado: "Pendiente" },
            });
            expect(enBD).toBe(1);
        });

        test("la base de datos también rechaza cruces de horario (restricción EXCLUDE)", async () => {
            expect(restriccionBD).toBe(true);

            const cliente = await Cliente.findOne({ where: { telefono: "3204445566" } });

            // Se salta el servicio a propósito: inserción directa en la tabla.
            await expect(
                Reserva.create({
                    clienteId: cliente.id, barberoId: barbero.id, servicioId: servicio.id,
                    fecha: PASADO_MANANA, hora: "10:15", duracion: 30, estado: "Pendiente",
                })
            ).rejects.toThrow();

            // Una reserva cancelada no ocupa el horario.
            const cancelada = await Reserva.create({
                clienteId: cliente.id, barberoId: barbero.id, servicioId: servicio.id,
                fecha: PASADO_MANANA, hora: "10:15", duracion: 30, estado: "Cancelada",
            });
            expect(cancelada.id).toBeDefined();
        });

        test("la base de datos rechaza duraciones no positivas", async () => {
            const cliente = await Cliente.findOne({ where: { telefono: "3204445566" } });
            await expect(
                Reserva.create({
                    clienteId: cliente.id, barberoId: barbero.id, servicioId: servicio.id,
                    fecha: PASADO_MANANA, hora: "11:30", duracion: 0, estado: "Pendiente",
                })
            ).rejects.toThrow();
        });
    });

    describe("horarios laborales y reservas activas", () => {
        test("no permite pasar a Descanso un día con reservas activas", async () => {
            const horario = await Horario.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA } });
            await expect(
                horarioService.actualizar(horario.id, { estado: "Descanso" })
            ).rejects.toThrow(/quedarían por fuera/i);
        });

        test("no permite recortar el turno si deja una reserva por fuera", async () => {
            const horario = await Horario.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA } });
            await expect(
                horarioService.actualizar(horario.id, { horaInicio: "08:00", horaFin: "10:00" })
            ).rejects.toThrow(/quedarían por fuera/i);
        });

        test("sí permite ampliar el turno", async () => {
            const horario = await Horario.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA } });
            const actualizado = await horarioService.actualizar(horario.id, { horaInicio: "07:00", horaFin: "13:00" });
            expect(actualizado.horaFin.slice(0, 5)).toBe("13:00");
        });

        test("no permite eliminar un turno con reservas activas", async () => {
            const horario = await Horario.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA } });
            await expect(horarioService.eliminar(horario.id)).rejects.toThrow(/quedarían por fuera/i);
        });
    });

    describe("cancelación desde el panel", () => {
        test("el administrador cancela una reserva Pendiente y conserva el registro", async () => {
            const reserva = await Reserva.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA, estado: "Pendiente" } });
            const cancelada = await reservaService.cancelar(reserva.id);
            expect(cancelada.estado).toBe("Cancelada");
            expect(cancelada.canceladaEn).toBeTruthy();
            expect(await Reserva.findByPk(reserva.id)).not.toBeNull();
        });

        test("no se puede cancelar mediante la edición general", async () => {
            const cliente = await Cliente.findOne({ where: { telefono: "3204445566" } });
            const reserva = await reservaService.crear({
                clienteId: cliente.id, barberoId: barbero.id, servicioId: servicio.id, fecha: PASADO_MANANA, hora: "08:00",
            });
            await expect(
                reservaService.actualizar(reserva.id, { estado: "Cancelada" }, { rol: "admin" })
            ).rejects.toThrow(/acción Cancelar/i);
        });

        test("al editar, la hora propia de la reserva sigue disponible", async () => {
            const reserva = await Reserva.findOne({ where: { barberoId: barbero.id, fecha: PASADO_MANANA, hora: "08:00" } });
            const horas = await reservaService.obtenerHorasDisponibles({
                barberoId: barbero.id, servicioId: servicio.id, fecha: PASADO_MANANA, excluirReservaId: reserva.id,
            });
            expect(horas).toContain("08:00");
        });
    });
});

describe("Limitador de solicitudes del portal", () => {
    test("responde 429 al superar el máximo", () => {
        const anterior = process.env.DESACTIVAR_LIMITE;
        process.env.DESACTIVAR_LIMITE = "false";

        const middleware = limitarSolicitudes({ ventanaMs: 60000, maximo: 2 });
        const estados = [];
        for (let i = 0; i < 3; i++) {
            const res = {
                statusCode: 200,
                set() { return this; },
                status(code) { this.statusCode = code; return this; },
                json() { estados.push(this.statusCode); return this; },
            };
            middleware({ ip: "1.2.3.4" }, res, () => estados.push(200));
        }

        process.env.DESACTIVAR_LIMITE = anterior;
        expect(estados).toEqual([200, 200, 429]);
    });
});
