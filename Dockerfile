# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files only (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force


# ─── Stage 2: Build / Test ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Run lint check (CI gate)
# RUN npm run lint

# ─── Stage 3: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeapp -u 1001 -G nodejs

WORKDIR /app

# Copy production deps from stage 1
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy source from builder
COPY --chown=nodeapp:nodejs src/ ./src/
COPY --chown=nodeapp:nodejs package*.json ./

# Create logs directory with correct permissions
RUN mkdir -p logs && chown nodeapp:nodejs logs

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3000

# Health check for Docker / Docker Compose
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
