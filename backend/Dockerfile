# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files and source code
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY shared/ ./shared/
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma/

# Install all dependencies (including dev)
RUN npm ci

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist/
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules/
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./backend/
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma/
COPY --from=builder --chown=nodejs:nodejs /app/shared/dist ./shared/dist/
COPY --from=builder --chown=nodejs:nodejs /app/shared/node_modules ./shared/node_modules/
COPY --from=builder --chown=nodejs:nodejs /app/shared/package.json ./shared/

# Create uploads directory
RUN mkdir -p /app/uploads && chown nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]