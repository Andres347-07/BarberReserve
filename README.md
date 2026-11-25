#  BarberReserve

Sistema web para la gestión de reservas en barberías, con dos roles — **administrador** y **barbero** — y validación automática de disponibilidad al agendar una cita.

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-163%20passing-brightgreen)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

## Tabla de contenido

1. [Descripción](#-descripción)
2. [Roles y accesos](#-roles-y-accesos)
3. [Funcionalidades destacadas](#-funcionalidades-destacadas)
4. [Tecnologías](#️-tecnologías)
5. [Estructura del proyecto](#-estructura-del-proyecto)
6. [Instalación y configuración](#️-instalación-y-configuración)
7. [Ejecutar con Docker](#-ejecutar-con-docker) · [Desplegar en Render](DESPLIEGUE-RENDER.md)
8. [Scripts disponibles](#-scripts-disponibles)
9. [Variables de entorno](#-variables-de-entorno)
10. [Cómo probar el sistema](#-cómo-probar-el-sistema)
11. [API — Endpoints principales](#-api--endpoints-principales)
12. [Modelo de datos](#️-modelo-de-datos)
13. [Limitaciones conocidas](#-limitaciones-conocidas-honestidad-ante-todo)
14. [Autor y licencia](#-autor)

##  Descripción

Muchas barberías pequeñas y medianas gestionan sus reservas por teléfono, WhatsApp o agenda física, lo que genera conflictos de horario y falta de visibilidad sobre la operación diaria. BarberReserve centraliza esa gestión en una sola aplicación web: el administrador gestiona clientes, barberos, servicios, la planificación semanal de turnos y las cuentas de usuario; cada barbero, desde su propia sesión, consulta su Agenda del día y avanza el estado de sus citas.

Al crear una reserva, el sistema **calcula automáticamente las horas realmente disponibles** para el barbero, el servicio y la fecha elegidos — en ningún momento se escribe una hora a mano.

## Novedades de Barber Reserve 2.0

- **Portal público de clientes** (`/`, `/reservar`, `/mi-reserva`), sin iniciar sesión: servicios con precio y duración, elección de barbero, **calendario visual** con los días y horas realmente libres, registro con nombre/teléfono/correo, **código de reserva** (`BR-XXXXXX`) para consultar el estado y cancelar.
- **Estado "Cancelada"**: la reserva se conserva en el historial y su horario se libera de inmediato. El administrador también puede cancelar desde el módulo Reservas.
- **Reglas reforzadas en el servidor y en la base de datos**: sin horarios pasados (según `APP_TIMEZONE`), sin cruces del mismo barbero ni del mismo cliente, bloqueo transaccional ante solicitudes simultáneas y restricción `EXCLUDE` de PostgreSQL como última barrera. Un turno no puede pasarse a Descanso, recortarse ni eliminarse si deja reservas activas por fuera.
- **Accesibilidad WCAG 2.2 AA** como objetivo: navegación completa por teclado, enlace "saltar al contenido", foco visible, etiquetas asociadas, errores anunciados, modales accesibles, tablas con `caption` y contraste corregido.
- **Identidad visual refinada** (mismo navy `#111827` y azul `#3366FF`, con tonos derivados de mayor contraste) y diseño adaptable a móvil.
- Migración **automática e idempotente** al arrancar el backend: una base de datos de la versión 1.0 se actualiza sin perder información.

Detalle completo en [`CAMBIOS-2.0.md`](CAMBIOS-2.0.md).

## Novedades de Barber Reserve 2.2

Configuración inicial desde el navegador (sin Postman), jerarquía Dueño → Administrador → Barbero con traspaso de la propiedad, recuperación de acceso con código, refuerzo de seguridad (límite de intentos de inicio de sesión, cierre inmediato de sesiones, cabeceras y política de contenido, contraseñas más fuertes) y despliegue gratuito en Render. Detalle en [`CAMBIOS-2.2.md`](CAMBIOS-2.2.md) y [`SEGURIDAD.md`](SEGURIDAD.md).

## Novedades de Barber Reserve 2.1

Lógica de barbería basada en plataformas reales: plantilla semanal con horario corrido o partido (almuerzo), excepciones por fecha, bloqueos, servicios por barbero, "Cualquier barbero disponible", limpieza entre clientes, estados En espera / No asistió, notificaciones y configuración del negocio. Accesibilidad para el examen: preferencias de interfaz (alto contraste, tamaño de texto, reducir movimiento), video con subtítulos y declaración de accesibilidad. Detalle en [`CAMBIOS-2.1.md`](CAMBIOS-2.1.md).

## Roles y accesos

| Módulo                | Administrador                       | Barbero                                  |
|-----------------------|-------------------------------------|------------------------------------------|
| Dashboard             | ✅ estadísticas globales            | ✅ estadísticas propias                 |
| Agenda                | ✅ todos los barberos, con filtros  | ✅ solo la propia                       |
| Clientes              | ✅                                  | ❌ sin acceso                           |
| Barberos              | ✅                                  | ❌ sin acceso                           |
| Servicios             | ✅                                  | ❌ sin acceso                           |
| Horarios              | ✅                                  | ❌ sin acceso                           |
| Reservas              | ✅                                  |     se gestionan desde Agenda, no aquí   |
| Gestión de Usuarios   | ✅                                  | ❌ sin acceso                           |
| Cambiar mi contraseña | ✅ (ícono 🔑 en la barra superior)  | ✅ (ícono 🔑 en la barra superior)     |

El barbero **no tiene cuenta propia hasta que un administrador lo registra**: al crear un barbero, el sistema le genera automáticamente una cuenta de acceso con una contraseña temporal, que debe cambiar obligatoriamente en su primer inicio de sesión.

## Funcionalidades destacadas

- **Autenticación JWT** con dos roles, creación automática de la cuenta del barbero, y cambio de contraseña obligatorio tras una temporal (al crear la cuenta o al restablecerla) más cambio voluntario en cualquier momento.
- **Horarios por turno semanal**: cada registro es el turno de un barbero en una fecha específica (no un día recurrente). El panel "Configurar" detecta automáticamente la semana actual — el administrador nunca elige qué semana planificar.
- **Cálculo automático de horas disponibles**: al crear una reserva, el sistema recorre el turno del barbero y descarta los horarios ya ocupados; el administrador solo elige entre las horas que el sistema ofrece.
- **Reservas con 3 estados**: Pendiente → En proceso → Finalizada (secuencial, sin retrocesos). Cancelar una reserva es eliminarla mientras esté Pendiente.
- **Gestión de Usuarios**: crear, editar, activar/desactivar y restablecer contraseñas. Ninguna cuenta se elimina de forma permanente.
- **Actualización automática del cliente**: al finalizar una cita, su "última visita" y su contador de visitas se actualizan solos.
- Notificaciones mediante un componente de aviso propio (sin `alert()`/`confirm()` nativos), modales de confirmación personalizados, íconos consistentes en todo el sistema (`react-icons/fa`), tablas con paginación y diseño responsive.
- Listo para desplegarse con **Docker Compose** (backend, frontend y PostgreSQL en contenedores independientes, con persistencia de datos).

## Tecnologías

**Frontend** — React 19 · Vite · React Router DOM 7 · Axios · React Icons · CSS por módulo (sin framework de estilos)
**Backend** — Node.js · Express 5 · Sequelize 6 (ORM) · PostgreSQL · JWT (jsonwebtoken) · bcrypt
**Pruebas** — Jest + Supertest (backend) —  pruebas automatizadas
**Infraestructura** — Docker · Docker Compose · Nginx (sirve el frontend en producción)
**Herramientas** — Git y GitHub · ESLint (frontend) · nodemon (backend, entorno de desarrollo)

## Estructura del proyecto

```
BarberReserve/
├── docker-compose.yml
├── .env.example                 # variables para Docker Compose (raíz)
│
├── backend/                     # API REST — Node.js + Express
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example              # variables para desarrollo local (sin Docker)
│   └── src/
│       ├── controllers/          # auth, cliente, barbero, servicio, horario, reserva, agenda, dashboard
│       ├── database/             # conexión Sequelize
│       ├── middlewares/           # auth, role, error
│       ├── models/                # Cliente, Barbero, Servicio, Horario, Reserva, Usuario
│       ├── routes/
│       ├── services/              # lógica de negocio (incl. horas disponibles, contraseñas)
│       ├── tests/                 # 118 pruebas Jest + Supertest
│       ├── utils/                 # jwt, response, generarPassword, validarContacto
│       ├── app.js
│       └── server.js
│
└── frontend/                    # SPA — React + Vite
    ├── Dockerfile                # build multi-etapa: Vite → Nginx
    ├── .dockerignore
    ├── nginx.conf                # sirve la SPA con fallback para React Router
    └── src/
        ├── components/
        │   ├── common/ConfirmModal/     # modal de confirmación reutilizable
        │   ├── forms/                    # un formulario por módulo + CambiarPasswordForm
        │   ├── tables/DataTable.jsx      # tabla compartida (paginación, scroll responsive)
        │   ├── layout/                    # Sidebar (menú por rol), Navbar, Footer
        │   └── Toast/                      # notificaciones (sin alert() nativo)
        ├── contexts/                # AuthContext + useAuth
        ├── pages/                   # Login, Dashboard, Clientes, Barberos, Servicios,
        │                            # Horarios, Reservas, Agenda, Usuarios
        ├── routes/                  # AppRouter, PrivateRoute (incl. la puerta de cambio de contraseña obligatorio)
        └── services/                # una función por endpoint de la API
```

## Instalación y configuración

Existen dos formas de correr el proyecto: **manualmente** (esta sección) o con **Docker** (siguiente sección, recomendada si no quieres instalar Node/PostgreSQL en tu máquina).

### Requisitos previos
- Node.js 18 o superior
- PostgreSQL corriendo localmente (o accesible por red)
- npm

### 0. Clonar el repositorio
```bash
git clone https://github.com/Andres347-07/BarberReserve.git
cd BarberReserve
```

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edita `.env` con tus datos reales de conexión (ver la [tabla de variables de entorno](#-variables-de-entorno)):
```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=barberreserve
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=una_clave_larga_y_secreta
```
Crea la base de datos (el nombre debe coincidir con `DB_NAME`):
```sql
CREATE DATABASE barberreserve;
```
Inicia el servidor (crea/sincroniza las tablas automáticamente al arrancar):
```bash
npm run dev     # con recarga automática (nodemon)
# o
npm start       # sin recarga automática
```
El backend queda disponible en `http://localhost:4000`.

### 2. Frontend
En otra terminal, desde la raíz del proyecto:
```bash
cd frontend
npm install
npm run dev
```
El frontend queda disponible en `http://localhost:5174`. La URL del backend por defecto es `http://localhost:4000/api` (`frontend/src/services/api.js`); puedes cambiarla sin tocar el código definiendo `VITE_API_URL` antes de correr `npm run dev`/`npm run build`.

### 3. Primer inicio de sesión (configuración inicial)

No hay usuarios por defecto. Abre `http://localhost:5174/login`: como todavía no hay dueño, la aplicación te lleva a **Configuración inicial**. Ahí el dueño de la barbería crea su cuenta y recibe un **código de recuperación** (para recuperar la contraseña sin ayuda). Ya no hace falta Postman.

En producción la pantalla pide además el **código de instalación** (variable `CODIGO_INSTALACION`), para que un desconocido no pueda adueñarse del sistema recién desplegado.

**Jerarquía de cuentas:** Dueño → Administrador → Barbero. Solo el dueño crea administradores y puede traspasar la propiedad del negocio a otro administrador. Si el dueño olvida la contraseña, usa "¿Olvidaste tu contraseña?" con su código; si pierde también el código, quien tenga acceso a la base de datos ejecuta `npm run restablecer-acceso -- correo@del-dueno.com` en `backend`.

## 🐳 Ejecutar con Docker

La forma recomendada de levantar el proyecto completo (base de datos incluida) sin instalar Node ni PostgreSQL en tu máquina — solo necesitas Docker y Docker Compose.

### Requisitos
- Docker
- Docker Compose (incluido en Docker Desktop; en Linux puede ser el plugin `docker compose` o el binario independiente `docker-compose`, según tu instalación)

### Puertos y nombres usados por la configuración de Docker

| Servicio    | Puerto en tu máquina | Notas                                                       |
|-------------|----------------------|-------------------------------------------------------------|
| Frontend    | `5174`               | Servido por Nginx a partir del build de producción de Vite  |
| Backend     | `4000`               | API REST                                                    |
| PostgreSQL  | `5432`               | Base de datos `barberreserve`                               |

### 1. Configura las variables de entorno

Desde la **raíz del proyecto** (donde está `docker-compose.yml`):
```bash
cp .env.example .env
```
Abre `.env` y reemplaza al menos `DB_PASSWORD` y `JWT_SECRET` por valores propios (Docker Compose se niega a arrancar si los dejas vacíos, a propósito, para no levantar el sistema con una contraseña de ejemplo). Si no cambias `VITE_API_URL`, el valor por defecto (`http://localhost:4000/api`) ya es el correcto para un uso normal en tu propia máquina.

> Este `.env` de la raíz es exclusivo de Docker Compose. Es distinto del `backend/.env` que se usa para correr el backend manualmente (sin contenedores) — no necesitas ese otro archivo si vas a usar Docker.

### 2. Levanta todo con un solo comando

```bash
docker compose up --build
```
*(si tu instalación usa el binario clásico, el comando equivalente es `docker-compose up --build`)*

La primera vez tardará varios minutos: descarga las imágenes base, instala las dependencias del backend, y compila el frontend con Vite. Al terminar deberías ver los tres contenedores corriendo (`barberreserve_postgres`, `barberreserve_backend`, `barberreserve_frontend`), con el backend reportando una conexión exitosa a PostgreSQL en sus logs.

Para correrlo en segundo plano: `docker compose up --build -d`, y para ver los logs después: `docker compose logs -f backend` (o `frontend`/`postgres`).
 


### 3. Usa la aplicación
- Frontend: **http://localhost:5174**
- API del backend: **http://localhost:4000/api**

El primer inicio de sesión funciona igual que en desarrollo local (paso 3 de la sección anterior): abre `/login` y sigue la configuración inicial.

### Persistencia de la base de datos

Los datos de PostgreSQL se guardan en un volumen nombrado de Docker (`barberreserve_db_data`), separado del ciclo de vida de los contenedores:

- `docker compose down` — detiene y elimina los contenedores, **conserva** los datos.
- `docker compose down -v` — además elimina el volumen, **borra** los datos permanentemente. Úsalo solo si quieres empezar de cero.
- `docker compose up --build` — reconstruye las imágenes (por ejemplo, tras un cambio de código) sin afectar los datos ya guardados.

### Verificación rápida de que todo quedó bien
```bash
curl http://localhost:4000/          # el backend responde
curl -I http://localhost:5174/       # el frontend sirve la aplicación
docker compose ps                    # los 3 servicios "Up" (postgres además "healthy")
```

### Reconstruir tras un cambio
```bash
docker compose build --no-cache backend   # o frontend
docker compose up -d
```


## Scripts disponibles

**Backend** (`cd backend`)

| Comando       | Qué hace                                                               |
|---------------|------------------------------------------------------------------------|
| `npm run dev` | Levanta el servidor con recarga automática (nodemon)                   |
| `npm start`   | Levanta el servidor sin recarga automática (el que usa el Dockerfile)  |
| `npm test`    | Corre las pruebas automatizadas (Jest + Supertest)                  |

**Frontend** (`cd frontend`)

| Comando            | Qué hace                                                                           |
|--------------------|------------------------------------------------------------------------------------|
| `npm run dev`      | Levanta el servidor de desarrollo de Vite en `http://localhost:5174`               |
| `npm run build`    | Compila la aplicación a archivos estáticos en `dist/` (lo usa el Dockerfile)       |
| `npm run preview`  | Sirve localmente el resultado de `npm run build`, para probarlo antes de desplegar |
| `npm run lint`     | Corre ESLint sobre todo el código fuente                                           |

##  Variables de entorno

**`backend/.env`** (desarrollo local, sin Docker — copia `backend/.env.example`)

| Variable                 | Ejemplo         | Descripción                                                      | 
|--------------------------|-----------------|------------------------------------------------------------------|
| `PORT`                   | `4000`          | Puerto donde escucha la API                                      |
| `DB_HOST`                | `localhost`     | Host de PostgreSQL                                               |
| `DB_PORT`                | `5432`          | Puerto de PostgreSQL                                             |
| `DB_NAME`                | `barberreserve` | Nombre de la base de datos                                       |
| `DB_USER`                | `postgres`      | Usuario de PostgreSQL                                            |
| `DB_PASSWORD`            | —               | Contraseña de PostgreSQL (sin valor por defecto)                 |
| `JWT_SECRET`             | —               | Clave para firmar los tokens de sesión (sin valor por defecto)   |
| `APP_TIMEZONE`           | `America/Bogota`| Zona horaria de la barbería: define "hoy" y qué horarios ya pasaron |
| `DATABASE_URL`           | —               | Solo en la nube: reemplaza las variables `DB_*`                   |
| `DB_SSL`                 | `true`          | Activa SSL (URL externa de Render)                                |
| `CORS_ORIGIN`            | `https://barberreserve-diego.onrender.com` | Dominios del frontend autorizados (sin la variable se acepta cualquiera) |
| `TRUST_PROXY`            | `true`          | Detrás de un proxy: el límite de solicitudes usa la IP real       |

Despliegue gratuito en Render: [`DESPLIEGUE-RENDER.md`](DESPLIEGUE-RENDER.md).

| Variable | Descripción |
|---|---|
| `CODIGO_INSTALACION` | Código que pide la configuración inicial. Obligatorio en producción |
| `NODE_ENV` | `production` en el servidor: exige `JWT_SECRET` fuerte y `CODIGO_INSTALACION` |

**`.env`** en la raíz (solo para Docker Compose — copia el `.env.example` de la raíz)

| Variable       | Ejemplo                       | Descripción                                                                                         |
|----------------|-------------------------------|-----------------------------------------------------------------------------------------------------|
| `DB_NAME`      | `barberreserve`               | Nombre de la base de datos (contenedor de PostgreSQL)                                               |
| `DB_USER`      | `postgres`                    | Usuario de PostgreSQL                                                                               |
| `DB_PASSWORD`  | —                             | **Obligatoria**: Docker Compose no arranca si falta                                                 |
| `JWT_SECRET`   | —                             | **Obligatoria**: Docker Compose no arranca si falta                                                 |
| `VITE_API_URL` | `http://localhost:4000/api`   | URL que el navegador usa para llegar al backend; se incrusta en el frontend al construir su imagen  |

##  Cómo probar el sistema

### Pruebas automatizadas (backend)
```bash
cd backend
# crea una base de datos separada para pruebas, una sola vez:
# CREATE DATABASE barberreserve_test;
npm test
```
Debes ver **118 pruebas pasando** (76 originales + 42 de la versión 2.0: portal público, concurrencia, cancelaciones, horarios pasados y restricciones de base de datos), cubriendo: autenticación y roles, permisos por módulo, CRUD y validaciones de Clientes/Barberos/Servicios, turnos semanales, el algoritmo de horas disponibles (verificado contra el ejemplo exacto del documento oficial), estados secuenciales de reservas, actualización automática del cliente al finalizar un servicio, Agenda, Dashboard, Gestión de Usuarios, y el flujo completo de contraseñas.

> `src/tests/jest.setup.js` fuerza el uso de la base de datos `barberreserve_test` (nombre fijo) para las pruebas, sin importar lo que tengas configurado en tu `.env`. Créala una vez y queda lista para todas las corridas futuras.

### Prueba manual guiada (flujo completo)

1. **Haz la configuración inicial** (ver arriba) en `http://localhost:5174/login`.
2. Ve a **Barberos → + Nuevo Barbero**. Al guardarlo, aparecerá un aviso con una **contraseña temporal** — cópiala, no se vuelve a mostrar.
3. Crea un **Servicio** (con su duración en minutos) y, si quieres, un **Cliente**.
4. Ve a **Horarios**: verás una fila por cada barbero activo. Presiona **Configurar** — el sistema calcula solo la semana actual (no puedes elegir otra) y podrás ajustar cada día antes de guardar.
5. Ve a **Reservas → + Nueva Reserva**. Elige cliente, barbero, servicio y fecha: el campo de hora se llena automáticamente **solo con las horas realmente disponibles** ese día para ese barbero y servicio.
6. Cierra sesión e inicia sesión como el barbero, usando su correo y la contraseña temporal del paso 2. El sistema **obliga a cambiar la contraseña** antes de dejarte ver nada más.
7. Una vez cambiada, entra a **Agenda**: verás la cita creada en el paso 5, con un botón para **Iniciar servicio** y luego **Finalizar servicio**. Al finalizar, revisa el módulo Clientes: la "última cita" y el contador de visitas se habrán actualizado solos.
8. De vuelta como admin, entra a **Gestión de Usuarios**: podrás editar, activar/desactivar o restablecer la contraseña de cualquier cuenta (nunca eliminarla).
9. Prueba también el ícono 🔑 de la barra superior — deja cambiar tu propia contraseña en cualquier momento, sin que el sistema lo exija.

##  API — Endpoints principales

Todas las rutas (salvo `/api/auth/estado-instalacion`, `/api/auth/configuracion-inicial`, `/api/auth/register`, `/api/auth/login`, `/api/auth/recuperar-acceso`, `/api/salud` y `/api/publico/*`) requieren `Authorization: Bearer <token>`.

| Recurso          | Ruta base                                       | Acceso                                                                        |
|------------------|-------------------------------------------------|-------------------------------------------------------------------------------|
| Autenticación    | `/api/auth`         | `estado-instalacion`, `configuracion-inicial` (crea al dueño), `login`, `recuperar-acceso`, `me`, `cambiar-password`, `usuarios` (admin), `codigo-recuperacion` y `transferir-propiedad` (dueño) |
| Clientes         | `/api/clientes`                                 | Exclusivo admin (lectura y escritura)                                         |
| Barberos         | `/api/barberos`                                 | Exclusivo admin                                                               |
| Servicios        | `/api/servicios`                                | Exclusivo admin                                                               |
| Horarios         | `/api/horarios` (+ `/semana-actual`, `/semana`) | Exclusivo admin                                                               |
| Reservas         | `/api/reservas` (+ `/horas-disponibles`, `PATCH /:id/cancelar`) | Exclusivo admin (el barbero actúa vía `/api/agenda`)          |
| Portal público   | `/api/publico` — `servicios`, `barberos`, `horas-disponibles`, `dias-disponibles`, `POST reservas`, `POST reservas/consultar`, `POST reservas/cancelar` | Sin sesión; solo datos públicos y con límite de solicitudes por IP |
| Agenda           | `/api/agenda?fecha=`                            | Ambos roles (el barbero, auto-filtrado)                                       |
| Dashboard        | `/api/dashboard`                                | Ambos roles (respuesta distinta según el rol)                                 |

Todas las respuestas siguen el formato `{ success: true, data }` (o `{ success: false, message }` en caso de error). Ejemplo:
```http
POST /api/clientes
Content-Type: application/json
Authorization: Bearer <token>

{
  "nombre": "Carlos Ramírez",
  "telefono": "3001234567",
  "correo": "carlos.ramirez@correo.com"
}
```

##  Modelo de datos

- **Usuario** — nombre, email, password (hash), rol (admin/barbero), barberoId, activo, **debeCambiarPassword**
- **Cliente** — nombre, telefono, correo (único), ultimaCita, totalVisitas
- **Barbero** — nombre, especialidad, telefono, correo (único), estado (Activo/Inactivo)
- **Servicio** — nombre, descripcion, duracion (min), precio, estado (Activo/Inactivo)
- **Horario** — barberoId (FK), fecha (turno de un día específico, no recurrente), semana, horaInicio, horaFin, estado (Activo/Descanso)
- **Reserva** — clienteId (FK), barberoId (FK), servicioId (FK), fecha, hora, duracion (copiada del servicio al crearla), estado (**Pendiente / En proceso / Finalizada / Cancelada**), observaciones, **codigo** (público, único), **origen** (`admin`/`web`), **canceladaEn**

Relaciones: un Cliente, un Barbero y un Servicio pueden tener muchas Reservas; un Barbero puede tener muchos Horarios y, opcionalmente, un Usuario de acceso asociado.



## 👤 Autor

**Diego Andrés Peñaranda Soto**
Ingeniería de Software — Fundación de Estudios Superiores Comfanorte (FESC)

## 📄 Licencia

Proyecto desarrollado con fines académicos.