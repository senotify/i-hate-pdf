# Multi-stage build for IHatePDF
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend and install dependencies
FROM node:20-alpine AS backend-builder

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
    libc6-compat

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Force sharp to use prebuilt binaries
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

RUN npm ci

COPY src/ ./src/
RUN npm run build

RUN npm prune --omit=dev

# Stage 3: Production image
FROM node:20-alpine

RUN apk add --no-cache \
    ghostscript \
    vips \
    fftw \
    libc6-compat

WORKDIR /app

COPY package*.json ./

COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p uploads && chmod 777 uploads

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]