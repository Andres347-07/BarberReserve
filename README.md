# BarberReserve

Sistema web para la administración de barberías, desarrollado como proyecto académico de Ingeniería de Software.

---

# Descripción

BarberReserve es una aplicación web orientada a la administración integral de una barbería, permitiendo gestionar clientes, barberos, servicios, horarios, reservas y la agenda diaria desde un panel administrativo.

Actualmente el proyecto se encuentra en desarrollo bajo una arquitectura Frontend + Backend, donde el frontend ha sido desarrollado con React y el backend será implementado con Spring Boot.

---

# Objetivo

Digitalizar el proceso de administración de una barbería mediante una plataforma moderna, intuitiva y escalable que facilite la gestión de la información y la organización del trabajo diario.

---

# Estado del proyecto

Actualmente el proyecto cuenta con:

- ✅ Login
- ✅ Dashboard Administrativo
- ✅ Gestión de Clientes
- ✅ Gestión de Barberos
- ✅ Gestión de Servicios
- ✅ Gestión de Horarios
- ✅ Gestión de Reservas
- ✅ Agenda Diaria
- ✅ Componentes reutilizables
- ⏳ Integración Backend (En desarrollo)
- ⏳ Base de datos
- ⏳ Autenticación JWT
- ⏳ Roles de usuario

---

# Arquitectura del Frontend

El proyecto fue organizado siguiendo una arquitectura modular basada en componentes reutilizables.

```
src
│
├── assets
│
├── components
│   ├── cards
│   │     └── DashboardCard
│   │
│   ├── dashboard
│   │     └── AgendaCard
│   │
│   ├── forms
│   │     ├── ClienteForm
│   │     ├── BarberoForm
│   │     ├── ServicioForm
│   │     ├── HorarioForm
│   │     └── ReservaForm
│   │
│   ├── layout
│   │     ├── Sidebar
│   │     ├── Navbar
│   │     └── Footer
│   │
│   └── tables
│         ├── DataTable
│         └── ReservasTable
│
├── layouts
│     └── AdminLayout
│
├── mocks
│
├── pages
│   ├── Login
│   ├── Dashboard
│   ├── Clientes
│   ├── Barberos
│   ├── Servicios
│   ├── Horarios
│   ├── Reservas
│   ├── Agenda
│   ├── DashboardBarbero
│   ├── AgendaBarbero
│   └── PerfilBarbero
│
├── routes
│     └── AppRouter
│
├── App.jsx
└── main.jsx
```

---

# Arquitectura implementada

El proyecto sigue una arquitectura basada en separación de responsabilidades.

## Pages

Contienen las vistas principales del sistema.

Cada página representa un módulo funcional independiente.

Ejemplo:

- Dashboard
- Clientes
- Barberos
- Reservas

---

## Components

Contienen componentes reutilizables.

Estos componentes pueden ser utilizados por múltiples páginas sin duplicar código.

Ejemplo:

- DashboardCard
- DataTable
- AgendaCard
- ClienteForm

---

## Layouts

Los layouts controlan la estructura general de la aplicación.

Actualmente existe:

- AdminLayout

En futuras versiones se implementará:

- BarberoLayout

---

## Routes

Toda la navegación del proyecto se centraliza mediante React Router.

Actualmente se utiliza un único archivo:

AppRouter.jsx

Esto facilita agregar nuevos módulos sin modificar el resto del sistema.

---

## Mocks

Durante el desarrollo del frontend se utilizaron datos simulados.

Estos archivos serán reemplazados por servicios REST cuando el backend esté terminado.

---

# Componentes desarrollados

## DashboardCard

Componente reutilizable para mostrar indicadores del Dashboard.

Ejemplos:

- Clientes
- Barberos
- Reservas
- Servicios

---

## DataTable

Tabla reutilizable utilizada para los módulos administrativos.

Permite mostrar información de forma uniforme.

---

## AgendaCard

Visualiza las próximas citas del día.

---

## ReservasTable

Tabla resumida de reservas recientes mostradas en el Dashboard.

---

## Formularios

Actualmente se encuentra desarrollado:

- ClienteForm

Y preparada la estructura para:

- BarberoForm
- ServicioForm
- HorarioForm
- ReservaForm

---

#  Tecnologías utilizadas

## Frontend

- React
- React Router DOM
- React Icons
- CSS3
- JavaScript ES6+
- Vite

---

## Herramientas de desarrollo

- Visual Studio Code
- Git
- GitHub
- npm

---

#  Dependencias principales

```
react
react-dom
react-router-dom
react-icons
vite
```

---

# Diseño

La interfaz fue desarrollada siguiendo un estilo moderno basado en:

- Colores claros
- Componentes reutilizables
- Responsive Design
- Tarjetas informativas
- Navegación lateral
- Dashboard administrativo

---

# Próximas funcionalidades

Durante la integración del backend se implementará:

- Spring Boot
- API REST
- MySQL
- Spring Security
- JWT
- Roles

Administrador

Barbero

---

# Flujo de trabajo

El proyecto se desarrolló siguiendo una estrategia incremental.

1. Diseño de interfaces.

2. Organización de carpetas.

3. Creación de componentes reutilizables.

4. Desarrollo de módulos.

5. Implementación de formularios.

6. Simulación mediante mocks.

7. Integración con Backend.

8. Despliegue.

---

# Escalabilidad

La arquitectura fue diseñada para facilitar futuras funcionalidades como:

- Panel del Barbero.
- Gestión de pagos.
- Historial de clientes.
- Reportes.
- Notificaciones.
- Reservas en línea.
- Aplicación móvil.

---

#  Autor

Diego Andrés Peñaranda Soto

Ingeniería de Software

Fundación de Estudios Superiores Comfanorte (FESC)

---

# Licencia

Proyecto desarrollado con fines académicos.