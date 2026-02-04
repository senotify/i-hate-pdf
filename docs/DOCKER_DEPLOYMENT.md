# Docker Deployment Guide

Complete guide for deploying IHatePDF using Docker and Docker Compose.

---

## 📋 Prerequisites

- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)
- 2GB+ RAM available
- 5GB+ disk space

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-username/i-hate-pdf.git
cd i-hate-pdf
```

### 2. Configure Environment (Optional)

```bash
# Copy environment template
cp .env.docker .env

# Edit with your settings (optional)
nano .env
```

### 3. Build and Run

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

Open your browser to: **http://localhost:3000**

---

## 🐳 Docker Commands

### Basic Operations

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs
docker-compose logs -f

# View logs for last 100 lines
docker-compose logs --tail=100 -f

# Check container status
docker-compose ps

# Execute command in container
docker-compose exec ihatepdf sh
```

### Build Operations

```bash
# Build image
docker-compose build

# Build without cache (clean build)
docker-compose build --no-cache

# Pull latest base images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Maintenance

```bash
# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# View resource usage
docker stats ihatepdf

# Clean up unused Docker resources
docker system prune -a
```

---

## 📦 Docker Image Details

### Multi-Stage Build

The Dockerfile uses a 3-stage build process:

1. **Frontend Builder** - Builds React frontend
2. **Backend Builder** - Compiles TypeScript backend
3. **Production** - Minimal runtime image

### Image Size

- **Base Image:** node:20-alpine (~40MB)
- **With Dependencies:** ~200-250MB
- **Final Image:** ~300-350MB

### Included Software

- Node.js 20 (Alpine Linux)
- Ghostscript (PDF compression & conversion)
- Sharp dependencies (image processing)
- Production npm packages only

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file or set in `docker-compose.yml`:

```bash
# Required
NODE_ENV=production
PORT=3000

# Optional - Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional - File Upload
MAX_FILE_SIZE=104857600  # 100MB

# Optional - Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_REQUESTS=50

# Optional - CORS
ALLOWED_ORIGINS=https://your-domain.com
```

### Port Configuration

Change port in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000" # Host:Container
```

### Volume Mounts

Persist uploads directory:

```yaml
volumes:
  - ./uploads:/app/uploads
```

---

## 🔒 Security Considerations

### Production Deployment

1. **Use HTTPS** - Deploy behind reverse proxy (Nginx, Traefik)
2. **Set ALLOWED_ORIGINS** - Restrict CORS to your domain
3. **Limit Resources** - Set memory/CPU limits
4. **Regular Updates** - Keep base image updated

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  ihatepdf:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

### Network Security

```yaml
services:
  ihatepdf:
    networks:
      - ihatepdf-network
    # Don't expose to host network
    # Use reverse proxy instead
```

---

## 🌐 Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # File upload size limit
        client_max_body_size 100M;
    }
}
```

### Traefik Configuration

```yaml
version: "3.8"

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your@email.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"

  ihatepdf:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ihatepdf.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.ihatepdf.entrypoints=websecure"
      - "traefik.http.routers.ihatepdf.tls.certresolver=myresolver"
      - "traefik.http.services.ihatepdf.loadbalancer.server.port=3000"
```

---

## 📊 Monitoring

### Health Checks

Built-in health check endpoint:

```bash
# Check health
curl http://localhost:3000/api/health

# Docker health status
docker inspect --format='{{.State.Health.Status}}' ihatepdf
```

### Logs

```bash
# Follow logs
docker-compose logs -f

# Export logs
docker-compose logs > logs.txt

# Filter logs
docker-compose logs | grep ERROR
```

### Resource Monitoring

```bash
# Real-time stats
docker stats ihatepdf

# Detailed info
docker inspect ihatepdf
```

---

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check if port is in use
lsof -i :3000

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory

```bash
# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### Permission Issues

```bash
# Fix uploads directory permissions
chmod 777 uploads/

# Or run as specific user
docker-compose exec -u root ihatepdf chown -R node:node /app/uploads
```

### Ghostscript Not Working

```bash
# Verify Ghostscript is installed
docker-compose exec ihatepdf gs --version

# Rebuild if missing
docker-compose build --no-cache
```

### Frontend Not Loading

```bash
# Check if frontend was built
docker-compose exec ihatepdf ls -la frontend/dist

# Rebuild frontend
docker-compose build --no-cache
```

---

## 🚀 Production Deployment

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ihatepdf

# Scale service
docker service scale ihatepdf_ihatepdf=3

# Remove stack
docker stack rm ihatepdf
```

### Kubernetes

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ihatepdf
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ihatepdf
  template:
    metadata:
      labels:
        app: ihatepdf
    spec:
      containers:
        - name: ihatepdf
          image: your-registry/ihatepdf:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            limits:
              memory: "2Gi"
              cpu: "1000m"
            requests:
              memory: "512Mi"
              cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: ihatepdf-service
spec:
  selector:
    app: ihatepdf
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f k8s-deployment.yaml
```

---

## 📦 Docker Registry

### Build and Push

```bash
# Build image
docker build -t your-username/ihatepdf:latest .

# Tag for registry
docker tag your-username/ihatepdf:latest registry.example.com/ihatepdf:latest

# Push to registry
docker push registry.example.com/ihatepdf:latest
```

### Pull and Run

```bash
# Pull from registry
docker pull registry.example.com/ihatepdf:latest

# Run
docker run -d -p 3000:3000 registry.example.com/ihatepdf:latest
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/docker.yml`:

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: your-username/ihatepdf:latest
```

---

## 📝 Best Practices

1. **Use .dockerignore** - Reduce build context size
2. **Multi-stage builds** - Smaller final images
3. **Alpine base images** - Minimal attack surface
4. **Health checks** - Automatic recovery
5. **Resource limits** - Prevent resource exhaustion
6. **Volume mounts** - Persist important data
7. **Environment variables** - Configuration flexibility
8. **Regular updates** - Security patches
9. **Logging** - Monitor application behavior
10. **Reverse proxy** - SSL termination and security

---

## 🆘 Support

### Common Issues

- **Port already in use:** Change port in docker-compose.yml
- **Out of disk space:** Run `docker system prune -a`
- **Build fails:** Check Docker logs and rebuild with `--no-cache`
- **Container crashes:** Check logs with `docker-compose logs`

### Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Happy Dockerizing! 🐳**
