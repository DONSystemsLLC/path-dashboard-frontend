# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine

# Install runtime dependencies for start.sh
RUN apk add --no-cache curl jq bc

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy boot script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["/start.sh"]
