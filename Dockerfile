# Multi-stage build for IHatePDF
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies (not --only=production)
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (not --only=production)
RUN npm ci

# Copy backend source
COPY src/ ./src/

# Build backend
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

# Install system dependencies (Ghostscript and Sharp dependencies)
RUN apk add --no-cache \
    ghostscript \
    vips-dev \
    fftw-dev \
    build-base \
    python3 \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy backend dependencies and build
COPY package*.json ./

# NOW use --only=production for the final image
RUN npm ci --only=production

# Copy backend build
COPY --from=backend-builder /app/dist ./dist

# Copy frontend build
COPY --from=frontend-builder /app/f