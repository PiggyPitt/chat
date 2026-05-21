# ─────────────────────────────────────────────────────────────
# Stage 1 — builder: install all deps, compile backend + frontend
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# bcrypt requires native compilation
RUN apk add --no-cache python3 make g++

# Backend dependencies
COPY package*.json ./
RUN npm ci

# Build backend TypeScript → dist/
COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# Frontend dependencies + build
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Strip devDependencies before copying to runtime
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────
# Stage 2 — runtime: minimal production image
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

RUN mkdir -p uploads

EXPOSE 4000
ENV NODE_ENV=production

CMD ["node", "dist/presentation/server/server.js"]
