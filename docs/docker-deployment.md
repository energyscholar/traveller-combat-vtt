# Docker Deployment Guide
**Version:** 1.0
**Created:** Session 4 (2025-11-13)
**Target Platforms:** Docker, Docker Compose, Azure App Service, Kubernetes

---

## Overview

The Traveller Combat VTT is fully containerized using Docker for easy deployment across any platform that supports containers:
- Local development with Docker
- Production deployment with docker-compose
- Azure App Service
- Kubernetes clusters
- Any container orchestration platform

**Files:**
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Dev + prod configurations
- `.dockerignore` - Build optimization

---

## Quick Start

### Prerequisites

- Docker 20.10+ installed
- docker-compose 2.0+ installed (optional, for multi-service)

### Build and Run

```bash
# Build image
docker build -t traveller-vtt .

# Run container
docker run -d -p 3000:3000 --name traveller-vtt traveller-vtt

# View logs
docker logs -f traveller-vtt

# Stop container
docker stop traveller-vtt

# Remove container
docker rm traveller-vtt
```

### Using Docker Compose

```bash
# Development mode (with live reload)
docker-compose up app-dev

# Production mode
docker-compose up -d app-prod

# View logs
docker-compose logs -f app-prod

# Stop services
docker-compose down
```

---

## Dockerfile Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimal image size:

**Stage 1: Dependencies**
```dockerfile
FROM node:18-alpine AS dependencies
# Install production dependencies only
# Use npm ci for reproducible builds
# Clean npm cache to reduce size
```

**Stage 2: Runtime**
```dockerfile
FROM node:18-alpine AS runtime
# Copy dependencies from build stage
# Run as non-root user (nodejs:nodejs)
# Use dumb-init for proper signal handling
# Built-in health check
```

### Security Features

- **Non-root User:** Runs as `nodejs` user (UID 1001)
- **Minimal Base Image:** Alpine Linux (small attack surface)
- **dumb-init:** Proper signal handling and zombie reaping
- **No Secrets in Image:** Environment variables passed at runtime

### Health Check

Built-in Docker health check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

**Endpoints:**
- `/health` - Liveness probe (is container alive?)
- `/ready` - Readiness probe (can container accept traffic?)

---

## Docker Compose Configuration

### Development Service (`app-dev`)

**Features:**
- Source code mounted as volume
- Live reload on code changes
- Development environment variables
- Port 3000 exposed

**Start:**
```bash
docker-compose up app-dev
```

**Access:**
```
http://localhost:3000
```

### Production Service (`app-prod`)

**Features:**
- Optimized build (no source mounting)
- Production environment variables
- Resource limits (512M RAM, 1 CPU)
- Auto-restart policy
- Health checks every 30s

**Start:**
```bash
docker-compose up -d app-prod
```

---

## Environment Variables

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level |
| `MAX_CONNECTIONS` | `1000` | Max concurrent connections |

### Setting Variables

**Docker Run:**
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --name traveller-vtt \
  traveller-vtt
```

**Docker Compose:**
```yaml
services:
  app-prod:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=warn
```

---

## Deployment Platforms

### Local Development

```bash
# Build
docker build -t traveller-vtt .

# Run
docker run -d -p 3000:3000 traveller-vtt

# Test
curl http://localhost:3000/health
```

### Azure App Service

#### Prerequisites
- Azure CLI installed
- Azure Container Registry (ACR) created

#### Steps

1. **Build and Tag Image:**
```bash
docker build -t traveller-vtt .
docker tag traveller-vtt myregistry.azurecr.io/traveller-vtt:latest
```

2. **Push to Azure Container Registry:**
```bash
az acr login --name myregistry
docker push myregistry.azurecr.io/traveller-vtt:latest
```

3. **Create App Service:**
```bash
az appservice plan create \
  --name traveller-vtt-plan \
  --resource-group myResourceGroup \
  --is-linux \
  --sku B1

az webapp create \
  --name traveller-vtt-app \
  --plan traveller-vtt-plan \
  --resource-group myResourceGroup \
  --deployment-container-image-name myregistry.azurecr.io/traveller-vtt:latest
```

4. **Configure Health Checks:**
```bash
az webapp config set \
  --name traveller-vtt-app \
  --resource-group myResourceGroup \
  --health-check-path /health
```

5. **Set Environment Variables:**
```bash
az webapp config appsettings set \
  --name traveller-vtt-app \
  --resource-group myResourceGroup \
  --settings NODE_ENV=production PORT=8080
```

**Note:** Azure App Service uses port 8080 by default. Set `PORT=8080` environment variable.

---

### Google Cloud Run

```bash
# Build and push to Google Container Registry
docker build -t gcr.io/myproject/traveller-vtt .
docker push gcr.io/myproject/traveller-vtt

# Deploy
gcloud run deploy traveller-vtt \
  --image gcr.io/myproject/traveller-vtt \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1
```

---

### AWS ECS/Fargate

```bash
# Create ECR repository
aws ecr create-repository --repository-name traveller-vtt

# Build and push
docker build -t traveller-vtt .
docker tag traveller-vtt:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest

# Create ECS task definition (task-definition.json)
# Create ECS service
aws ecs create-service \
  --cluster my-cluster \
  --service-name traveller-vtt \
  --task-definition traveller-vtt:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

---

