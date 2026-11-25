# Desplegar Barber Reserve en Render (plan gratuito)


El repositorio trae un archivo `render.yaml` (Blueprint) que crea los tres servicios de una sola vez:

| Servicio | Tipo en Render | Qué es | URL esperada |
|---|---|---|---|
| `barberreserve-diego` | Static Site | Portal público y panel (React) | `https://barberreserve-diego.onrender.com` |
| `barberreserve-diego-api` | Web Service (Node) | API (Express) | `https://barberreserve-diego-api.onrender.com` |
| `barberreserve-db` | Postgres | Base de datos | solo interna |

No necesitas tarjeta de crédito para usar el plan gratuito.

## Antes de empezar: límites del plan gratuito

- **El backend se apaga tras 15 minutos sin visitas.** La primera visita después tarda entre 30 y 60 segundos. La aplicación muestra el aviso *"Estamos activando el servidor…"* para que nadie crea que se dañó.
- **La base de datos gratuita de Render vence 30 días después de crearla.** Si la entrega del examen es dentro de esos 30 días, no hay problema. Si vence, hay que crear una base nueva y volver a hacer la configuración inicial.
- El sitio estático (frontend) no se apaga ni vence.

## Paso 1. Subir el código a GitHub

Render despliega lo que está en GitHub, así que la versión 2.1 tiene que estar subida (commit + push) a tu repositorio. El archivo `render.yaml` debe quedar en la raíz del repositorio, al lado de las carpetas `backend` y `frontend`.

Verifica que **no** se suban los archivos `.env` (ya están en `.gitignore`).

## Paso 2. Crear los servicios con el Blueprint

1. Entra a <https://dashboard.render.com> e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New → Blueprint**.
3. Conecta tu repositorio de Barber Reserve (la primera vez Render pide permiso para leer tus repositorios).
4. Render lee `render.yaml` y muestra los tres servicios. Ponle un nombre al Blueprint (por ejemplo, `barberreserve`) y haz clic en **Apply** / **Deploy Blueprint**.
5. Espera a que los tres queden en verde (**Live** / **Available**). La primera vez tarda entre 5 y 10 minutos.

## Paso 3. Verificar las URL

Abre el servicio `barberreserve-diego-api` y mira la URL que aparece arriba.

- **Si es `https://barberreserve-diego-api.onrender.com`**: todo quedó bien, sigue al paso 4.
- **Si Render le agregó algo** (por ejemplo `barberreserve-diego-api-x7k2.onrender.com`) porque el nombre ya existía:
  1. En el servicio `barberreserve-diego` (frontend) → **Environment** → cambia `VITE_API_URL` por `https://<la-url-real-de-la-api>/api` → guarda y elige **Manual Deploy → Clear build cache & deploy**.
  2. Haz lo mismo con el frontend: si su URL también cambió, en `barberreserve-diego-api` → **Environment** → cambia `CORS_ORIGIN` por la URL real del frontend.

Prueba la API abriendo en el navegador: `https://barberreserve-diego-api.onrender.com/api/salud`. Debe responder `{"success":true,"estado":"ok"}`.

## Paso 4. Configuración inicial (sin Postman)

1. En Render abre `barberreserve-diego-api` → **Environment** y copia el valor de `CODIGO_INSTALACION`. Render lo generó al azar.
2. Abre `https://barberreserve-diego.onrender.com/login`. Como todavía no hay dueño, el sistema te lleva a **Configuración inicial**.
3. El dueño escribe sus datos y el código de instalación. El sistema le muestra su **código de recuperación**, que debe guardar.

> Si la primera petición tarda, es el arranque en frío: la app muestra "Estamos activando el servidor…". Espera un minuto.

## Paso 5. Cargar datos para la evaluación

Desde el panel, como administrador:

1. **Servicios**: crea 3 o 4 (corte, barba, corte + barba…).
2. **Barberos**: crea 2 o 3 y asígnales los servicios que hacen. Al crear cada uno, el sistema muestra su contraseña temporal.
3. **Horarios → Plantilla semanal**: pon a cada barbero su horario (por ejemplo, uno con horario partido 7:00–12:00 y 14:00–18:00).
4. Haz una reserva desde el portal público para comprobar el flujo completo.

## Qué variables configura el Blueprint

| Servicio | Variable | Valor |
|---|---|---|
| API | `DATABASE_URL` | La toma Render de la base de datos (URL interna, sin SSL) |
| API | `JWT_SECRET` | Render la genera al azar |
| API | `CODIGO_INSTALACION` | Render la genera al azar; la pide la configuración inicial |
| API | `NODE_ENV` | `production` |
| API | `APP_TIMEZONE` | `America/Bogota` |
| API | `TRUST_PROXY` | `true` (el límite de solicitudes usa la IP real del cliente) |
| API | `CORS_ORIGIN` | URL del frontend: solo ese dominio puede llamar a la API |
| API | `NODE_VERSION` | `22` |
| Frontend | `VITE_API_URL` | URL pública de la API |

`VITE_API_URL` se incrusta al compilar el frontend: si la cambias, hay que volver a desplegar el frontend.

## Mantenerlo despierto durante la sustentación (opcional)

Si no quieres que el evaluador espere el arranque en frío, abre la página 2 o 3 minutos antes. También puedes usar un monitor gratuito (por ejemplo UptimeRobot) que visite `/api/salud` cada 14 minutos; un solo servicio encendido todo el mes cabe dentro de las 750 horas gratuitas mensuales.

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El portal carga pero no muestra servicios y la consola dice *CORS* | `CORS_ORIGIN` no coincide con la URL del frontend | Corregir `CORS_ORIGIN` (sin `/` final) y redesplegar la API |
| Error 404 al recargar `/reservar` o `/login` | Falta la regla de reescritura del sitio estático | Ya viene en `render.yaml`; si creaste el sitio a mano, agrega *Redirects/Rewrites*: `/*` → `/index.html` (Rewrite) |
| El despliegue de la API falla con *Error al conectar con PostgreSQL* | La base de datos aún no estaba lista o venció | Esperar a que la base esté *Available* y redesplegar; si venció, crear otra |
| La primera carga tarda casi un minuto | Arranque en frío del plan gratuito | Normal; ver "Mantenerlo despierto" |
