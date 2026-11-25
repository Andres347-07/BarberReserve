# Barber Reserve 2.2 — Configuración inicial, dueño del negocio y seguridad

## Configuración inicial sin Postman
- Al abrir `/login` por primera vez, el sistema lleva a **Configuración inicial**: el dueño escribe el nombre de la barbería, sus datos y (en producción) el código de instalación.
- Al terminar recibe un **código de recuperación** (copiar, descargar .txt o imprimir) y debe confirmar que lo guardó.
- La ruta anterior `POST /api/auth/register` sigue funcionando con las mismas reglas.

## Jerarquía Dueño → Administrador → Barbero
- El primer usuario es el **dueño** (insignia "Dueño" en Usuarios y en la barra superior).
- Solo el dueño crea, edita, desactiva y restablece la contraseña de administradores.
- Nadie puede desactivar al dueño ni restablecerle la contraseña; nadie puede desactivarse a sí mismo.
- **Traspasar propiedad**: el dueño entrega el negocio a otro administrador (confirmando con su contraseña); el nuevo dueño recibe su propio código de recuperación.
- En Configuración, el dueño puede generar un código de recuperación nuevo.

## Recuperación de acceso
- "¿Olvidaste tu contraseña?" en el inicio de sesión: el dueño usa su código (de un solo uso) y recibe uno nuevo; barberos y administradores se lo piden al dueño.
- Último recurso con acceso a la base de datos: `npm run restablecer-acceso -- correo`.

## Seguridad
Detalle en `SEGURIDAD.md`. Lo principal:
- Límite de intentos de inicio de sesión y recuperación, guardado en la base de datos.
- La sesión se valida contra la base en cada petición: desactivar una cuenta o cambiar la contraseña cierra las sesiones abiertas.
- Contraseñas de 8+ caracteres con letras y números; temporales con aleatoriedad criptográfica.
- `helmet`, CSP en el portal, errores 5xx sin detalles internos, JWT obligatorio en producción.
- `bcrypt` → `bcryptjs` (compatible con las contraseñas existentes; sin módulos nativos).

## Despliegue
- Render (`render.yaml`, `DESPLIEGUE-RENDER.md`): se agregan `CODIGO_INSTALACION` (generado al azar) y `NODE_ENV=production`, y cabeceras de seguridad en el sitio estático.

## Pruebas
- Backend: 163 pruebas (24 nuevas en `propietario-seguridad.test.js`).
- Chrome sobre la versión compilada de producción: 39/39 (configuración inicial, jerarquía, traspaso, recuperación, CSP y axe sin violaciones).
