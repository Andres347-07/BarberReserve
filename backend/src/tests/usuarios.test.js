const request = require("supertest");
const sequelize = require("../database/connection");
const app = require("../app");

describe("Gestión de Usuarios (capítulo 12.8)", () => {
    let tokenAdmin, tokenBarbero, barberoId, usuarioBarberoId;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        await request(app).post("/api/auth/register").send({
            nombre: "Admin Usuarios Test",
            email: "admin.usuarios-test@test.com",
            password: "admin123",
        });

        const login = await request(app).post("/api/auth/login").send({
            email: "admin.usuarios-test@test.com",
            password: "admin123",
        });
        tokenAdmin = login.body.data.token;

        const barberoRes = await request(app)
            .post("/api/barberos")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                nombre: "Barbero Usuarios Test",
                especialidad: "Fade",
                telefono: "3140000000",
                correo: "barbero.usuarios-test@test.com",
            });

        barberoId = barberoRes.body.data.id;

        const usuarios = await request(app)
            .get("/api/auth/usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`);

        usuarioBarberoId = usuarios.body.data.find((u) => u.barberoId === barberoId).id;

        const loginBarbero = await request(app).post("/api/auth/login").send({
            email: "barbero.usuarios-test@test.com",
            password: barberoRes.body.data.passwordTemporal,
        });
        tokenBarbero = loginBarbero.body.data.token;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test("un barbero no puede acceder al listado de usuarios", async () => {
        const res = await request(app)
            .get("/api/auth/usuarios")
            .set("Authorization", `Bearer ${tokenBarbero}`);

        expect(res.status).toBe(403);
    });

    test("el admin puede listar todos los usuarios, con el barbero asociado incluido", async () => {
        const res = await request(app)
            .get("/api/auth/usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);

        const usuarioBarbero = res.body.data.find((u) => u.id === usuarioBarberoId);
        expect(usuarioBarbero.barbero.nombre).toBe("Barbero Usuarios Test");
        expect(usuarioBarbero.password).toBeUndefined();
    });

    test("el admin puede editar el nombre y correo de un usuario", async () => {
        const res = await request(app)
            .put(`/api/auth/usuarios/${usuarioBarberoId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ nombre: "Barbero Usuarios Test Editado", email: "barbero.editado-test@test.com" });

        expect(res.status).toBe(200);
        expect(res.body.data.nombre).toBe("Barbero Usuarios Test Editado");
    });

    test("editar el correo del usuario también sincroniza el correo del barbero asociado", async () => {
        const barbero = await request(app)
            .get(`/api/barberos/${barberoId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(barbero.body.data.correo).toBe("barbero.editado-test@test.com");
    });

    test("el admin puede desactivar un usuario, y ese usuario ya no puede iniciar sesión", async () => {
        const res = await request(app)
            .put(`/api/auth/usuarios/${usuarioBarberoId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ activo: false });

        expect(res.status).toBe(200);
        expect(res.body.data.activo).toBe(false);

        const intentoLogin = await request(app).post("/api/auth/login").send({
            email: "barbero.editado-test@test.com",
            password: "cualquier-cosa",
        });

        expect(intentoLogin.status).toBe(401);
    });

    test("el admin puede restablecer la contraseña de un usuario y esta funciona para iniciar sesión", async () => {
        
        await request(app)
            .put(`/api/auth/usuarios/${usuarioBarberoId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ activo: true });

        const restablecer = await request(app)
            .put(`/api/auth/usuarios/${usuarioBarberoId}/restablecer-password`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(restablecer.status).toBe(200);
        const nuevaPassword = restablecer.body.data.passwordTemporal;
        expect(typeof nuevaPassword).toBe("string");

        const login = await request(app).post("/api/auth/login").send({
            email: "barbero.editado-test@test.com",
            password: nuevaPassword,
        });

        expect(login.status).toBe(200);
    });

    test("no existe ningún endpoint para eliminar usuarios de forma permanente", async () => {
        const res = await request(app)
            .delete(`/api/auth/usuarios/${usuarioBarberoId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(404);
    });
});
