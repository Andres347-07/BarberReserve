const request = require("supertest");
const sequelize = require("../database/connection");
const app = require("../app");

describe("Flujo de contraseñas: cambio obligatorio y voluntario (12.9 / 12.10)", () => {
    let tokenAdmin, tokenBarbero, barberoId, passwordTemporalBarbero;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        await request(app).post("/api/auth/register").send({
            nombre: "Admin Password Test",
            email: "admin.password-test@test.com",
            password: "admin123",
        });

        const login = await request(app).post("/api/auth/login").send({
            email: "admin.password-test@test.com",
            password: "admin123",
        });
        tokenAdmin = login.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("el primer administrador NO queda marcado para cambiar contraseña (la eligió él mismo)", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(res.body.data.debeCambiarPassword).toBe(false);
    });

    test("un barbero recién creado SÍ queda marcado para cambiar su contraseña temporal", async () => {
        const barberoRes = await request(app)
            .post("/api/barberos")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                nombre: "Andres Password Test",
                especialidad: "Fade",
                telefono: "3160000000",
                correo: "andres.password-test@test.com",
            });

        barberoId = barberoRes.body.data.id;
        passwordTemporalBarbero = barberoRes.body.data.passwordTemporal;

        const login = await request(app).post("/api/auth/login").send({
            email: "andres.password-test@test.com",
            password: passwordTemporalBarbero,
        });

        tokenBarbero = login.body.data.token;
        expect(login.body.data.usuario.debeCambiarPassword).toBe(true);
    });

    test("rechaza el cambio de contraseña si la contraseña actual es incorrecta", async () => {
        const res = await request(app)
            .put("/api/auth/cambiar-password")
            .set("Authorization", `Bearer ${tokenBarbero}`)
            .send({ passwordActual: "incorrecta", passwordNueva: "nuevaClave123" });

        expect(res.status).toBe(400);
    });

    test("rechaza una contraseña nueva demasiado corta", async () => {
        const res = await request(app)
            .put("/api/auth/cambiar-password")
            .set("Authorization", `Bearer ${tokenBarbero}`)
            .send({ passwordActual: passwordTemporalBarbero, passwordNueva: "123" });

        expect(res.status).toBe(400);
    });

    test("el barbero puede cambiar su contraseña temporal por una propia", async () => {
        const res = await request(app)
            .put("/api/auth/cambiar-password")
            .set("Authorization", `Bearer ${tokenBarbero}`)
            .send({ passwordActual: passwordTemporalBarbero, passwordNueva: "miClaveNueva123" });

        expect(res.status).toBe(200);
        expect(res.body.data.debeCambiarPassword).toBe(false);
    });

    test("la nueva contraseña ya funciona para iniciar sesión, y la bandera queda en false", async () => {
        const login = await request(app).post("/api/auth/login").send({
            email: "andres.password-test@test.com",
            password: "miClaveNueva123",
        });

        expect(login.status).toBe(200);
        expect(login.body.data.usuario.debeCambiarPassword).toBe(false);
    });

    test("un administrador puede cambiar su propia contraseña voluntariamente (12.10)", async () => {
        const res = await request(app)
            .put("/api/auth/cambiar-password")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ passwordActual: "admin123", passwordNueva: "adminNuevaClave456" });

        expect(res.status).toBe(200);

        const login = await request(app).post("/api/auth/login").send({
            email: "admin.password-test@test.com",
            password: "adminNuevaClave456",
        });
        expect(login.status).toBe(200);
    });

    test("restablecer la contraseña de un usuario lo vuelve a marcar para cambiarla", async () => {
        const usuarios = await request(app)
            .get("/api/auth/usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`);

        const usuarioBarbero = usuarios.body.data.find((u) => u.barberoId === barberoId);

        const restablecer = await request(app)
            .put(`/api/auth/usuarios/${usuarioBarbero.id}/restablecer-password`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(restablecer.status).toBe(200);

        const login = await request(app).post("/api/auth/login").send({
            email: "andres.password-test@test.com",
            password: restablecer.body.data.passwordTemporal,
        });

        expect(login.body.data.usuario.debeCambiarPassword).toBe(true);
    });
});
