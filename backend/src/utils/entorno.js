/** Producción: NODE_ENV=production (lo define render.yaml). */
function esProduccion() {
    return process.env.NODE_ENV === "production";
}

module.exports = { esProduccion };
