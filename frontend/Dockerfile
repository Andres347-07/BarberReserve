# ── BarberReserve · Frontend (React + Vite) ───────────────────────────────
#
# Build en dos etapas: la primera compila la SPA con Vite; la segunda solo
# copia el resultado (dist/) a un servidor Nginx liviano. La imagen final
# no contiene Node, npm ni node_modules — únicamente Nginx y los archivos
# estáticos ya construidos, lista para producción.

# ── Etapa 1: construcción ────────────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite incrusta las variables VITE_* en el bundle en tiempo de build (no
# se pueden cambiar después, a diferencia de una variable de entorno de
# backend). Por eso se recibe como build-arg: docker-compose la pasa en
# `build.args`, con el mismo valor por defecto que ya usaba el proyecto en
# desarrollo local si no se especifica otro.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Etapa 2: servidor de archivos estáticos ───────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
