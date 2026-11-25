process.env.DESACTIVAR_LIMITE = "true";

const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../app");
const sequelize = require("../database/connection");
const { aplicarMigraciones } = require("../database/migraciones");
const { Servicio, Reserva, Cliente, Usuario, Notificacion, Bloqueo } = require("../models");
const reservaService = require("../services/reserva.service");
const horarioService = require("../services/horario.service");
const barberoService = require("../services/barbero.service");
const configuracionService = require("../services/configuracion.service");
const { hoyEnZona, sumarDias } = require("../utils/fechaHora");
const { diaSemanaISO } = require("../services/jornada.service");

// Próximo lunes con al menos 7 días de margen (dentro de los 30 días de reserva en línea).
function proximoLunes() {
    let f = sumarDias(hoyEnZona(), 7);
    while (diaSemanaISO(f) !== 1) f = sumarDias(f, 1);
    return f;
}

const LUNES = proximoLunes();
const MARTES = sumarDias(LUNES, 1);

const plantillaPartida = (dias = [1]) => [1, 2, 3, 4, 5, 6, 7].map((d) => (
    dias.includes(d)
        ? { diaSemana: d, estado: "Activo", horaInicio: "07:00", horaFin: "18:00", pausaInicio: "12:00", pausaFin: "14:00" }
        : { diaSemana: d, estado: "Descanso" }
));

