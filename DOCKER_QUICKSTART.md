# Docker Quick Start 🐳

## One-Command Deploy

```bash
docker-compose up -d
```

Access at: **http://localhost:3000**

---

## Essential Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build
```

---

## Manual Docker Commands

```bash
# Build
docker build -t ihatepdf .

# Run
docker run -d -p 3000:3000 --name ihatepdf ihatepdf

# Stop
docker stop ihatepdf

# Remove
docker rm ihatepdf
```

---

## Configuration

Edit `.env` file or set in `docker-compose.yml`:

```bash
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=104857600
```

---

## Troubleshooting

```bash
# View logs
docker-compose logs

# Check status
docker-compose ps

# Restart from scratch
docker-compose down -v
docker-compose up -d --build
```

---

## Full Documentation

See [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md) for complete guide.
