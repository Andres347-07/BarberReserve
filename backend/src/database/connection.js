const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Conexión a PostgreSQL.
 *
 * - En local se usan las variables DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.
 * - En la nube (Render, Neon, etc.) basta con DATABASE_URL.
 * - DB_SSL=true activa SSL. También se activa solo si la URL trae sslmode=require.
 *   La URL interna de Render no necesita SSL; la externa y la de Neon sí.
 */
const url = process.env.DATABASE_URL;
const usarSSL =
    process.env.DB_SSL === "true" || (url ? /sslmode=require/i.test(url) : false);

const opciones = {
    dialect: "postgres",
    logging: false,
    ...(usarSSL && {
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    }),
};

const sequelize = url
    ? new Sequelize(url, opciones)
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
          ...opciones,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
      });

module.exports = sequelize;
