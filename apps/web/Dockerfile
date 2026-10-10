# syntax=docker/dockerfile:1
# Build context is the repository ROOT (see docker-compose.yaml / docker-compose.prod.yaml).

# -------- Builder --------
FROM node:24-alpine AS builder

RUN corepack enable pnpm && corepack install -g pnpm@10.11.1

WORKDIR /fio

# Manifests only, so the install layer is cached until dependencies change.
# NOTE: pnpm-lock.yaml must exist at the repo root, otherwise this COPY fails.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages packages

# Static SPA build -> /fio/apps/web/dist (public/ is copied into dist by Vite).
# Relative URL keeps the browser on the same origin; nginx proxies /api to the api container.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm turbo build --filter=@fio/web

# -------- Production (static files served by nginx) --------
FROM nginx:alpine AS prod

RUN apk add --no-cache curl

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /fio/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# -------- Dev (Vite dev server with hot reload, repo is bind-mounted) --------
FROM node:24-alpine AS dev

RUN apk add --no-cache curl bash git

RUN corepack enable pnpm && corepack install -g pnpm@10.11.1

WORKDIR /fio

CMD ["pnpm", "turbo", "start:dev", "--filter=@fio/web", "--", "--host", "0.0.0.0", "--port", "5173"]
