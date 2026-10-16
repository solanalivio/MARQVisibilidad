# =====================================================================
# Dockerfile para apps/api (NestJS + Prisma + PostgreSQL)
# =====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar y prisma
RUN apk add --no-cache openssl

# Copiar archivos de configuración del monorepo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/map3d/package.json ./packages/map3d/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instalar dependencias para construir
RUN npm ci

# Copiar código fuente
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Construir @marq/shared
RUN npm run build -w @marq/shared

# Generar cliente de Prisma y construir @marq/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime de producción
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV PORT=3001

# Copiar manifests y artefactos compilados desde el builder
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
