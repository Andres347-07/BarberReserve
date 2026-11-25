const Configuracion = require("../models/Configuracion");

const LIMITES = {
    minutosLimpieza: [0, 30, "Los minutos de limpieza deben estar entre 0 y 30."],
    anticipacionMinutos: [0, 1440, "La anticipación mínima debe estar entre 0 y 1440 minutos (24 horas)."],
    diasMaximos: [1, 180, "Los días máximos para reservar deben estar entre 1 y 180."],
    horasLimiteCancelacion: [0, 72, "El límite de cancelación debe estar entre 0 y 72 horas."],
    minutosToleranciaNoAsistio: [0, 60, "La tolerancia de inasistencia debe estar entre 0 y 60 minutos."],
    horasSemanalesMaximas: [1, 60, "Las horas semanales máximas deben estar entre 1 y 60."],
};

const INTERVALOS_VALIDOS = [0, 5, 10, 15, 20, 30, 60];

class ConfiguracionService {

    /** Devuelve la configuración del negocio; la crea con valores por defecto si no existe. */
    async obtener(transaction) {
        let config = await Configuracion.findOne({ order: [["id", "ASC"]], transaction });
        if (!config) config = await Configuracion.create({}, { transaction });
        return config;
    }

    async actualizar(datos = {}) {
        const config = await this.obtener();
        const cambios = {};

        for (const [campo, [min, max, mensaje]] of Object.entries(LIMITES)) {
            if (datos[campo] === undefined) continue;
            const valor = Number(datos[campo]);
            if (!Number.isInteger(valor) || valor < min || valor > max) throw new Error(mensaje);
            cambios[campo] = valor;
        }

        if (datos.intervaloCupos !== undefined) {
            const valor = Number(datos.intervaloCupos);
            if (!INTERVALOS_VALIDOS.includes(valor)) {
                throw new Error("El intervalo de cupos debe ser 0 (según duración), 5, 10, 15, 20, 30 o 60 minutos.");
            }
            cambios.intervaloCupos = valor;
        }

        if (datos.nombreNegocio !== undefined) {
            const nombre = String(datos.nombreNegocio).trim();
            if (nombre.length < 3 || nombre.length > 80) throw new Error("El nombre del negocio debe tener entre 3 y 80 caracteres.");
            cambios.nombreNegocio = nombre;
        }

        await config.update(cambios);
        return config;
    }
}

module.exports = new ConfiguracionService();
