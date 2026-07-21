# BarberReserve

Sistema web para la gestión de reservas en barberías. Permite administrar clientes, barberos, servicios, horarios y citas desde una plataforma centralizada, construida con React en el frontend y una API REST en Node.js/Express respaldada por PostgreSQL.

## Descripción

Muchas barberías pequeñas y medianas gestionan sus reservas por teléfono, WhatsApp o agenda física, lo que genera conflictos de horario y falta de visibilidad sobre la operación diaria. BarberReserve centraliza esa gestión en una sola aplicación web, con un panel administrativo para registrar clientes, barberos, servicios y horarios, y para crear, editar y cancelar reservas.

## Estado actual del proyecto

El proyecto se encuentra en desarrollo activo. Esta tabla resume, con honestidad, qué está funcionando hoy y qué falta:


---------------------------------------------------------------------------------------------------------------------------------------------------------------
| Módulo                                   | Backend (API)                              | Frontend                                 | Estado                   |
|------------------------------------------|--------------------------------------------|------------------------------------------|------------------------- |
| Clientes                                 | CRUD completo                              | Conectado                                | ✅ Completo              |
| Barberos                                 | CRUD completo                              | Conectado                                | ✅ Completo              |
| Servicios                                | CRUD completo                              | Conectado                                | ✅ Completo              |
| Horarios                                 | CRUD completo                              | Conectado                                | ✅ Completo              |
| Reservas                                 | CRUD completo                              | Conectado (con confirmación al eliminar) | ✅ Completo              |
| Dashboard                                | —                                          | Datos simulados (mocks)                  | ⚠️ Pendiente de conectar |
| Agenda                                   | —                                          | Datos simulados (mocks)                  | ⚠️ Pendiente de conectar |
| Autenticación (login/roles)              | No implementada                            | Interfaz estática                        | ❌ Pendiente             |
| Validación de disponibilidad de barbero  | No implementada                            | —                                        | ❌ Pendiente             |
| Migraciones de base de datos             | No implementadas (usa `sequelize.sync()`)  | —                                        | ❌ Pendiente             |

> Los formularios de Cliente, Barbero, Servicio y Horario aún no tienen validación de campos obligatorios en el frontend; el formulario de Reservas sí la tiene.

## Tecnologías

**Frontend**
- React 19 + Vite
- React Router DOM 7
- Axios
- React Icons
- CSS por módulo (sin framework de estilos)

