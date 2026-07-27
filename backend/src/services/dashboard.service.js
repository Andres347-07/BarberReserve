const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}


function mensajeActividad(tipo, registro) {
    switch (tipo) {
        case "cliente": return `Cliente registrado: ${registro.nombre}`;
        case "barbero": return `Nuevo barbero agregado: ${registro.nombre}`;
        case "servicio": return `Servicio creado: ${registro.nombre}`;
        case "reserva_creada": return `Reserva creada para ${registro.fecha} a las ${registro.hora?.slice(0, 5)}`;
        case "reserva_finalizada": return `Reserva finalizada (${registro.fecha} ${registro.hora?.slice(0, 5)})`;
        default: return "";
    }
}

class DashboardService {

    
    async resumenAdmin() {
        const hoy = hoyISO();

        const [
            totalClientes,
            totalBarberos,
            barberosActivos,
            totalServicios,
            serviciosActivos,
            reservas,
        ] = await Promise.all([
            Cliente.count(),
            Barbero.count(),
            Barbero.count({ where: { estado: "Activo" } }),
            Servicio.count(),
            Servicio.count({ where: { estado: "Activo" } }),
            Reserva.findAll({
                include: [
                    { model: Servicio, as: "servicio", attributes: ["id", "nombre"] },
                    { model: Barbero, as: "barbero", attributes: ["id", "nombre"] },
                ],
            }),
        ]);

        const porEstado = { Pendiente: 0, "En proceso": 0, Finalizada: 0 };
        const porServicio = {};
        const porBarbero = {};
        let reservasHoy = 0;

        for (const r of reservas) {
            porEstado[r.estado] = (porEstado[r.estado] || 0) + 1;
            if (r.fecha === hoy) reservasHoy += 1;

            const nombreServicio = r.servicio?.nombre || "Sin servicio";
            porServicio[nombreServicio] = (porServicio[nombreServicio] || 0) + 1;

            const nombreBarbero = r.barbero?.nombre || "Sin barbero";
            porBarbero[nombreBarbero] = (porBarbero[nombreBarbero] || 0) + 1;
        }

        const actividadReciente = await this._obtenerActividadReciente();

        return {
            totalReservas: reservas.length,
            totalClientes,
            totalBarberos,
            barberosActivos,
            totalServicios,
            serviciosActivos,
            reservasHoy,
            reservasPendientes: porEstado["Pendiente"],
            reservasEnProceso: porEstado["En proceso"],
            reservasFinalizadas: porEstado["Finalizada"],
            reservasPorEstado: porEstado,
            reservasPorServicio: porServicio,
            reservasPorBarbero: porBarbero,
            actividadReciente,
        };
    }

    async _obtenerActividadReciente(limite = 8) {
        const [clientes, barberos, servicios, reservas] = await Promise.all([
            Cliente.findAll({ order: [["createdAt", "DESC"]], limit: limite }),
            Barbero.findAll({ order: [["createdAt", "DESC"]], limit: limite }),
            Servicio.findAll({ order: [["createdAt", "DESC"]], limit: limite }),
            Reserva.findAll({ order: [["updatedAt", "DESC"]], limit: limite }),
        ]);

        const eventos = [
            ...clientes.map((c) => ({ tipo: "cliente", fecha: c.createdAt, mensaje: mensajeActividad("cliente", c) })),
            ...barberos.map((b) => ({ tipo: "barbero", fecha: b.createdAt, mensaje: mensajeActividad("barbero", b) })),
            ...servicios.map((s) => ({ tipo: "servicio", fecha: s.createdAt, mensaje: mensajeActividad("servicio", s) })),
            ...reservas.map((r) => ({
                tipo: r.estado === "Finalizada" ? "reserva_finalizada" : "reserva_creada",
                fecha: r.updatedAt,
                mensaje: mensajeActividad(r.estado === "Finalizada" ? "reserva_finalizada" : "reserva_creada", r),
            })),
        ];

        return eventos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, limite);
    }

    
    async resumenBarbero(barberoId) {
        const hoy = hoyISO();

        const reservas = await Reserva.findAll({
            where: { barberoId },
            include: [
                { model: Servicio, as: "servicio", attributes: ["id", "nombre"] },
                { model: Cliente, as: "cliente", attributes: ["id", "nombre"] },
            ],
            order: [["fecha", "ASC"], ["hora", "ASC"]],
        });

        const porEstado = { Pendiente: 0, "En proceso": 0, Finalizada: 0 };
        let reservasHoy = 0;
        let proximaCita = null;

        for (const r of reservas) {
            porEstado[r.estado] = (porEstado[r.estado] || 0) + 1;
            if (r.fecha === hoy) reservasHoy += 1;

            if (!proximaCita && r.fecha >= hoy && r.estado !== "Finalizada") {
                proximaCita = {
                    fecha: r.fecha,
                    hora: r.hora,
                    cliente: r.cliente?.nombre,
                    servicio: r.servicio?.nombre,
                };
            }
        }

        return {
            totalReservas: reservas.length,
            reservasHoy,
            reservasPendientes: porEstado["Pendiente"],
            reservasEnProceso: porEstado["En proceso"],
            reservasFinalizadas: porEstado["Finalizada"],
            reservasPorEstado: porEstado,
            proximaCita,
        };
    }
}

module.exports = new DashboardService();