### Kubernetes

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traveller-vtt
spec:
  replicas: 2
  selector:
    matchLabels:
      app: traveller-vtt
  template:
    metadata:
      labels:
        app: traveller-vtt
    spec:
      containers:
      - name: traveller-vtt
        image: myregistry/traveller-vtt:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: traveller-vtt-service
spec:
  selector:
    app: traveller-vtt
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Deploy:**
```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl get services
```

---

## Health Checks

### Liveness Probe (`/health`)

**Purpose:** Detect if container is alive and should be restarted

**Response (200 OK):**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-11-13T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

**Usage:**
```bash
curl http://localhost:3000/health
```

---

### Readiness Probe (`/ready`)

**Purpose:** Detect if container can accept traffic

**Response (200 OK - Ready):**
```json
{
  "status": "ready",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "checks": {
    "serverListening": true,
    "gameStateInitialized": true,
    "socketIOReady": true
  }
}
```

**Response (503 Service Unavailable - Not Ready):**
```json
{
  "status": "not ready",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "checks": {
    "serverListening": true,
    "gameStateInitialized": false,
    "socketIOReady": true
  }
}
```

**Usage:**
```bash
curl http://localhost:3000/ready
```

---

## Resource Limits

### Recommended Limits

| Deployment | CPU | Memory | Connections |
|------------|-----|--------|-------------|
| Dev/Test | 0.5 CPU | 256 MB | 10 |
| Small Prod | 1 CPU | 512 MB | 100 |
| Medium Prod | 2 CPU | 1 GB | 500 |
| Large Prod | 4 CPU | 2 GB | 1000+ |

### Setting Limits

**docker-compose.yml:**
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

**Kubernetes:**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs traveller-vtt
```

**Common issues:**
- Port 3000 already in use
- Missing environment variables
- Insufficient memory

### Health Check Failing

**Test health endpoint:**
```bash
docker exec traveller-vtt curl http://localhost:3000/health
```

**Check if server is listening:**
```bash
docker exec traveller-vtt netstat -tlnp
```

### Performance Issues

**Check resource usage:**
```bash
docker stats traveller-vtt
```

**Increase limits:**
```bash
docker update --memory 1g --cpus 2 traveller-vtt
```

### Access Logs

**View logs:**
```bash
# Docker
docker logs -f traveller-vtt

# Docker Compose
docker-compose logs -f app-prod

# Kubernetes
kubectl logs -f deployment/traveller-vtt
```

---

## Best Practices

### 1. Use Multi-Stage Builds
- Smaller final image
- Faster builds with layer caching
- Separate build and runtime dependencies

### 2. Run as Non-Root
- Security best practice
- Prevents privilege escalation
- Required by some platforms (Azure, GKE)

### 3. Implement Health Checks
- Automatic restart on failure
- Traffic routing based on readiness
- Better orchestration integration

### 4. Set Resource Limits
- Prevents resource exhaustion
- Predictable performance
- Cost control

### 5. Use Environment Variables
- Never hard-code configuration
- Different configs per environment
- Easier secret management

### 6. Monitor and Log
- Structured logging (JSON)
- External log aggregation
- Metrics collection (Prometheus)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Build Docker image
      run: docker build -t traveller-vtt .

    - name: Run tests
      run: docker run traveller-vtt npm test

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker tag traveller-vtt myregistry/traveller-vtt:latest
        docker push myregistry/traveller-vtt:latest
```

---

## Security Considerations

### Image Security

- Use official Node.js base images
- Scan for vulnerabilities: `docker scan traveller-vtt`
- Keep base image updated
- Don't include secrets in image

### Runtime Security

- Run as non-root user
- Use read-only root filesystem (if possible)
- Drop unnecessary capabilities
- Network policies in Kubernetes

### Secrets Management

**Don't:**
```dockerfile
# BAD - secrets in image
ENV DATABASE_PASSWORD=secret123
```

**Do:**
```bash
# Good - secrets at runtime
docker run -e DATABASE_PASSWORD=$DB_PASS traveller-vtt
```

Or use secret management:
- Kubernetes Secrets
- Azure Key Vault
- AWS Secrets Manager

---

## Performance Optimization

### Image Size

**Current size:** ~150-200 MB (Alpine-based)

**Optimization techniques:**
- Multi-stage build ✅
- Alpine base image ✅
- npm ci --only=production ✅
- npm cache clean ✅
- .dockerignore ✅

### Build Speed

**Layer caching:**
- Copy package.json first
- Install dependencies
- Copy source code last
- Faster rebuilds when code changes

### Runtime Performance

- Use production Node.js (NODE_ENV=production)
- Enable compression
- Set appropriate resource limits
- Monitor with health checks

---

## Support & Resources

**Files:**
- `Dockerfile` - Production build configuration
- `docker-compose.yml` - Multi-service orchestration
- `.dockerignore` - Build context optimization
- `server.js` - Health check endpoints

**Tests:**
- `tests/integration/health-endpoints.test.js` - Health check tests

**Documentation:**
- This file (docker-deployment.md)
- export-import-api.md - Data export/import
- README.md - Project overview

**External Resources:**
- [Docker Documentation](https://docs.docker.com/)
- [Azure App Service Containers](https://docs.microsoft.com/azure/app-service/containers/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

**Created:** Session 4 (2025-11-13)
**Last Updated:** 2025-11-13
**Version:** 1.0
