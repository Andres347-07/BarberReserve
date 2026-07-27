# ── BarberReserve · Backend (Node.js + Express) ──────────────────────────
#
# Se usa node:20-slim (basado en Debian/glibc) en lugar de una imagen
# "alpine" a propósito: el paquete `bcrypt` usa un binario nativo
# precompilado para glibc y, en musl (Alpine), Node tendría que compilarlo
# desde el código fuente en cada build, lo que exige instalar python3,
# make y g++ y vuelve el build mucho más lento y frágil. `slim` evita ese
# problema por completo mientras mantiene la imagen liviana.

FROM node:20-slim

WORKDIR /app

# Se copian primero solo los manifiestos para aprovechar el cache de Docker:
# si package*.json no cambia, en el próximo build no se reinstalan las
# dependencias aunque cambie el código fuente.
COPY package*.json ./

# --omit=dev: no se instalan jest/nodemon/supertest en la imagen de
# ejecución; solo se usan en desarrollo local, no en el contenedor.
RUN npm ci --omit=dev

# Se copia el resto del código (ver .dockerignore para lo que se excluye).
COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
