const sequelize = require("../database/connection");
const { Barbero } = require("../models");
const horarioService = require("../services/horario.service");

function lunesDeEstaSemanaISO() {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diferencia);

    const y = lunes.getFullYear();
    const m = String(lunes.getMonth() + 1).padStart(2, "0");
    const d = String(lunes.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

describe("horario.service — detección automática de la semana actual", () => {
    let barbero;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        barbero = await Barbero.create({
            nombre: "Andres Semana Test",
            especialidad: "Fade",
            telefono: "3070000000",
            correo: "andres.semana-test@test.com",
            estado: "Activo",
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("calcula el lunes de la semana actual usando la fecha del servidor", async () => {
        const semana = await horarioService.obtenerSemanaActual(barbero.id);

        expect(semana.semana).toBe(lunesDeEstaSemanaISO());
        expect(semana.dias).toHaveLength(7);
        expect(semana.dias[0].dia).toBe("Lunes");
        expect(semana.dias[6].dia).toBe("Domingo");
    });

    test("los días sin configurar traen valores por defecto (Activo, 08:00-18:00)", async () => {
        const semana = await horarioService.obtenerSemanaActual(barbero.id);

        semana.dias.forEach((dia) => {
            expect(dia.estado).toBe("Activo");
            expect(dia.horaInicio).toBe("08:00");
            expect(dia.horaFin).toBe("18:00");
        });
    });

    test("al guardar la semana, obtenerSemanaActual refleja los cambios guardados", async () => {
        const semanaPrevia = await horarioService.obtenerSemanaActual(barbero.id);

        await horarioService.crearSemana({
            barberoId: barbero.id,
            semana: semanaPrevia.semana,
            dias: [
                { fecha: semanaPrevia.dias[0].fecha, horaInicio: "09:00", horaFin: "15:00", estado: "Activo" },
                { fecha: semanaPrevia.dias[2].fecha, estado: "Descanso" },
            ],
        });

        const semanaActualizada = await horarioService.obtenerSemanaActual(barbero.id);

        expect(semanaActualizada.dias[0].horaInicio).toBe("09:00");
        expect(semanaActualizada.dias[0].horaFin).toBe("15:00");
        expect(semanaActualizada.dias[2].estado).toBe("Descanso");
        // El resto de los días, al no haberse tocado, conserva el valor por defecto.
        expect(semanaActualizada.dias[1].estado).toBe("Activo");
        expect(semanaActualizada.dias[1].horaInicio).toBe("08:00");
    });

    test("rechaza calcular la semana para un barbero inexistente", async () => {
        await expect(horarioService.obtenerSemanaActual(999999)).rejects.toThrow(/no existe/i);
    });
});
