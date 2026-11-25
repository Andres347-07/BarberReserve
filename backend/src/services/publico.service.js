const { fn, col, where: sqlWhere } = require("sequelize");

const sequelize = require("../database/connection");
const Reserva = require("../models/Reserva");
const Cliente = require("../models/Cliente");
const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const reservaService = require("./reserva.service");
const configuracionService = require("./configuracion.service");
const notificacionService = require("./notificacion.service");
const { validarNombre, validarTelefono, validarCorreo } = require("../utils/validarContacto");

const REGEX_CODIGO = /^BR-[A-Z0-9]{6}$/;

const MENSAJE_DATOS_NO_COINCIDEN =
    "Los datos de contacto no coinciden con los registrados en la barbería. Verifique su teléfono y correo, o comuníquese con la barbería.";

const MENSAJE_RESERVA_NO_ENCONTRADA =
    "No encontramos una reserva con ese código y ese correo. Revise los datos e intente de nuevo.";

function normalizarCorreo(correo) {
    return String(correo || "").trim().toLowerCase();
}

function normalizarCodigo(codigo) {
    return String(codigo || "").trim().toUpperCase();
}

/** Información que se puede mostrar al cliente: sin datos internos. */
function vistaPublica(reserva) {
    return {
        codigo: reserva.codigo,
        estado: reserva.estado,
        fecha: reserva.fecha,
        hora: String(reserva.hora).slice(0, 5),
        duracion: reserva.duracion,
        observaciones: reserva.observaciones,
        cliente: reserva.cliente ? { nombre: reserva.cliente.nombre } : undefined,
        barbero: reserva.barbero ? { nombre: reserva.barbero.nombre, especialidad: reserva.barbero.especialidad } : undefined,
        servicio: reserva.servicio
            ? { nombre: reserva.servicio.nombre, precio: reserva.servicio.precio, duracion: reserva.servicio.duracion }
            : undefined,
        canceladaEn: reserva.canceladaEn,
    };
}

const INCLUDES_PUBLICOS = [
    { model: Cliente, as: "cliente", attributes: ["id", "nombre", "correo"] },
    { model: Barbero, as: "barbero", attributes: ["id", "nombre", "especialidad"] },
    { model: Servicio, as: "servicio", attributes: ["id", "nombre", "precio", "duracion"] },
];

class PublicoService {

    async listarServicios() {
        return await Servicio.findAll({
            where: { estado: "Activo" },
            attributes: ["id", "nombre", "descripcion", "duracion", "precio"],
            order: [["nombre", "ASC"]],
        });
    }

    /** Solo se exponen datos públicos del barbero: nunca teléfono ni correo. */
    async listarBarberos() {
        const barberos = await Barbero.findAll({
            where: { estado: "Activo" },
            attributes: ["id", "nombre", "especialidad"],
            include: [{ model: Servicio, as: "servicios", attributes: ["id"], through: { attributes: [] } }],
            order: [["nombre", "ASC"]],
        });
        // servicios: [] significa que el barbero realiza todos los servicios.
        return barberos.map((b) => ({
            id: b.id,
            nombre: b.nombre,
            especialidad: b.especialidad,
            servicios: (b.servicios || []).map((x) => x.id),
        }));
    }

    /** Reglas que el cliente debe conocer antes de reservar. */
    async configuracionPublica() {
        const c = await configuracionService.obtener();
        return {
            nombreNegocio: c.nombreNegocio,
            anticipacionMinutos: c.anticipacionMinutos,
            diasMaximos: c.diasMaximos,
            horasLimiteCancelacion: c.horasLimiteCancelacion,
        };
    }

    /**
     * Busca al cliente por correo y teléfono. Si no existe, lo crea. Si el
     * correo y el teléfono pertenecen a clientes distintos, o no coinciden
     * con los registrados, se rechaza para no mezclar ni suplantar datos.
     */
    async _resolverCliente({ nombre, telefono, correo }, transaction) {
        const correoNormalizado = normalizarCorreo(correo);

        const [porCorreo, porTelefono] = await Promise.all([
            Cliente.findOne({
                where: sqlWhere(fn("lower", col("correo")), correoNormalizado),
                transaction,
            }),
            Cliente.findOne({ where: { telefono }, transaction }),
        ]);

        if (porCorreo || porTelefono) {
            const coincide =
                porCorreo && porTelefono &&
                porCorreo.id === porTelefono.id;

            if (!coincide) {
                const error = new Error(MENSAJE_DATOS_NO_COINCIDEN);
                error.status = 409;
                throw error;
            }

            return porCorreo;
        }

        return await Cliente.create(
            { nombre: nombre.trim(), telefono, correo: correoNormalizado },
            { transaction }
        );
    }

