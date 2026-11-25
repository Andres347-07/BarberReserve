/**
 * Migraciones idempotentes de Barber Reserve 2.0.
 *
 * `sequelize.sync()` crea las tablas que faltan, pero NO modifica tablas que
 * ya existen: no agrega columnas nuevas ni valores nuevos a un ENUM. Para no
 * perder la información de instalaciones existentes, estos cambios se
 * aplican aquí con SQL seguro de ejecutar varias veces (IF NOT EXISTS).
 *
 * Además se crean restricciones a nivel de base de datos, para que las
 * reglas de negocio se cumplan incluso si dos peticiones llegan a la vez:
 *   - CHECK: la duración de la reserva debe ser positiva.
 *   - EXCLUDE (btree_gist): un barbero no puede tener dos reservas activas
 *     (no canceladas) cuyos intervalos de tiempo se crucen.
 *
 * Si alguna restricción no puede crearse (por ejemplo, porque el usuario de
 * la base de datos no tiene permiso para instalar btree_gist, o porque ya
 * existen datos inconsistentes), se informa en consola y el sistema sigue
 * funcionando: las mismas reglas se validan en el servicio dentro de una
 * transacción con bloqueo.
 */

async function ejecutar(sequelize, sql, descripcion, avisos) {
    try {
        await sequelize.query(sql);
        return true;
    } catch (error) {
        avisos.push(`${descripcion}: ${error.message}`);
        return false;
    }
}

async function aplicarMigraciones(sequelize, { silencioso = false } = {}) {
    const avisos = [];

    // 1. Nuevo estado "Cancelada" en el ENUM existente.
    await ejecutar(
        sequelize,
        `ALTER TYPE "enum_reservas_estado" ADD VALUE IF NOT EXISTS 'Cancelada';`,
        "Estado Cancelada",
        avisos
    );

    // 1b. Estados de la versión 2.1: el cliente llegó (En espera) / no llegó.
    await ejecutar(sequelize, `ALTER TYPE "enum_reservas_estado" ADD VALUE IF NOT EXISTS 'En espera';`, "Estado En espera", avisos);
    await ejecutar(sequelize, `ALTER TYPE "enum_reservas_estado" ADD VALUE IF NOT EXISTS 'No asistió';`, "Estado No asistió", avisos);

    // 1c. Horario partido y motivo en las excepciones por fecha.
    await ejecutar(sequelize, `ALTER TABLE "horarios" ADD COLUMN IF NOT EXISTS "pausaInicio" TIME;`, "Columna pausaInicio", avisos);
    await ejecutar(sequelize, `ALTER TABLE "horarios" ADD COLUMN IF NOT EXISTS "pausaFin" TIME;`, "Columna pausaFin", avisos);
    await ejecutar(sequelize, `ALTER TABLE "horarios" ADD COLUMN IF NOT EXISTS "motivo" VARCHAR(120);`, "Columna motivo", avisos);

    // 1d. Minutos de limpieza reservados después de cada cita.
    await ejecutar(sequelize, `ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "limpieza" INTEGER NOT NULL DEFAULT 0;`, "Columna limpieza", avisos);

    // 2. Columnas nuevas de reservas.
    await ejecutar(
        sequelize,
        `ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "codigo" VARCHAR(12);`,
        "Columna codigo",
        avisos
    );
    await ejecutar(
        sequelize,
        `ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "origen" VARCHAR(10) NOT NULL DEFAULT 'admin';`,
        "Columna origen",
        avisos
    );
    await ejecutar(
        sequelize,
        `ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "canceladaEn" TIMESTAMP WITH TIME ZONE;`,
        "Columna canceladaEn",
        avisos
    );
    await ejecutar(
        sequelize,
        `CREATE UNIQUE INDEX IF NOT EXISTS "reservas_codigo_unico" ON "reservas" ("codigo") WHERE "codigo" IS NOT NULL;`,
        "Índice único de codigo",
        avisos
    );

    // 3. Índice para acelerar la consulta de disponibilidad.
    await ejecutar(
        sequelize,
        `CREATE INDEX IF NOT EXISTS "reservas_barbero_fecha_idx" ON "reservas" ("barberoId", "fecha");`,
        "Índice barbero/fecha",
        avisos
    );

    // 4. CHECK de duración positiva.
    await ejecutar(
        sequelize,
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_duracion_positiva') THEN
                ALTER TABLE "reservas" ADD CONSTRAINT "reservas_duracion_positiva" CHECK ("duracion" > 0);
            END IF;
        END $$;`,
        "Restricción de duración positiva",
        avisos
    );

    // 5. Restricción de exclusión contra cruces de horario del mismo barbero.
    const extension = await ejecutar(
        sequelize,
        `CREATE EXTENSION IF NOT EXISTS btree_gist;`,
        "Extensión btree_gist",
        avisos
    );

    let exclusion = false;
    if (extension) {
        // Versión 2.1: el intervalo ocupado incluye los minutos de limpieza, y
        // ni las canceladas ni las de "No asistió" ocupan el horario. La
        // restricción de la versión 2.0 se reemplaza por esta.
        await ejecutar(
            sequelize,
            `ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "reservas_sin_cruce_barbero";`,
            "Retiro de la restricción 2.0",
            avisos
        );
        exclusion = await ejecutar(
            sequelize,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_sin_cruce_barbero_v2') THEN
                    ALTER TABLE "reservas" ADD CONSTRAINT "reservas_sin_cruce_barbero_v2"
                    EXCLUDE USING gist (
                        "barberoId" WITH =,
                        tsrange(
                            ("fecha" + "hora"),
                            ("fecha" + "hora") + make_interval(mins => "duracion" + "limpieza"),
                            '[)'
                        ) WITH &&
                    ) WHERE ("estado" <> 'Cancelada' AND "estado" <> 'No asistió');
                END IF;
            END $$;`,
            "Restricción de no cruce de horarios",
            avisos
        );
    }

    await ejecutar(
        sequelize,
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_limpieza_no_negativa') THEN
                ALTER TABLE "reservas" ADD CONSTRAINT "reservas_limpieza_no_negativa" CHECK ("limpieza" >= 0);
            END IF;
        END $$;`,
        "Restricción de limpieza no negativa",
        avisos
    );

    if (!silencioso) {
        avisos.forEach((aviso) => console.warn(`⚠️  Migración omitida — ${aviso}`));
    }

    return { avisos, exclusion };
}

module.exports = { aplicarMigraciones };
