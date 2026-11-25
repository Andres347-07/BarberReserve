# Barber Reserve 2.1 — Lógica de barbería y requisitos del examen final

Esta versión adapta el sistema a cómo funcionan las plataformas de citas de barbería (Booksy, Fresha, AgendaPro) y completa los requisitos de accesibilidad de la *Lista de chequeo de aplicabilidad y documentación*. Se conservaron todos los módulos, roles y datos existentes; la base de datos se actualiza sola al arrancar el backend.

## 1. Lógica de negocio (tres actores)

| Actor | Qué puede hacer ahora |
|---|---|
| Administrador | Plantilla semanal por barbero (horario corrido o partido con almuerzo), excepciones por fecha (festivo, vacaciones), bloqueos de tiempo, servicios que realiza cada barbero, configuración del negocio, notificaciones de citas nuevas y canceladas, registrar la llegada del cliente. |
| Barbero | "Mi agenda" con Hoy / Mañana / Próximos 7 días, turno del día con pausa y bloqueos, próxima cita destacada, acciones Llegó el cliente → Iniciar → Finalizar, "No asistió" tras la tolerancia, bloquear horas de su propia agenda, notificaciones de sus citas. |
| Cliente | Reserva sin cuenta, solo ve barberos que hacen el servicio elegido, opción "Cualquier barbero disponible", cupos cada 15 minutos, cancelación en línea hasta 2 horas antes. |

### Reglas de agenda
- **Horario real = excepción de la fecha > plantilla semanal > sin turno.**
- **Horario partido:** ninguna cita puede cruzar la pausa del almuerzo; el mensaje indica la pausa.
- **Limpieza entre clientes:** 5 minutos (configurable), también reservados por la restricción de la base de datos.
- **Cupos cada 15 minutos** (configurable; con 0 se usa el algoritmo original de la especificación 9.6).
- **Reserva en línea:** mínimo 60 minutos de anticipación y máximo 30 días (configurables). El panel sí puede agendar de inmediato.
- **Estados:** Pendiente → En espera (llegó) → En proceso → Finalizada; No asistió (después de 15 minutos de tolerancia) y Cancelada liberan el cupo. Las acciones de atención se habilitan el día de la cita.
- **"Cualquier barbero":** se asigna el barbero libre con menos citas ese día.
- **Jornada laboral:** la plantilla suma las horas semanales y advierte si superan 42 horas (Ley 2101 de 2021, vigente desde el 15/07/2026). Solo advierte, porque un barbero que alquila silla no es empleado.
- **Cambios de horario seguros:** no se puede guardar una plantilla, excepción o bloqueo que deje citas activas por fuera.
- **Notificaciones:** la cita en línea llega al barbero asignado y a los administradores; las cancelaciones y reasignaciones también se notifican.

## 2. Accesibilidad añadida (lista de chequeo)

| Ítem | Qué se agregó |
|---|---|
| B6 | Video "Cómo reservar tu cita" con subtítulos WebVTT en español activados, controles nativos, sin reproducción automática y transcripción. |
| B8 | Botón "Accesibilidad": alto contraste, tamaño de texto (100–150 %), reducir animaciones, subrayar enlaces y espaciado del texto (1.4.12). Se guarda en el navegador. |
| A5 / E5 | Página "Declaración de accesibilidad" (`/accesibilidad`) enlazada en el pie del portal y del panel, con nivel declarado (WCAG 2.1 AA + 5 criterios AAA), normativa (WCAG 2.1, NTC 5854, Resolución MinTIC 1519 de 2020, Ley 1618 de 2013) y limitaciones conocidas. |
| B7 / C3 | Pestañas accesibles (flechas, Inicio, Fin), campana de notificaciones con número de no leídas en su nombre accesible, diálogos con foco controlado. |

## 3. Problema de usabilidad corregido
Al pasar del paso 3 al 4 de la reserva, el mismo clic en "Continuar" enviaba el formulario vacío y mostraba errores antes de que el cliente escribiera. React reutilizaba el botón y lo convertía en "Confirmar" durante el clic. Se detectó al revisar el video del recorrido con teclado (un caso de **C2: problema que las herramientas automáticas no detectan**).

## 4. Pruebas

| Prueba | Resultado |
|---|---|
| Jest + Supertest (backend) | 139 / 139 (118 anteriores + 21 de la lógica 2.1) |
| E2E en Chrome de los flujos nuevos | 31 / 31 |
| axe-core WCAG 2.0–2.2 A/AA, 13 pantallas y estados en modo estándar y en alto contraste | 0 violaciones (26 revisiones) |

Ajustes en pruebas existentes: la prueba del algoritmo de la especificación 9.6 configura explícitamente el modo original (intervalo 0, sin limpieza); dos pruebas del portal se actualizaron a los cupos de 15 minutos.

## 5. Pendiente
- Despliegue gratuito (propuesta: Vercel + Neon) y commits ordenados por mejora.
- Prototipo en Figma (E3), informe PDF (E1) y carpeta de evidencias (E4).
- Pruebas con lector de pantalla (C4) y con 3 usuarios (C6): las hace el estudiante; se entrega protocolo.
- Correo de contacto real en la declaración de accesibilidad.

## Preparación para desplegar en Render

- `render.yaml` (Blueprint): crea la base de datos, la API y el sitio estático en el plan gratuito.
- Backend: conexión por `DATABASE_URL` con SSL opcional (`DB_SSL` o `sslmode=require`), CORS limitado a `CORS_ORIGIN`, `TRUST_PROXY` para que el límite de solicitudes vea la IP real, ruta `GET /api/salud` para el chequeo de salud, y salida con error si no hay base de datos.
- Frontend: `VITE_API_URL` acepta la URL completa o solo el dominio; aviso accesible (`role="status"`) "Estamos activando el servidor…" cuando una respuesta tarda más de 4 segundos (arranque en frío del plan gratuito).
- Guía paso a paso en `DESPLIEGUE-RENDER.md`.
