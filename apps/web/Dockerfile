# =====================================================================
# Dockerfile para apps/web (Next.js 15 App Router + React 19)
# =====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests del monorepo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/map3d/package.json ./packages/map3d/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY packages/shared/ ./packages/shared/
COPY packages/map3d/ ./packages/map3d/
COPY apps/web/ ./apps/web/

# Construir paquetes compartidos
RUN npm run build -w @marq/shared
RUN npm run build -w @marq/map3d

# Construir aplicación web en modo standalone
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @marq/web

# Stage 2: Runtime de producción (Next.js Standalone)
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar archivos estáticos y bundle standalone generado por Next.js
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
