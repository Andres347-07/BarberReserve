#  BarberReserve

Sistema web para la gestión de reservas en barberías. Permite administrar clientes, barberos, servicios, horarios y citas desde una plataforma centralizada, construida con React en el frontend y una API REST en Node.js/Express respaldada por PostgreSQL.

##  Descripción

Muchas barberías pequeñas y medianas gestionan sus reservas por teléfono, WhatsApp o agenda física, lo que genera conflictos de horario y falta de visibilidad sobre la operación diaria. BarberReserve centraliza esa gestión en una sola aplicación web, con un panel administrativo para registrar clientes, barberos, servicios y horarios, y para crear, editar y cancelar reservas.


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


### Requisitos previos
- Node.js 18 o superior
- PostgreSQL instalado y corriendo localmente (o accesible por red)
- npm



## API — Endpoints principales

Todas las rutas parten de `/api` y responden en JSON con el formato `{ success, data }` (o `{ success: false, message }` en caso de error).

| Recurso    | Base             | Métodos disponibles                        |
|------------|------------------|--------------------------------------------|
| Clientes   | `/api/clientes`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Barberos   | `/api/barberos`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Servicios  | `/api/servicios` | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Horarios   | `/api/horarios`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| Reservas   | `/api/reservas`  | GET, GET /:id, POST, PUT /:id, DELETE /:id |



## Modelo de datos

- **Cliente** — id, nombre, telefono, correo (único), ultimaCita, totalVisitas
- **Barbero** — id, nombre, especialidad, telefono, correo (único), estado
- **Servicio** — id, nombre, descripcion, duracion, precio, estado
- **Horario** — id, barberoId (FK), diaSemana, horaInicio, horaFin, activo
- **Reserva** — id, clienteId (FK), barberoId (FK), servicioId (FK), fecha, hora, estado (Pendiente/En proceso/Finalizada/Cancelada), observaciones

Relaciones: un Cliente, un Barbero y un Servicio pueden tener muchas Reservas; un Barbero puede tener muchos Horarios.

## Próximos pasos

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

## Licencia

Proyecto desarrollado con fines académicos.