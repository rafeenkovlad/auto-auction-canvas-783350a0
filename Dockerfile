# syntax=docker/dockerfile:1

# --- Build stage: install deps and build the TanStack Start SSR bundle ---
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Build the Nitro node-server output (preset is set in vite.config.ts).
COPY . .
RUN bun run build

# --- Runtime stage: only the self-contained Nitro output runs here ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server/index.mjs"]