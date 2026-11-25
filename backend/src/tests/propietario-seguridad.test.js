process.env.DESACTIVAR_LIMITE = "true";

const request = require("supertest");
const sequelize = require("../database/connection");
const app = require("../app");
const Configuracion = require("../models/Configuracion");

/**
 * Configuración inicial desde la web (sin Postman), jerarquía
 * Dueño > Administrador > Barbero, recuperación de acceso y medidas de
 * seguridad del inicio de sesión.
 */
describe("Configuración inicial, dueño del negocio y seguridad", () => {
    const CODIGO = "instalacion-de-prueba-123";
    let tokenDueño, tokenAdmin, tokenBarbero;
    let idDueño, idAdmin, idBarberoUsuario;
    let codigoRecuperacion;

    const login = (email, password) => request(app).post("/api/auth/login").send({ email, password });
    const conToken = (token) => ({ Authorization: `Bearer ${token}` });

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        process.env.CODIGO_INSTALACION = CODIGO;
    });

    afterAll(async () => {
        delete process.env.CODIGO_INSTALACION;
        await sequelize.close();
    });

    describe("Configuración inicial", () => {
        test("informa que el sistema aún no está configurado y que pide código", async () => {
            const res = await request(app).get("/api/auth/estado-instalacion");
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ instalado: false, requiereCodigo: true, disponible: true });
        });

        test("rechaza un código de instalación incorrecto", async () => {
            const res = await request(app).post("/api/auth/configuracion-inicial").send({
                nombre: "Dueño", email: "dueno@test.com", password: "ClaveSegura1", codigoInstalacion: "otro",
            });
            expect(res.status).toBe(403);
        });

        test("exige una contraseña de 8 caracteres con letras y números", async () => {
            const corta = await request(app).post("/api/auth/configuracion-inicial").send({
                nombre: "Dueño", email: "dueno@test.com", password: "abc12", codigoInstalacion: CODIGO,
            });
            expect(corta.status).toBe(400);
            expect(corta.body.message).toMatch(/8 caracteres/);

            const sinNumeros = await request(app).post("/api/auth/configuracion-inicial").send({
                nombre: "Dueño", email: "dueno@test.com", password: "solamenteletras", codigoInstalacion: CODIGO,
            });
            expect(sinNumeros.status).toBe(400);
            expect(sinNumeros.body.message).toMatch(/letras y números/);
        });

        test("en producción sin CODIGO_INSTALACION la configuración queda deshabilitada", async () => {
            const anteriorEntorno = process.env.NODE_ENV;
            delete process.env.CODIGO_INSTALACION;
            process.env.NODE_ENV = "production";
            try {
                const estado = await request(app).get("/api/auth/estado-instalacion");
                expect(estado.body.data.disponible).toBe(false);
                const res = await request(app).post("/api/auth/configuracion-inicial").send({
                    nombre: "Intruso", email: "intruso@test.com", password: "ClaveSegura1",
                });
                expect(res.status).toBe(403);
            } finally {
                process.env.NODE_ENV = anteriorEntorno;
                process.env.CODIGO_INSTALACION = CODIGO;
            }
        });

        test("crea al dueño, guarda el nombre del negocio y entrega un código de recuperación", async () => {
            const res = await request(app).post("/api/auth/configuracion-inicial").send({
                nombreNegocio: "Barbería El Primo",
                nombre: "Dueño Prueba",
                email: "  Dueno@Test.com ",
                password: "ClaveSegura1",
                codigoInstalacion: CODIGO,
            });
            expect(res.status).toBe(201);
            expect(res.body.data.usuario.esPropietario).toBe(true);
            expect(res.body.data.usuario.email).toBe("dueno@test.com");
            expect(res.body.data.usuario.password).toBeUndefined();
            expect(res.body.data.usuario.recuperacionHash).toBeUndefined();
            expect(res.body.data.codigoRecuperacion).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
            codigoRecuperacion = res.body.data.codigoRecuperacion;
            idDueño = res.body.data.usuario.id;

            const config = await Configuracion.findOne();
            expect(config.nombreNegocio).toBe("Barbería El Primo");
        });

        test("no se puede configurar dos veces (ni por la ruta anterior)", async () => {
            const res = await request(app).post("/api/auth/configuracion-inicial").send({
                nombre: "Otro", email: "otro@test.com", password: "ClaveSegura1", codigoInstalacion: CODIGO,
            });
            expect(res.status).toBe(409);

            const anterior = await request(app).post("/api/auth/register").send({
                nombre: "Otro", email: "otro@test.com", password: "ClaveSegura1", codigoInstalacion: CODIGO,
            });
            expect(anterior.status).toBe(409);

            const estado = await request(app).get("/api/auth/estado-instalacion");
            expect(estado.body.data.instalado).toBe(true);
        });

        test("el inicio de sesión no distingue mayúsculas en el correo", async () => {
            const res = await login("DUENO@test.com", "ClaveSegura1");
            expect(res.status).toBe(200);
            tokenDueño = res.body.data.token;
        });
    });

    describe("Jerarquía Dueño > Administrador > Barbero", () => {
        test("el dueño crea un administrador y un barbero con su cuenta", async () => {
            const admin = await request(app).post("/api/auth/usuarios").set(conToken(tokenDueño)).send({
                nombre: "Admin Uno", email: "admin1@test.com", password: "ClaveAdmin1", rol: "admin",
            });
            expect(admin.status).toBe(201);
            idAdmin = admin.body.data.id;

            const barbero = await request(app).post("/api/barberos").set(conToken(tokenDueño)).send({
                nombre: "Barbero Uno", telefono: "3001234567", correo: "barbero1@test.com", especialidad: "Cortes", estado: "Activo",
            });
            expect(barbero.status).toBe(201);
            const { passwordTemporal } = barbero.body.data;

            const usuarios = await request(app).get("/api/auth/usuarios").set(conToken(tokenDueño));
            idBarberoUsuario = usuarios.body.data.find((u) => u.rol === "barbero").id;

            tokenAdmin = (await login("admin1@test.com", "ClaveAdmin1")).body.data.token;
            tokenBarbero = (await login("barbero1@test.com", passwordTemporal)).body.data.token;
            expect(tokenAdmin).toBeTruthy();
            expect(tokenBarbero).toBeTruthy();
        });

        test("un administrador normal no puede crear administradores", async () => {
            const res = await request(app).post("/api/auth/usuarios").set(conToken(tokenAdmin)).send({
                nombre: "Admin Dos", email: "admin2@test.com", password: "ClaveAdmin2", rol: "admin",
            });
            expect(res.status).toBe(403);
        });

        test("nadie puede desactivar al dueño ni restablecer su contraseña", async () => {
            const desactivar = await request(app).put(`/api/auth/usuarios/${idDueño}`).set(conToken(tokenAdmin)).send({ activo: false });
            expect(desactivar.status).toBe(403);

            const restablecer = await request(app).put(`/api/auth/usuarios/${idDueño}/restablecer-password`).set(conToken(tokenAdmin));
            expect(restablecer.status).toBe(403);

            const propio = await request(app).put(`/api/auth/usuarios/${idDueño}`).set(conToken(tokenDueño)).send({ activo: false });
            expect(propio.status).toBe(400);
        });

        test("un administrador normal no puede desactivarse a sí mismo", async () => {
            const res = await request(app).put(`/api/auth/usuarios/${idAdmin}`).set(conToken(tokenAdmin)).send({ activo: false });
            expect(res.status).toBe(400);
        });

        test("desactivar una cuenta cierra su sesión de inmediato", async () => {
            const antes = await request(app).get("/api/auth/me").set(conToken(tokenBarbero));
            expect(antes.status).toBe(200);

            const res = await request(app).put(`/api/auth/usuarios/${idBarberoUsuario}`).set(conToken(tokenAdmin)).send({ activo: false });
            expect(res.status).toBe(200);

            const despues = await request(app).get("/api/agenda").set(conToken(tokenBarbero));
            expect(despues.status).toBe(401);
        });

        test("restablecer la contraseña de un administrador solo lo hace el dueño y cierra su sesión", async () => {
            const res = await request(app).put(`/api/auth/usuarios/${idAdmin}/restablecer-password`).set(conToken(tokenDueño));
            expect(res.status).toBe(200);
            expect(res.body.data.passwordTemporal).toMatch(/^.{10}$/);

            const sesionVieja = await request(app).get("/api/auth/me").set(conToken(tokenAdmin));
            expect(sesionVieja.status).toBe(401);

            tokenAdmin = (await login("admin1@test.com", res.body.data.passwordTemporal)).body.data.token;
            expect(tokenAdmin).toBeTruthy();
        });
    });

    describe("Recuperación de acceso del dueño", () => {
        test("rechaza un código equivocado sin revelar si el correo existe", async () => {
            const malo = await request(app).post("/api/auth/recuperar-acceso").send({
                email: "dueno@test.com", codigoRecuperacion: "AAAA-BBBB-CCCC-DDDD", passwordNueva: "NuevaClave9",
            });
            const inexistente = await request(app).post("/api/auth/recuperar-acceso").send({
                email: "nadie@test.com", codigoRecuperacion: codigoRecuperacion, passwordNueva: "NuevaClave9",
            });
            expect(malo.status).toBe(400);
            expect(inexistente.status).toBe(400);
            expect(malo.body.message).toBe(inexistente.body.message);
        });

        test("un administrador normal no puede recuperar acceso con código", async () => {
            const res = await request(app).post("/api/auth/recuperar-acceso").send({
                email: "admin1@test.com", codigoRecuperacion: codigoRecuperacion, passwordNueva: "NuevaClave9",
            });
            expect(res.status).toBe(400);
        });

        test("con el código correcto (sin importar guiones ni minúsculas) cambia la contraseña y entrega un código nuevo", async () => {
            const res = await request(app).post("/api/auth/recuperar-acceso").send({
                email: "dueno@test.com",
                codigoRecuperacion: codigoRecuperacion.toLowerCase().replace(/-/g, " "),
                passwordNueva: "NuevaClave9",
            });
            expect(res.status).toBe(200);
            expect(res.body.data.codigoRecuperacion).not.toBe(codigoRecuperacion);

            // La sesión anterior se cerró
            const vieja = await request(app).get("/api/auth/me").set(conToken(tokenDueño));
            expect(vieja.status).toBe(401);

            expect((await login("dueno@test.com", "ClaveSegura1")).status).toBe(401);
            const nuevo = await login("dueno@test.com", "NuevaClave9");
            expect(nuevo.status).toBe(200);
            tokenDueño = nuevo.body.data.token;

            // El código usado ya no sirve
            const repetido = await request(app).post("/api/auth/recuperar-acceso").send({
                email: "dueno@test.com", codigoRecuperacion, passwordNueva: "OtraClave99",
            });
            expect(repetido.status).toBe(400);
            codigoRecuperacion = res.body.data.codigoRecuperacion;
        });

        test("generar un código nuevo exige la contraseña del dueño", async () => {
            const sinClave = await request(app).post("/api/auth/codigo-recuperacion").set(conToken(tokenDueño)).send({ password: "mala" });
            expect(sinClave.status).toBe(400);

            const res = await request(app).post("/api/auth/codigo-recuperacion").set(conToken(tokenDueño)).send({ password: "NuevaClave9" });
            expect(res.status).toBe(200);
            expect(res.body.data.codigoRecuperacion).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);

            const admin = await request(app).post("/api/auth/codigo-recuperacion").set(conToken(tokenAdmin)).send({ password: "x" });
            expect(admin.status).toBe(403);
        });
    });

    describe("Traspaso de la propiedad", () => {
        test("un administrador normal no puede traspasar la propiedad", async () => {
            const res = await request(app).post("/api/auth/transferir-propiedad").set(conToken(tokenAdmin)).send({ usuarioId: idAdmin, password: "x" });
            expect(res.status).toBe(403);
        });

        test("no se traspasa a una cuenta de barbero", async () => {
            const res = await request(app).post("/api/auth/transferir-propiedad").set(conToken(tokenDueño)).send({ usuarioId: idBarberoUsuario, password: "NuevaClave9" });
            expect(res.status).toBe(400);
        });

        test("el dueño traspasa la propiedad a otro administrador", async () => {
            const res = await request(app).post("/api/auth/transferir-propiedad").set(conToken(tokenDueño)).send({ usuarioId: idAdmin, password: "NuevaClave9" });
            expect(res.status).toBe(200);
            expect(res.body.data.nuevoDueño.id).toBe(idAdmin);
            expect(res.body.data.codigoRecuperacion).toBeTruthy();

            // El anterior dueño sigue siendo administrador, pero ya no crea administradores
            const crear = await request(app).post("/api/auth/usuarios").set(conToken(tokenDueño)).send({
                nombre: "Admin Tres", email: "admin3@test.com", password: "ClaveAdmin3", rol: "admin",
            });
            expect(crear.status).toBe(403);

            const perfil = await request(app).get("/api/auth/me").set(conToken(tokenAdmin));
            expect(perfil.body.data.esPropietario).toBe(true);
        });
    });

    describe("Medidas de seguridad", () => {
        test("la API envía cabeceras de seguridad y no anuncia su tecnología", async () => {
            const res = await request(app).get("/api/publico/servicios");
            expect(res.headers["x-powered-by"]).toBeUndefined();
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(res.headers["content-security-policy"]).toMatch(/default-src 'none'/);
        });

        test("un JSON mal formado responde 400 sin detalles internos", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .set("Content-Type", "application/json")
                .send('{"email": ');
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("El cuerpo de la petición no es JSON válido.");
        });

        test("un token firmado con otra clave no da acceso", async () => {
            const jwt = require("jsonwebtoken");
            const falso = jwt.sign({ id: idAdmin, rol: "admin", v: 0 }, "otra-clave");
            const res = await request(app).get("/api/auth/usuarios").set(conToken(falso));
            expect(res.status).toBe(401);
        });

        test("el inicio de sesión se bloquea tras 10 intentos seguidos desde la misma IP", async () => {
            process.env.DESACTIVAR_LIMITE = "false";
            try {
                let ultimo;
                for (let i = 0; i < 11; i++) ultimo = await login("dueno@test.com", "ClaveIncorrecta1");
                expect(ultimo.status).toBe(429);
                expect(ultimo.headers["retry-after"]).toBeTruthy();
            } finally {
                process.env.DESACTIVAR_LIMITE = "true";
            }
        });
    });
});
