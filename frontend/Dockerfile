# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (devDeps needed for Vite build)
COPY package*.json ./
RUN npm ci

# Copy source files and build the Vite app
# VITE_API_URL is relative so the nginx proxy handles routing transparently
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Replace the default nginx config with our custom SPA + proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled Vite output into nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
