# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client before compiling TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and regenerate client against the production node_modules
COPY prisma ./prisma
RUN npx prisma generate

# Copy compiled output from the build stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Push schema to database then start the server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
