# syntax=docker/dockerfile:1.4
#
# ============================
#  Stage 1: Build Angular app
# ============================
FROM node:20-bookworm-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies (use BuildKit cache for npm folder)
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular app for production
RUN npm run build:prod

# ============================
#  Stage 2: Run with Nginx
# ============================
FROM nginx:stable-alpine

# Copy built Angular app to Nginx's default static directory
COPY --from=builder /app/dist/vuexy/ /usr/share/nginx/html/

# Copy custom 404 page
# COPY 404.html /usr/share/nginx/html/404.html

# Expose port 80
EXPOSE 80

# Optional: Replace default Nginx config to handle Angular routing (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
