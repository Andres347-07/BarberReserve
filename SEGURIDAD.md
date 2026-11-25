# Seguridad en Barber Reserve

Resumen de las medidas que protegen a la barbería, a sus empleados y a sus clientes. Cada punto tiene una prueba automática en `backend/src/tests/propietario-seguridad.test.js` o en el recorrido de Chrome.

## Sin anuncios, rastreadores ni código de terceros

- El portal no carga scripts, fuentes, imágenes, anuncios ni analíticas de otros sitios. Todo se sirve desde el propio dominio.
- **Política de seguridad de contenido (CSP):** el navegador solo ejecuta scripts del propio sitio y solo se conecta a la API de Barber Reserve. Si alguien lograra inyectar código, el navegador lo bloquea, y tampoco podría enviar datos a otro dominio. Se comprobó en Chrome.
- El frontend usa solo 5 librerías conocidas (React, React DOM, React Router, Axios, React Icons). `npm audit` no reporta vulnerabilidades en el frontend.
- El código compilado no incluye mapas de código fuente.

## Cuentas y acceso

| Medida | Qué evita |
|---|---|
| Jerarquía Dueño → Administrador → Barbero | Que un administrador cree otros administradores, desactive al dueño o le cambie la contraseña |
| Configuración inicial con **código de instalación** en producción | Que un desconocido se adueñe del sistema recién desplegado |
| Código de recuperación del dueño (un solo uso, guardado como hash) | Depender del desarrollador o de Postman para recuperar el acceso |
| Límite de 10 intentos de inicio de sesión cada 15 minutos por IP (y 8 por hora en recuperación y configuración inicial) | Adivinar contraseñas o códigos por fuerza bruta |
| Los límites se guardan en la base de datos | Que el límite se reinicie cuando el servidor se apaga o se reinicia (Render gratis) |
| Contraseñas de 8 o más caracteres con letras y números, guardadas con bcrypt | Contraseñas triviales; robo de contraseñas si se filtrara la base |
| Contraseñas temporales con aleatoriedad criptográfica | Contraseñas predecibles |
| La sesión se verifica contra la base en cada petición | Que una cuenta desactivada siga entrando hasta 8 horas |
| Cambiar o restablecer la contraseña cierra las otras sesiones | Que alguien con una sesión robada siga dentro |
| Mismo mensaje y mismo tiempo de respuesta si el correo no existe | Averiguar qué correos están registrados |
| Clave JWT obligatoria y larga en producción; solo algoritmo HS256 | Fabricar tokens de administrador |

## Servidor

- Cabeceras de seguridad con `helmet` (no se anuncia la tecnología, `nosniff`, sin incrustar en otros sitios, HSTS).
- CORS limitado al dominio del portal.
- Los errores internos devuelven un mensaje genérico; los detalles técnicos quedan solo en el registro del servidor.
- Límite de 100 KB por petición; JSON mal formado responde 400.
- Consultas a la base con Sequelize (parametrizadas): sin inyección SQL.
- Reglas de negocio validadas en el servidor y en la base de datos (restricción contra citas cruzadas), no solo en el navegador.
- Las IP de los límites de solicitudes se guardan resumidas (hash), no en claro.

## Secretos

- Los archivos `.env` no se suben al repositorio (`.gitignore`).
- En la nube, las claves se guardan como variables de entorno del hosting.

## Pendientes conocidos

- `uuid` (dependencia interna de Sequelize) tiene un aviso moderado en una función que Barber Reserve no usa. Se corregirá cuando Sequelize publique la actualización.
- El token de sesión se guarda en `localStorage`. La CSP reduce el riesgo, pero una cookie `HttpOnly` sería más robusta. Queda como mejora futura.
- No hay verificación en dos pasos (2FA).
