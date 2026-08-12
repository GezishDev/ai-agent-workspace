FROM node:22-alpine AS builder

WORKDIR /app

# Accept build-time URL so Vite can bake it into the bundle
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Serve the static build with a minimal HTTP server ──
FROM node:22-alpine AS runtime

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
