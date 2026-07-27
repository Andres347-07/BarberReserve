const request = require("supertest");
const sequelize = require("../database/connection");
const app = require("../app");

describe("Autenticación y control de acceso por rol", () => {
    let tokenAdmin;
    let tokenBarbero;
    let barberoId;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("registra el primer administrador (bootstrap)", async () => {
        const res = await request(app).post("/api/auth/register").send({
            nombre: "Diego Admin",
            email: "admin@test.com",
            password: "admin123",
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.rol).toBe("admin");
    });

    test("rechaza un segundo registro público de administrador", async () => {
        const res = await request(app).post("/api/auth/register").send({
            nombre: "Otro",
            email: "otro@test.com",
            password: "123456",
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("permite iniciar sesión con credenciales correctas", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "admin@test.com",
            password: "admin123",
        });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
        tokenAdmin = res.body.data.token;
    });

    test("rechaza credenciales incorrectas", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "admin@test.com",
            password: "incorrecta",
        });

        expect(res.status).toBe(401);
    });

    test("rechaza el acceso a rutas protegidas sin token", async () => {
        const res = await request(app).get("/api/clientes");
        expect(res.status).toBe(401);
    });

    let passwordTemporalBarbero;

    test("el admin puede crear un barbero (y el sistema crea automáticamente su usuario)", async () => {
        const res = await request(app)
            .post("/api/barberos")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                nombre: "Andres Soto",
                especialidad: "Fade",
                telefono: "3000000000",
                correo: "andres@test.com",
            });

        expect(res.status).toBe(201);
        barberoId = res.body.data.id;
        passwordTemporalBarbero = res.body.data.passwordTemporal;
        expect(passwordTemporalBarbero).toBeDefined();
    });

    test("el barbero puede iniciar sesión con la contraseña temporal generada automáticamente", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "andres@test.com",
            password: passwordTemporalBarbero,
        });

        expect(res.status).toBe(200);
        tokenBarbero = res.body.data.token;
    });

    test("un barbero NO puede crear otro barbero (403)", async () => {
        const res = await request(app)
            .post("/api/barberos")
            .set("Authorization", `Bearer ${tokenBarbero}`)
            .send({ nombre: "X", especialidad: "X", telefono: "1", correo: "x@test.com" });

        expect(res.status).toBe(403);
    });

    test("un barbero NO puede consultar el listado de /api/reservas (lo hace desde Agenda)", async () => {
        const res = await request(app)
            .get("/api/reservas")
            .set("Authorization", `Bearer ${tokenBarbero}`);

        expect(res.status).toBe(403);
    });

    test("un barbero SÍ puede consultar su propia agenda", async () => {
        const hoy = new Date().toISOString().slice(0, 10);

        const res = await request(app)
            .get(`/api/agenda?fecha=${hoy}`)
            .set("Authorization", `Bearer ${tokenBarbero}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test.each([
        ["/api/clientes", "GET"],
        ["/api/barberos", "GET"],
        ["/api/servicios", "GET"],
        ["/api/horarios", "GET"],
    ])("un barbero NO tiene acceso a %s (%s) — módulo exclusivo del administrador", async (ruta) => {
        const res = await request(app)
            .get(ruta)
            .set("Authorization", `Bearer ${tokenBarbero}`);

        expect(res.status).toBe(403);
    });
});
