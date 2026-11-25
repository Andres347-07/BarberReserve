# Barber Reserve 2.0 — Registro de cambios

Evolución del Barber Reserve original hacia un sistema de gestión de barberías con reservas en línea. Se conservaron la arquitectura (React + Vite / Express + Sequelize + PostgreSQL), los módulos, los roles, los permisos y la base de datos. No se eliminó ningún archivo ni funcionalidad existente.

## 1. Funcionalidades nuevas

### Portal público de clientes (sin iniciar sesión)
| Ruta | Qué permite |
|---|---|
| `/` | Inicio: servicios con precio y duración, equipo de barberos, cómo funciona. |
| `/reservar` | Asistente de 4 pasos: servicio → barbero → **calendario visual** con días y horas libres → datos (nombre, celular, correo). Entrega un código `BR-XXXXXX`. |
| `/mi-reserva` | Consulta del estado con **código + correo** y cancelación de reservas pendientes. |

- El panel administrativo pasa de `/` a `/panel` (que redirige según el rol); `/login` no cambia.
- Desde el panel hay un enlace "Ver portal de clientes" y desde el portal uno de "Acceso personal".
- API nueva sin autenticación en `/api/publico/*`, que solo expone datos públicos (nunca teléfono ni correo de barberos) y tiene límite de solicitudes por IP.

### Cancelaciones
- Nuevo estado **Cancelada**: la reserva se conserva en el historial (con fecha de cancelación) y **su horario se libera de inmediato**.
- El administrador puede **cancelar** (nuevo botón) además de eliminar. Ahora también se pueden eliminar reservas canceladas.
- Agenda, Reservas y Dashboard muestran y filtran el estado Cancelada.

### Panel administrativo
- Reservas: columna con el código y una marca "En línea", filtro por estado, búsqueda por código.
- Dashboard: indicadores rediseñados, reservas en línea y canceladas.
- Agenda: navegación día anterior / hoy / día siguiente y filtros con etiquetas.
- Al editar una reserva, su propia hora vuelve a aparecer como opción (antes desaparecía).

## 2. Reglas de negocio (validadas en el frontend, el backend y la base de datos)

| Regla | Dónde se aplica |
|---|---|
| Sin reservas duplicadas ni cruces del **mismo barbero** | Servicio (transacción + bloqueo `pg_advisory_xact_lock`) y BD (restricción `EXCLUDE USING gist`) |
| Sin cruces del **mismo cliente** con otro barbero | Servicio |
| Respeto de turnos y días de descanso | Servicio; además, un turno **no puede pasarse a Descanso, recortarse ni eliminarse** si deja reservas activas por fuera |
| Duración del servicio | Cálculo de horas y BD (`CHECK duracion > 0`) |
| Sin horarios pasados | Servicio, según `APP_TIMEZONE` (por defecto America/Bogota); el calendario y las horas también los ocultan |
| La cancelación libera disponibilidad | Las consultas de disponibilidad y la restricción de BD ignoran las reservas canceladas |
| Validación de datos | Formato de fecha/hora, nombre, teléfono de 10 dígitos, correo y longitud máxima, en el cliente y en el servidor |
| Identidad del cliente | Si el correo o el teléfono ya existen, ambos deben pertenecer al mismo cliente (evita mezclar o suplantar datos) |

**Migración automática** (`backend/src/database/migraciones.js`): al arrancar, el backend agrega el estado, las columnas, los índices y las restricciones con SQL idempotente. Se verificó sobre una base creada por la versión 1.0: los datos se conservaron y un segundo arranque no generó avisos.

