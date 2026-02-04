# Multi-stage build for IHatePDF
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies
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

# Install ALL dependencies
RUN npm ci

# Copy backend source
COPY src/ ./src/

# Build backend
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

# Install system dependencies BEFORE npm install
RUN apk add --no-cache \
    ghostscript \
    vips-dev \
    fftw-dev \
    build-base \
    python3 \
    pkgconfig \
    gcc \
    g++ \
    make \
    libc6-compat \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (sharp will build with the tools above)
RUN npm ci --omit=dev

# Copy backend build
COPY --from=backend-builder /app/dist ./dist

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "dist/index.js"]