describe("Lógica de barbería 2.1", () => {
    let andres, esteban, carlos, corte, barba, cliente, admin;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        await aplicarMigraciones(sequelize, { silencioso: true });
        await configuracionService.obtener(); // valores por defecto: 15 min, 5 min de limpieza

        corte = await Servicio.create({ nombre: "Corte clásico", descripcion: "x", duracion: 30, precio: 25000, estado: "Activo" });
        barba = await Servicio.create({ nombre: "Arreglo de barba", descripcion: "x", duracion: 30, precio: 18000, estado: "Activo" });

        andres = (await barberoService.crear({ nombre: "Andrés Camargo", especialidad: "Fade", telefono: "3001110001", correo: "andres@t.com" })).barbero;
        esteban = (await barberoService.crear({ nombre: "Esteban Tamayo", especialidad: "Barba", telefono: "3001110002", correo: "esteban@t.com", servicios: [barba.id] })).barbero;
        carlos = (await barberoService.crear({ nombre: "Carlos Ruiz", especialidad: "Clásico", telefono: "3001110003", correo: "carlos@t.com" })).barbero;

        admin = await Usuario.create({ nombre: "Admin", email: "admin@t.com", password: await bcrypt.hash("Admin123*", 4), rol: "admin" });
        cliente = await Cliente.create({ nombre: "Juan Pérez", telefono: "3150000001", correo: "juan@t.com" });

        for (const b of [andres, esteban, carlos]) {
            await horarioService.guardarPlantilla(b.id, plantillaPartida([1, 2]));
        }
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe("plantilla semanal y horario partido", () => {
        test("no ofrece cupos durante la pausa del almuerzo", async () => {
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: LUNES });
            expect(horas[0]).toBe("07:00");
            expect(horas).toContain("11:30");
            ["11:45", "12:00", "13:00", "13:45"].forEach((h) => expect(horas).not.toContain(h));
            expect(horas).toContain("14:00");
            expect(horas[horas.length - 1]).toBe("17:30");
        });

        test("rechaza una cita que cruza la pausa, con un mensaje claro", async () => {
            await expect(reservaService.crear({
                clienteId: cliente.id, barberoId: andres.id, servicioId: corte.id, fecha: LUNES, hora: "11:45",
            })).rejects.toThrow(/cruza la pausa del barbero \(12:00 a 14:00\)/);
        });

        test("un día de descanso en la plantilla no tiene cupos", async () => {
            const miercoles = sumarDias(LUNES, 2);
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: miercoles });
            expect(horas).toEqual([]);
        });

        test("valida que la pausa quede dentro del turno", async () => {
            const dias = plantillaPartida([1]);
            dias[0] = { ...dias[0], pausaInicio: "06:00", pausaFin: "07:30" };
            await expect(horarioService.guardarPlantilla(andres.id, dias)).rejects.toThrow(/Lunes: La pausa debe quedar dentro del turno/);
        });

        test("calcula las horas semanales y advierte si superan el tope legal de 42", async () => {
            const seisDias = await horarioService.guardarPlantilla(carlos.id, plantillaPartida([1, 2, 3, 4, 5, 6]));
            expect(seisDias.horasSemanales).toBe(54); // 9 h efectivas x 6 días
            expect(seisDias.advertencia).toMatch(/supera el tope de 42 horas/);

            const dosDias = await horarioService.guardarPlantilla(carlos.id, plantillaPartida([1, 2]));
            expect(dosDias.horasSemanales).toBe(18);
            expect(dosDias.advertencia).toBeUndefined();
        });

        test("una excepción por fecha tiene prioridad sobre la plantilla", async () => {
            const festivo = await horarioService.crear({ barberoId: andres.id, fecha: MARTES, estado: "Descanso", motivo: "Festivo" });
            expect(await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: MARTES })).toEqual([]);

            await horarioService.eliminar(festivo.id); // vuelve a regir la plantilla
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: MARTES });
            expect(horas[0]).toBe("07:00");
        });
    });

    describe("limpieza entre clientes", () => {
        test("deja 5 minutos libres después de cada servicio", async () => {
            await reservaService.crear({ clienteId: cliente.id, barberoId: andres.id, servicioId: corte.id, fecha: LUNES, hora: "09:00" });

            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: LUNES });
            expect(horas).not.toContain("09:30"); // 09:00-09:30 + limpieza hasta 09:35
            expect(horas).toContain("09:45");
            expect(horas).not.toContain("08:30"); // 08:30-09:00 + limpieza chocaría con la cita de las 09:00
            expect(horas).toContain("08:15");

            const otro = await Cliente.create({ nombre: "Pedro Gómez", telefono: "3150000002", correo: "pedro@t.com" });
            await expect(reservaService.crear({
                clienteId: otro.id, barberoId: andres.id, servicioId: corte.id, fecha: LUNES, hora: "09:30",
            })).rejects.toThrow(/ya existe una reserva/i);
        });

        test("la base de datos también reserva los minutos de limpieza (EXCLUDE)", async () => {
            await expect(Reserva.create({
                clienteId: cliente.id, barberoId: andres.id, servicioId: corte.id,
                fecha: LUNES, hora: "09:32", duracion: 30, limpieza: 5, estado: "Pendiente",
            })).rejects.toThrow();
        });
    });

    describe("bloqueos de tiempo", () => {
        test("un bloqueo quita esos cupos y los vecinos que no caben", async () => {
            await horarioService.crearBloqueo({ barberoId: andres.id, fecha: LUNES, horaInicio: "15:00", horaFin: "16:00", motivo: "Diligencia" }, { rol: "admin" });
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: andres.id, servicioId: corte.id, fecha: LUNES });
            expect(horas).toContain("14:15");
            expect(horas).not.toContain("14:30"); // terminaría 15:00 + limpieza 15:05
            expect(horas).not.toContain("15:30");
            expect(horas).toContain("16:00");
        });

        test("no se puede bloquear encima de una cita", async () => {
            await expect(horarioService.crearBloqueo(
                { barberoId: andres.id, fecha: LUNES, horaInicio: "08:50", horaFin: "09:10" }, { rol: "admin" }
            )).rejects.toThrow(/hay citas a las 09:00/);
        });

        test("el barbero bloquea solo su agenda y no puede borrar bloqueos ajenos", async () => {
            const propio = await horarioService.crearBloqueo(
                { barberoId: andres.id, fecha: MARTES, horaInicio: "08:00", horaFin: "08:30" },
                { rol: "barbero", barberoId: esteban.id }
            );
            expect(propio.barberoId).toBe(esteban.id); // se ignora el barberoId enviado

            const ajeno = await Bloqueo.findOne({ where: { barberoId: andres.id } });
            await expect(horarioService.eliminarBloqueo(ajeno.id, { rol: "barbero", barberoId: esteban.id }))
                .rejects.toMatchObject({ status: 403 });
        });
    });

    describe("servicios por barbero", () => {
        test("un barbero solo ofrece los servicios que realiza", async () => {
            expect(await reservaService.obtenerHorasDisponibles({ barberoId: esteban.id, servicioId: corte.id, fecha: LUNES })).toEqual([]);
            await expect(reservaService.crear({
                clienteId: cliente.id, barberoId: esteban.id, servicioId: corte.id, fecha: LUNES, hora: "10:00",
            })).rejects.toThrow(/no realiza este servicio/);
        });

        test("el portal informa qué servicios hace cada barbero", async () => {
            const res = await request(app).get("/api/publico/barberos");
            const e = res.body.data.find((b) => b.id === esteban.id);
            const a = res.body.data.find((b) => b.id === andres.id);
            expect(e.servicios).toEqual([barba.id]);
            expect(a.servicios).toEqual([]); // sin asignación = todos los servicios
        });
    });

    describe("\"Cualquier barbero disponible\"", () => {
        test("las horas son la unión de los barberos que hacen el servicio", async () => {
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: "cualquiera", servicioId: corte.id, fecha: LUNES });
            // 09:30 está ocupado para Andrés, pero libre para Carlos.
            expect(horas).toContain("09:30");
        });

        test("asigna la cita al barbero libre con menos citas ese día y notifica", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                nombre: "Laura Méndez", telefono: "3104567890", correo: "laura@t.com",
                barberoId: "cualquiera", servicioId: corte.id, fecha: LUNES, hora: "10:00",
            });
            expect(res.status).toBe(201);
            expect(res.body.data.barbero.nombre).toBe("Carlos Ruiz"); // Andrés ya tiene una cita ese día

            const reserva = await Reserva.findOne({ where: { codigo: res.body.data.codigo } });
            const usuarioCarlos = await Usuario.findOne({ where: { barberoId: carlos.id } });
            const paraCarlos = await Notificacion.count({ where: { reservaId: reserva.id, usuarioId: usuarioCarlos.id } });
            const paraAdmin = await Notificacion.count({ where: { reservaId: reserva.id, usuarioId: admin.id } });
            const usuarioAndres = await Usuario.findOne({ where: { barberoId: andres.id } });
            const paraAndres = await Notificacion.count({ where: { reservaId: reserva.id, usuarioId: usuarioAndres.id } });
            expect([paraCarlos, paraAdmin, paraAndres]).toEqual([1, 1, 0]);
        });
    });

    describe("reglas de la reserva en línea", () => {
        afterEach(() => { reservaService.reloj = require("../utils/fechaHora").ahoraEnZona; });

        test("exige anticipación mínima de 60 minutos y máximo 30 días", async () => {
            reservaService.reloj = () => ({ fecha: LUNES, minutos: 7 * 60 }); // son las 07:00 del lunes
            const publicas = await reservaService.obtenerHorasDisponibles({ barberoId: carlos.id, servicioId: corte.id, fecha: LUNES, publico: true });
            expect(publicas[0]).toBe("08:15"); // 07:00 + 60 min
            const internas = await reservaService.obtenerHorasDisponibles({ barberoId: carlos.id, servicioId: corte.id, fecha: LUNES });
            expect(internas[0]).toBe("07:15"); // el panel puede agendar ya mismo

            const lejos = sumarDias(LUNES, 35);
            expect(await reservaService.obtenerHorasDisponibles({ barberoId: carlos.id, servicioId: corte.id, fecha: lejos, publico: true })).toEqual([]);
        });

        test("el cliente solo cancela en línea hasta 2 horas antes", async () => {
            const res = await request(app).post("/api/publico/reservas").send({
                nombre: "Laura Méndez", telefono: "3104567890", correo: "laura@t.com",
                barberoId: carlos.id, servicioId: corte.id, fecha: MARTES, hora: "15:00",
            });
            expect(res.status).toBe(201);
            const { codigo } = res.body.data;

            reservaService.reloj = () => ({ fecha: MARTES, minutos: 14 * 60 }); // 1 hora antes
            const tarde = await request(app).post("/api/publico/reservas/cancelar").send({ codigo, correo: "laura@t.com" });
            expect(tarde.status).toBe(409);
            expect(tarde.body.message).toMatch(/hasta 2 horas antes/);

            reservaService.reloj = () => ({ fecha: MARTES, minutos: 12 * 60 }); // 3 horas antes
            const aTiempo = await request(app).post("/api/publico/reservas/cancelar").send({ codigo, correo: "laura@t.com" });
            expect(aTiempo.status).toBe(200);
            expect(aTiempo.body.data.estado).toBe("Cancelada");
        });
    });

    describe("estados de la cita", () => {
        let reserva;

        beforeAll(async () => {
            reserva = await reservaService.crear({ clienteId: cliente.id, barberoId: carlos.id, servicioId: corte.id, fecha: MARTES, hora: "16:00" });
        });

        afterEach(() => { reservaService.reloj = require("../utils/fechaHora").ahoraEnZona; });

        test("No asistió solo después de 15 minutos de tolerancia y libera el cupo", async () => {
            const barbero = { rol: "barbero", barberoId: carlos.id };

            reservaService.reloj = () => ({ fecha: MARTES, minutos: 16 * 60 + 10 });
            await expect(reservaService.actualizar(reserva.id, { estado: "No asistió" }, barbero)).rejects.toThrow(/15 minutos después/);

            reservaService.reloj = () => ({ fecha: MARTES, minutos: 16 * 60 + 16 });
            const r = await reservaService.actualizar(reserva.id, { estado: "No asistió" }, barbero);
            expect(r.estado).toBe("No asistió");

            reservaService.reloj = () => ({ fecha: MARTES, minutos: 8 * 60 });
            const horas = await reservaService.obtenerHorasDisponibles({ barberoId: carlos.id, servicioId: corte.id, fecha: MARTES });
            expect(horas).toContain("16:00");
        });

        test("flujo completo: Pendiente → En espera → En proceso → Finalizada (también desde el administrador)", async () => {
            const r = await reservaService.crear({ clienteId: cliente.id, barberoId: carlos.id, servicioId: corte.id, fecha: MARTES, hora: "17:00" });
            await reservaService.actualizar(r.id, { estado: "En espera" }, { rol: "admin" });
            await expect(reservaService.actualizar(r.id, { estado: "No asistió" }, { rol: "admin" })).rejects.toThrow(/no es posible cambiar/i);
            await reservaService.actualizar(r.id, { estado: "En proceso" }, { rol: "barbero", barberoId: carlos.id });
            const fin = await reservaService.actualizar(r.id, { estado: "Finalizada" }, { rol: "barbero", barberoId: carlos.id });
            expect(fin.estado).toBe("Finalizada");
        });
    });

    describe("cambios de plantilla con citas futuras", () => {
        test("no deja citas activas por fuera del nuevo horario", async () => {
            // Andrés tiene una cita el lunes a las 09:00: no puede pasar a trabajar solo en la tarde.
            const dias = plantillaPartida([1, 2]);
            dias[0] = { diaSemana: 1, estado: "Activo", horaInicio: "13:00", horaFin: "19:00" };
            await expect(horarioService.guardarPlantilla(andres.id, dias)).rejects.toThrow(/dejaría por fuera 1 reserva/);
        });
    });

    describe("configuración del negocio", () => {
        test("valida los rangos permitidos", async () => {
            await expect(configuracionService.actualizar({ intervaloCupos: 7 })).rejects.toThrow(/intervalo de cupos/);
            await expect(configuracionService.actualizar({ minutosLimpieza: 90 })).rejects.toThrow(/entre 0 y 30/);
            const c = await configuracionService.actualizar({ minutosLimpieza: 10 });
            expect(c.minutosLimpieza).toBe(10);
            await configuracionService.actualizar({ minutosLimpieza: 5 });
        });
    });
});
