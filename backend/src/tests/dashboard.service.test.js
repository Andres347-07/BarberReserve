const sequelize = require("../database/connection");
const { Barbero, Cliente, Servicio } = require("../models");
const dashboardService = require("../services/dashboard.service");
const horarioService = require("../services/horario.service");
const reservaService = require("../services/reserva.service");

// El dashboard calcula "hoy" en la zona horaria de la barbería
// (APP_TIMEZONE, por defecto America/Bogota), no en UTC.
const { hoyEnZona } = require("../utils/fechaHora");
function hoyISO() {
    return hoyEnZona();
}

describe("dashboard.service — resumen del administrador y del barbero", () => {
    let barberoActivo, barberoInactivo, cliente, servicioActivo, servicioInactivo;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        barberoActivo = await Barbero.create({
            nombre: "Barbero Dashboard Activo",
            especialidad: "Fade",
            telefono: "3120000000",
            correo: "activo.dashboard-test@test.com",
            estado: "Activo",
        });

        barberoInactivo = await Barbero.create({
            nombre: "Barbero Dashboard Inactivo",
            especialidad: "Barba",
            telefono: "3130000000",
            correo: "inactivo.dashboard-test@test.com",
            estado: "Inactivo",
        });

        cliente = await Cliente.create({
            nombre: "Cliente Dashboard Test",
            telefono: "3261111111",
            correo: "cliente.dashboard-test@test.com",
        });

        servicioActivo = await Servicio.create({
            nombre: "Servicio Dashboard Activo",
            descripcion: "Servicio de prueba",
            duracion: 30,
            precio: 20000,
            estado: "Activo",
        });

        servicioInactivo = await Servicio.create({
            nombre: "Servicio Dashboard Inactivo",
            descripcion: "Servicio de prueba",
            duracion: 30,
            precio: 20000,
            estado: "Inactivo",
        });

        await horarioService.crear({
            barberoId: barberoActivo.id,
            fecha: hoyISO(),
            horaInicio: "08:00",
            horaFin: "18:00",
            estado: "Activo",
        });

        // La regla "no reservar en el pasado" rechazaría las 09:00 de hoy si la
        // prueba corre después de esa hora; se fija el reloj al inicio del día.
        const relojOriginal = reservaService.reloj;
        reservaService.reloj = () => ({ fecha: hoyISO(), minutos: 0 });

        await reservaService.crear({
            clienteId: cliente.id,
            barberoId: barberoActivo.id,
            servicioId: servicioActivo.id,
            fecha: hoyISO(),
            hora: "09:00",
        });

        reservaService.reloj = relojOriginal;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("resumenAdmin cuenta correctamente barberos y servicios activos por separado del total", async () => {
        const resumen = await dashboardService.resumenAdmin();

        expect(resumen.totalBarberos).toBe(2);
        expect(resumen.barberosActivos).toBe(1);
        expect(resumen.totalServicios).toBe(2);
        expect(resumen.serviciosActivos).toBe(1);
        expect(resumen.reservasHoy).toBe(1);
        expect(resumen.reservasPendientes).toBe(1);
    });

    test("resumenAdmin incluye un feed de actividad reciente no vacío", async () => {
        const resumen = await dashboardService.resumenAdmin();

        expect(Array.isArray(resumen.actividadReciente)).toBe(true);
        expect(resumen.actividadReciente.length).toBeGreaterThan(0);
        expect(resumen.actividadReciente[0]).toHaveProperty("mensaje");
    });

    test("resumenBarbero identifica correctamente la próxima cita", async () => {
        const resumen = await dashboardService.resumenBarbero(barberoActivo.id);

        expect(resumen.reservasHoy).toBe(1);
        expect(resumen.proximaCita).not.toBeNull();
        expect(resumen.proximaCita.cliente).toBe("Cliente Dashboard Test");
    });

    test("resumenBarbero de un barbero sin reservas no falla y no tiene próxima cita", async () => {
        const resumen = await dashboardService.resumenBarbero(barberoInactivo.id);

        expect(resumen.totalReservas).toBe(0);
        expect(resumen.proximaCita).toBeNull();
    });
});
