# ---- Build Stage ----
FROM node:20-alpine AS builder

# Build tools required for native modules (bcrypt, sharp, etc.)
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Remove dev dependencies but keep compiled native modules
RUN npm prune --omit=dev && npm cache clean --force

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN apk add --no-cache tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs package.json ./

# Tini ensures signals (SIGTERM, SIGINT) are properly forwarded
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE 5000

USER nodejs

CMD ["node", "--max-http-header-size=1000000", "src/server.js"]