## 3. Accesibilidad (objetivo WCAG 2.2 AA)
- Enlace "Saltar al contenido", landmarks (`header`, `nav`, `main`, `aside`) y `aria-current` en el menú.
- Foco visible de 3 px en todos los controles; menú móvil con manejo de foco y Escape.
- Todas las etiquetas asociadas a sus campos (`htmlFor`/`id`), errores con `aria-invalid` + `aria-describedby`, y foco en el primer error o en un resumen de errores con enlaces.
- Modales con `role="dialog"/"alertdialog"`: foco atrapado, Escape y retorno del foco al botón que los abrió.
- Notificaciones en regiones vivas persistentes (los errores se anuncian de inmediato) y con más tiempo en pantalla (6 a 10 s).
- Tablas con `caption`, `scope` y botones de acción con nombre único ("Editar Juan Pérez").
- Calendario con el patrón *grid* de WAI-ARIA: flechas, Inicio/Fin, RePág/AvPág y una etiqueta completa por día ("viernes, 20 de noviembre: 8 horas disponibles").
- Títulos de pestaña por página, `lang="es"`, iconos decorativos ocultos a lectores de pantalla y respeto de `prefers-reduced-motion`.
- Se corrigió el contraste que señaló WAVE: `#6B7280` sobre `#F4F6FB` (4.47:1) pasa a `#4B5563` (7:1), y el azul `#3366FF` usado como texto sobre fondos claros (4.13:1) pasa a `#2952CC` (6.2:1).

## 4. Identidad visual
Se conservó la paleta original: navy `#111827` en el menú, azul `#3366FF` en botones, elementos activos y el logotipo de texto, y fondo `#F5F7FB`. Se agregaron tonos derivados del mismo azul y neutros con mejor contraste (tokens en `frontend/src/styles/global.css`). **No se añadieron dorados**: la instrucción de conservar la identidad tiene prioridad y el original no los usa. El portal público usa la misma paleta y la misma foto de barbería del login.

## 5. Problemas corregidos
- **"Hoy" en UTC**: el dashboard y la agenda usaban `toISOString()`, que en Colombia cambia de día a las 7:00 p. m. Ahora usan la zona horaria local.
- Se podían crear reservas en fechas u horas pasadas.
- Cambiar un turno a Descanso dejaba reservas huérfanas.
- Dos solicitudes simultáneas podían reservar el mismo horario (condición de carrera).
- Al editar una reserva, su propia hora no se ofrecía.
- Usuarios "Activo/Inactivo" usaban los colores de En proceso/Finalizada.
- WAVE/axe: contraste, niveles de encabezado saltados, campos sin etiqueta en la Agenda y tablas sin `caption`.
- El login cargaba un logo de 2 MB; ahora usa una versión de 29 KB (el original se conserva).

## 6. Pruebas realizadas
| Prueba | Resultado |
|---|---|
| Jest + Supertest (backend) | **118 / 118** (76 existentes + 42 nuevas) |
| E2E en Chrome (Playwright): portal, reserva solo con teclado, consulta, cancelación, login, los 8 módulos, rol barbero, móvil | **62 / 62** verificaciones |
| axe-core WCAG 2.0–2.2 A/AA: 12 páginas y 12 estados dinámicos | **0 violaciones** (la versión original tenía violaciones en 9 páginas) |
| Migración sobre una base de la versión 1.0 + segundo arranque | Datos conservados, sin avisos |
| `vite build` / ESLint | Compila; 0 errores, los mismos 6 avisos `exhaustive-deps` que ya existían |

**Ajustes en pruebas existentes:** las fechas fijas de julio a septiembre de 2026 ya habían pasado, así que se trasladaron a 2099 (la lógica probada no cambió). En `dashboard.service.test.js` se fijó el reloj al inicio del día para que la reserva de las 09:00 no se rechace como pasada.

## 7. Pendientes y limitaciones conocidas
- **No se ejecutó Docker**: no estaba disponible en el entorno de pruebas. Se probó con Node 22 y PostgreSQL 16 locales. Se agregó `APP_TIMEZONE` a `docker-compose.yml`.
- **No se probó con un lector de pantalla real** (NVDA o VoiceOver): solo con verificaciones automáticas de roles, nombres y foco.
- Las reservas creadas antes de la versión 2.0 no tienen código, así que sus clientes no pueden consultarlas en el portal.
- No se envían notificaciones (correo o SMS) con el código de reserva.
- El límite de solicitudes guarda los contadores en memoria; con varias instancias del backend haría falta Redis.
- La Agenda del panel tiene navegación por días; el calendario mensual solo está en el portal.
- `backend/.env` y `.env` contienen una contraseña real de la base de datos dentro del zip. No se modificaron, pero conviene no compartirlos.