**Backend**
- Node.js + Express 5
- Sequelize 6 (ORM)
- PostgreSQL
- dotenv, cors
- bcrypt y jsonwebtoken (instalados, aún no integrados — ver [Próximos pasos](#-próximos-pasos))

**Herramientas**
- Git y GitHub
- ESLint (frontend)
- nodemon (backend, entorno de desarrollo)

## Estructura del proyecto

```
BarberReserve/
├── src/                        # Frontend (React)
│   ├── pages/                  # Vistas: Login, Dashboard, Clientes, Barberos,
│   │                           # Servicios, Horarios, Reservas, Agenda
│   ├── components/
│   │   ├── forms/              # ClienteForm, BarberoForm, ServicioForm,
│   │   │                       # HorarioForm, ReservaForm
│   │   ├── tables/             # DataTable, ReservasTable
│   │   ├── cards/               # DashboardCard
│   │   ├── dashboard/          # AgendaCard
│   │   └── layout/              # Sidebar, Navbar, Footer
│   ├── layouts/                 # AdminLayout (en uso), MainLayout (reservado a futuro)
│   ├── routes/                  # AppRouter.jsx
│   ├── services/                # Clientes Axios por recurso (clienteService, etc.)
│   ├── mocks/                   # Datos simulados (Dashboard, Agenda, usuario)
│   └── styles/
│
├── backend/                     # Backend (Node.js + Express)
│   └── src/
│       ├── routes/              # Definición de endpoints por recurso
│       ├── controllers/         # Manejo de solicitudes HTTP
│       ├── services/            # Lógica de negocio y acceso a datos
│       ├── models/               # Modelos Sequelize (Cliente, Barbero, Servicio,
│       │                        # Horario, Reserva) + asociaciones (index.js)
│       ├── middlewares/          # auth.middleware.js, error.middleware.js (pendientes)
│       ├── database/             # Conexión Sequelize
│       ├── config/
│       └── utils/                # response.js (pendiente)
│
└── README.md
```

## Instalación y configuración

### Requisitos previos
- Node.js 18 o superior
- PostgreSQL instalado y corriendo localmente (o accesible por red)
- npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/Andres347-07/BarberReserve.git
cd BarberReserve
```

### 2. Configurar el backend
```bash
cd backend
npm install
cp .env.example .env
```
Edita `.env` con tus datos reales de conexión:
```
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=barberreserve
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_clave_secreta
```
Crea la base de datos en PostgreSQL (el nombre debe coincidir con `DB_NAME`):
```sql
CREATE DATABASE barberreserve;
```

Inicia el servidor backend (crea/sincroniza las tablas automáticamente al arrancar):
```bash
npm run dev     # con recarga automática (nodemon)
# o
npm start       # sin recarga automática
```
El backend quedará disponible en `http://localhost:4000`.

### 3. Configurar el frontend
En otra terminal, desde la raíz del proyecto:
```bash
npm install
npm run dev
```
El frontend quedará disponible en la URL que indique Vite (por defecto `http://localhost:5173`).

## API — Endpoints principales

Todas las rutas parten de `/api` y responden en JSON con el formato `{ success, data }` (o `{ success: false, message }` en caso de error).

| Recurso   | Base             | Métodos disponibles                        |
|-----------|------------------|--------------------------------------------|
| Clientes  | `/api/clientes`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Barberos  | `/api/barberos`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Servicios | `/api/servicios` | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Horarios  | `/api/horarios`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Reservas  | `/api/reservas`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |

Ejemplo — crear un cliente:
```http
POST /api/clientes
Content-Type: application/json

{
  "nombre": "Carlos Ramírez",
  "telefono": "3001234567",
  "correo": "carlos.ramirez@correo.com"
}
```

##  Modelo de datos

- **Cliente** — id, nombre, telefono, correo (único), ultimaCita, totalVisitas
- **Barbero** — id, nombre, especialidad, telefono, correo (único), estado
- **Servicio** — id, nombre, descripcion, duracion, precio, estado
- **Horario** — id, barberoId (FK), diaSemana, horaInicio, horaFin, activo
- **Reserva** — id, clienteId (FK), barberoId (FK), servicioId (FK), fecha, hora, estado (Pendiente/En proceso/Finalizada/Cancelada), observaciones

Relaciones: un Cliente, un Barbero y un Servicio pueden tener muchas Reservas; un Barbero puede tener muchos Horarios.

##  Próximos pasos

- [ ] Implementar autenticación (login funcional, cifrado de contraseñas con bcrypt, tokens JWT) y proteger las rutas del panel administrativo.
- [ ] Validar la disponibilidad del barbero antes de confirmar una reserva.
- [ ] Conectar el Dashboard y la Agenda a la API real, en reemplazo de los datos simulados.
- [ ] Agregar un middleware centralizado de manejo de errores y conectarlo en `app.js`.
- [ ] Agregar validaciones de campos (obligatorios, formato, longitud) en los formularios de Cliente, Barbero, Servicio y Horario.
- [ ] Incorporar migraciones y seeders con Sequelize CLI en lugar de `sequelize.sync()`.
- [ ] Completar el diseño responsive en las páginas de listado (Clientes, Barberos, Servicios, Horarios, Reservas).
- [ ] Desarrollar el rol de barbero (layout, dashboard, agenda y perfil), ya reservado en la estructura del código (`MainLayout`, `PerfilBarbero`) pero sin implementar.

##  Autor

**Diego Andrés Peñaranda Soto**
Ingeniería de Software — Fundación de Estudios Superiores Comfanorte (FESC)

##  Licencia

Proyecto desarrollado con fines académicos.