    async crearReserva(datos) {
        const nombre = typeof datos.nombre === "string" ? datos.nombre : "";
        const telefono = typeof datos.telefono === "string" ? datos.telefono.trim() : "";
        const correo = typeof datos.correo === "string" ? datos.correo.trim() : "";

        validarNombre(nombre);
        if (nombre.trim().length > 80) throw new Error("El nombre no puede superar 80 caracteres.");
        validarTelefono(telefono);
        validarCorreo(correo);
        if (correo.length > 120) throw new Error("El correo no puede superar 120 caracteres.");

        if (!datos.barberoId) throw new Error("Debe seleccionar un barbero.");
        if (!datos.servicioId) throw new Error("Debe seleccionar un servicio.");

        try {
            // "Cualquier barbero disponible": se prueba con los barberos libres
            // a esa hora, empezando por el que tenga menos citas ese día.
            let candidatos = [datos.barberoId];
            if (datos.barberoId === "cualquiera") {
                const libres = await reservaService.elegirBarbero({
                    servicioId: datos.servicioId, fecha: datos.fecha, hora: datos.hora, publico: true,
                });
                candidatos = libres.map((b) => b.id);
            }

            let reserva;
            let ultimoError;
            for (const barberoId of candidatos) {
                try {
                    reserva = await sequelize.transaction(async (transaction) => {
                        const cliente = await this._resolverCliente({ nombre, telefono, correo }, transaction);

                        return await reservaService.crear(
                            {
                                clienteId: cliente.id,
                                barberoId,
                                servicioId: datos.servicioId,
                                fecha: datos.fecha,
                                hora: datos.hora,
                                observaciones: datos.observaciones,
                            },
                            { origen: "web", transaction, publico: true }
                        );
                    });
                    break;
                } catch (error) {
                    ultimoError = error;
                    // Si es un problema de datos del cliente, no tiene sentido probar otro barbero.
                    if (candidatos.length === 1 || error.status === 409 || !/reserva en ese horario|bloqueado/i.test(error.message)) {
                        throw error;
                    }
                }
            }
            if (!reserva) throw ultimoError;

            // La cita llega al barbero asignado y a los administradores.
            await notificacionService.notificarReserva(reserva.id, "nueva");

            const completa = await Reserva.findByPk(reserva.id, { include: INCLUDES_PUBLICOS });
            return vistaPublica(completa);
        } catch (error) {
            // Dos registros simultáneos del mismo cliente nuevo.
            if (error.name === "SequelizeUniqueConstraintError") {
                const conflicto = new Error("No fue posible registrar la reserva en este momento. Intente de nuevo.");
                conflicto.status = 409;
                throw conflicto;
            }
            throw error;
        }
    }

    /** Busca una reserva exigiendo código y correo, para no exponer reservas ajenas. */
    async _buscar({ codigo, correo }) {
        const codigoNormalizado = normalizarCodigo(codigo);
        const correoNormalizado = normalizarCorreo(correo);

        if (!codigoNormalizado || !correoNormalizado) {
            throw new Error("Ingrese el código de la reserva y el correo electrónico.");
        }

        if (!REGEX_CODIGO.test(codigoNormalizado)) {
            throw new Error("El código debe tener el formato BR-XXXXXX.");
        }

        const reserva = await Reserva.findOne({
            where: { codigo: codigoNormalizado },
            include: INCLUDES_PUBLICOS,
        });

        if (!reserva || normalizarCorreo(reserva.cliente?.correo) !== correoNormalizado) {
            const error = new Error(MENSAJE_RESERVA_NO_ENCONTRADA);
            error.status = 404;
            throw error;
        }

        return reserva;
    }

    async consultarReserva(datos) {
        return vistaPublica(await this._buscar(datos));
    }

    async cancelarReserva(datos) {
        const reserva = await this._buscar(datos);
        const config = await configuracionService.obtener();
        await reservaService.cancelar(reserva.id, { exigirFuturo: true, horasLimite: config.horasLimiteCancelacion });
        await notificacionService.notificarReserva(reserva.id, "cancelada");
        return await this.consultarReserva(datos);
    }
}

module.exports = new PublicoService();
