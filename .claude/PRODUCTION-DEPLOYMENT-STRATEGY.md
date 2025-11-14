# Production Deployment Strategy
**Created:** 2025-11-14
**Purpose:** Comprehensive deployment strategy for Traveller Combat VTT production environments
**For:** Fractional CTO portfolio - demonstrates operational thinking and production readiness

---

## Executive Summary

This document outlines the production deployment strategy for Traveller Combat VTT, a real-time multiplayer space combat virtual tabletop. The strategy covers environment configuration, deployment options, monitoring, logging, scaling, backup/recovery, and rollback procedures.

**Current Status:**
- ✅ Docker containerization complete (multi-stage builds)
- ✅ Health check endpoints implemented (`/health`, `/ready`)
- ✅ Structured logging (Winston)
- ✅ CI/CD pipeline (GitHub Actions)
- 📋 Horizontal scaling (planned: Redis, PostgreSQL)
- 📋 Monitoring integration (planned: Prometheus, Grafana)

**Deployment Maturity:** Stage 1 (MVP Ready - Single Instance)

---

## Environment Configuration

### 1. Development Environment

**Purpose:** Local development, testing, debugging

```bash
# Environment variables
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
ENABLE_CORS=true

# Docker Compose
docker-compose up app-dev
```

**Characteristics:**
- Hot reload enabled
- Debug logging
- CORS enabled for local testing
- In-memory state (no persistence)
- Single instance

### 2. Staging Environment

**Purpose:** Pre-production testing, QA, load testing

```bash
# Environment variables
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000

# Docker deployment
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=staging \
  -e LOG_LEVEL=info \
  --name traveller-vtt-staging \
  traveller-vtt:latest
```

**Characteristics:**
- Production-like configuration
- Info-level logging
- Health checks enabled
- Performance monitoring
- Mirrors production architecture

### 3. Production Environment

**Purpose:** Live user-facing deployment

```bash
# Environment variables
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
HEALTH_CHECK_INTERVAL=60000
MAX_CONNECTIONS=1000

# High-availability deployment (future)
SESSION_STORE_URL=redis://redis:6379
DATABASE_URL=postgresql://db:5432/traveller_vtt
```

**Characteristics:**
- Optimized performance
- Minimal logging (warn/error only)
- Health monitoring
- Horizontal scalability (future)
- Persistence layer (future)

---

## Deployment Options

### Option 1: Docker (Recommended for MVP)

**Best For:** Small-medium deployments (1-100 concurrent users)

**Advantages:**
- ✅ Simple deployment
- ✅ Consistent environment
- ✅ Easy rollback
- ✅ Works everywhere (local, cloud, on-premise)

**Deployment:**
```bash
# Build production image
docker build -t traveller-vtt:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --restart unless-stopped \
  --name traveller-vtt \
  traveller-vtt:latest

# Health check
curl http://localhost:3000/health
```

**Monitoring:**
```bash
# Check logs
docker logs -f traveller-vtt

# Check resource usage
docker stats traveller-vtt
```

---

### Option 2: Azure App Service (Containerized)

**Best For:** Medium deployments with auto-scaling needs

**Advantages:**
- ✅ Managed service (no infrastructure management)
- ✅ Auto-scaling
- ✅ Built-in monitoring (Application Insights)
- ✅ SSL/TLS termination
- ✅ Custom domains

**Cost Estimate:** £50-150/month (Basic-Standard tier)

**Deployment:**
```bash
# Create resource group
az group create --name traveller-vtt --location uksouth

# Create container registry
az acr create --resource-group traveller-vtt --name travellervtt --sku Basic

# Push image
docker tag traveller-vtt:latest travellervtt.azurecr.io/traveller-vtt:latest
az acr login --name travellervtt
docker push travellervtt.azurecr.io/traveller-vtt:latest

# Create App Service plan
az appservice plan create \
  --name traveller-vtt-plan \
  --resource-group traveller-vtt \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --resource-group traveller-vtt \
  --plan traveller-vtt-plan \
  --name traveller-combat-vtt \
  --deployment-container-image-name travellervtt.azurecr.io/traveller-vtt:latest

# Configure health check
az webapp config set \
  --resource-group traveller-vtt \
  --name traveller-combat-vtt \
  --health-check-path /health
```

**See:** [docs/docker-deployment.md#azure](../docs/docker-deployment.md#azure)

---

### Option 3: AWS (ECS + Fargate)

**Best For:** Large deployments with global distribution

**Advantages:**
- ✅ Global infrastructure
- ✅ Auto-scaling (horizontal and vertical)
- ✅ Load balancing (ALB)
- ✅ CloudWatch monitoring
- ✅ Serverless containers (Fargate)

**Cost Estimate:** £60-200/month (depending on scale)

**Components:**
- **ECS Cluster:** Container orchestration
- **Fargate:** Serverless container execution
- **ALB:** Application Load Balancer (health checks, SSL)
- **CloudWatch:** Logging and monitoring
- **RDS (future):** PostgreSQL for persistence
- **ElastiCache (future):** Redis for sessions

**See:** [docs/docker-deployment.md#aws](../docs/docker-deployment.md#aws)

---

### Option 4: Google Cloud Run

**Best For:** Serverless, pay-per-use deployments

**Advantages:**
- ✅ Auto-scaling to zero (cost-effective for low traffic)
- ✅ Fully managed
- ✅ Pay only for requests
- ✅ HTTPS by default

**Cost Estimate:** £10-50/month (serverless pricing)

**Deployment:**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/traveller-vtt

# Deploy to Cloud Run
gcloud run deploy traveller-vtt \
  --image gcr.io/PROJECT_ID/traveller-vtt \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 3000
```

**See:** [docs/docker-deployment.md#gcp](../docs/docker-deployment.md#gcp)

---

### Option 5: Kubernetes (Advanced)

**Best For:** Large-scale deployments (500+ concurrent users)

**Advantages:**
- ✅ Horizontal auto-scaling (HPA)
- ✅ Self-healing (pod restarts)
- ✅ Rolling updates (zero downtime)
- ✅ Multi-region deployments
- ✅ Advanced networking (service mesh)

**Cost Estimate:** £200-500/month (managed Kubernetes service)

**Use Cases:**
- High availability requirements (99.9%+ uptime)
- Global distribution
- Multi-tenancy
- Complex microservices architecture

**See:** [docs/docker-deployment.md#kubernetes](../docs/docker-deployment.md#kubernetes)

---

## Monitoring Strategy

### 1. Health Checks

**Current Implementation:**

```javascript
// GET /health
{
  "status": "healthy",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "uptime": 3600,
  "version": "0.12.5"
}

// GET /ready
{
  "status": "ready",
  "checks": {
    "server": "ok",
    "socket": "ok"
  }
}
```

**Integration:**
- Load balancers: Check `/health` every 30-60s
- Kubernetes: Configure `livenessProbe` and `readinessProbe`
- Azure App Service: Health check path `/health`

### 2. Application Metrics (Planned - Stage 14+)

**Metrics to Track:**
- **Request metrics:** Request count, latency (p50, p95, p99)
- **WebSocket metrics:** Active connections, connection rate, disconnection rate
- **Combat metrics:** Active battles, combat resolution time, turn processing time
- **System metrics:** CPU usage, memory usage, event loop lag

**Tools:**
- **Prometheus:** Metrics collection
- **Grafana:** Visualization and dashboards
- **Application Insights (Azure):** Built-in monitoring

### 3. Error Tracking (Planned)

**Tools:**
- **Sentry:** Real-time error tracking
- **CloudWatch (AWS):** Log aggregation and alerts
- **Azure Monitor:** Integrated monitoring

---

## Logging Strategy

### Current Implementation (Winston)

**Log Levels:**
```javascript
{
  error: 0,   // Production errors
  warn: 1,    // Production warnings
  info: 2,    // Staging informational
  debug: 3,   // Development debugging
}
```

**Log Format (Structured JSON):**
```json
{
  "level": "info",
  "message": "Combat started",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "battleId": "battle-123",
  "players": ["player-1", "player-2"],
  "service": "combat-engine"
}
```

### Production Logging Best Practices

**What to Log:**
- ✅ All errors with stack traces
- ✅ Authentication events (when auth implemented)
- ✅ Combat state changes (battle start, turn, victory)
- ✅ Performance anomalies (>200ms latency)

**What NOT to Log (Avoid PII):**
- ❌ Passwords or session tokens
- ❌ User email addresses
- ❌ IP addresses (unless for security)

### Log Aggregation (Planned)

**Options:**
- **CloudWatch Logs (AWS):** Integrated with ECS/Fargate
- **Azure Monitor (Azure):** Integrated with App Service
- **Datadog:** Third-party log aggregation
- **ELK Stack (Elasticsearch, Logstash, Kibana):** Self-hosted

---

## Scaling Considerations

### Current Architecture (Stage 12.5)

**Single Instance Limitations:**
- ✅ Handles 10-20 concurrent battles (estimated)
- ✅ Supports 40-60 concurrent users
- ❌ No horizontal scaling (state in memory)
- ❌ No persistence (server restart = data loss)

**Performance Targets:**
- Combat resolution: <100ms
- Socket.io latency: <50ms
- Turn processing: <100ms

### Horizontal Scaling (Planned - Stage 13+)

**Requirements:**
1. **Session Store (Redis)**
   - Shared session state across instances
   - Pub/Sub for real-time events
   - Fast in-memory caching

2. **Database (PostgreSQL)**
   - Persistent battle state
   - User accounts (future)
   - Campaign data (future)

3. **Load Balancer**
   - Distribute WebSocket connections
   - Health check integration
   - SSL termination

**Architecture Diagram (Future):**
```
                ┌──────────────┐
                │ Load Balancer│
                │    (ALB)     │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
  ┌─────▼────┐   ┌────▼─────┐  ┌────▼─────┐
  │ App      │   │ App      │  │ App      │
  │ Instance │   │ Instance │  │ Instance │
  │ 1        │   │ 2        │  │ 3        │
  └─────┬────┘   └────┬─────┘  └────┬─────┘
        │             │             │
        └──────┬──────┴──────┬──────┘
               │             │
        ┌──────▼──────┐  ┌──▼────────┐
        │   Redis     │  │PostgreSQL │
        │  (Sessions) │  │(Persistent│
        │             │  │   State)  │
        └─────────────┘  └───────────┘
```

**Auto-Scaling Rules:**
- Scale up when: CPU > 70% or active connections > 500 per instance
- Scale down when: CPU < 30% and active connections < 100 per instance
- Min instances: 2 (high availability)
- Max instances: 10 (cost control)

---

## Backup and Recovery

### Current State (Stage 12.5)

**No Persistence:**
- Battle state in memory (lost on restart)
- No user data
- No backups needed (stateless)

**Recovery:** Restart server (battles must be manually re-created)

### Future State (Stage 14+)

**Database Backups:**
- **Automated daily backups** (PostgreSQL)
- **Point-in-time recovery** (7-day retention)
- **Backup storage:** Azure Blob / S3
- **Backup testing:** Monthly restore validation

**Redis Backups:**
- **RDB snapshots:** Every 15 minutes
- **AOF (Append-Only File):** For durability
- **Replication:** Master-slave for high availability

**Disaster Recovery:**
- **RTO (Recovery Time Objective):** <15 minutes
- **RPO (Recovery Point Objective):** <5 minutes
- **Multi-region:** Active-passive configuration

---

## Rollback Procedures

### 1. Docker Rollback

**Scenario:** New deployment causes issues

```bash
# Stop current container
docker stop traveller-vtt

# Start previous version
docker run -d \
  -p 3000:3000 \
  --restart unless-stopped \
  --name traveller-vtt \
  traveller-vtt:v0.12.4

# Verify health
curl http://localhost:3000/health
```

**Time to Rollback:** <2 minutes

### 2. Azure App Service Rollback

```bash
# List deployment history
az webapp deployment list \
  --resource-group traveller-vtt \
  --name traveller-combat-vtt

# Rollback to previous deployment
az webapp deployment slot swap \
  --resource-group traveller-vtt \
  --name traveller-combat-vtt \
  --slot staging
```

**Time to Rollback:** <5 minutes (Azure handles routing)

### 3. Kubernetes Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/traveller-vtt

# Check rollout status
kubectl rollout status deployment/traveller-vtt
```

**Time to Rollback:** <3 minutes (rolling update)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (197/197 ✅)
- [ ] npm audit clean (0 vulnerabilities ✅)
- [ ] Docker image built and tagged
- [ ] Environment variables configured
- [ ] Health check endpoints tested
- [ ] Load testing completed (if significant changes)

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Monitor staging for 30 minutes
- [ ] Deploy to production (using blue-green or rolling update)
- [ ] Verify health checks green
- [ ] Monitor error rates for 15 minutes

### Post-Deployment
- [ ] Verify functionality (create battle, run combat)
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Update deployment log
- [ ] Tag Git commit with version

### Rollback Trigger Conditions
- ⚠️ Health check fails
- ⚠️ Error rate >5%
- ⚠️ P95 latency >500ms
- ⚠️ WebSocket connection failures >10%

---

## Security Considerations

### 1. Network Security

**Current:**
- ✅ No authentication (trust-based multiplayer)
- ✅ Input validation (server-side)
- ✅ XSS protection (sanitized output)

**Future:**
- 📋 HTTPS/WSS (TLS encryption)
- 📋 Rate limiting (DoS protection)
- 📋 Firewall rules (cloud provider)

### 2. Secrets Management

**Current Environment Variables:**
```bash
# No secrets currently required
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
```

**Future Secrets (Stage 14+):**
- `SESSION_SECRET` - Session cookie encryption
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

**Tools:**
- **Azure Key Vault** - Managed secrets
- **AWS Secrets Manager** - Rotating secrets
- **Kubernetes Secrets** - Encrypted secrets in etcd

### 3. Dependency Security

**Automated Scanning:**
- ✅ Dependabot (weekly updates)
- ✅ npm audit (CI pipeline)
- ✅ GitHub secret scanning

**Policy:**
- HIGH/CRITICAL vulnerabilities: Patch within 48h
- MODERATE vulnerabilities: Patch within 2 weeks

---

## Cost Estimates (Production Deployment)

### Small Deployment (1-50 concurrent users)

| Component | Option | Cost/month |
|-----------|--------|------------|
| **Compute** | Azure App Service (Basic B1) | £40 |
| **Container Registry** | Azure ACR (Basic) | £4 |
| **Monitoring** | Application Insights (5GB) | Free |
| **Domain** | Custom domain + SSL | £10 |
| **Total** | | **£54/month** |

### Medium Deployment (50-200 concurrent users)

| Component | Option | Cost/month |
|-----------|--------|------------|
| **Compute** | Azure App Service (Standard S1) 2 instances | £120 |
| **Redis** | Azure Cache for Redis (Basic C1) | £12 |
| **Database** | Azure PostgreSQL (Basic B1) | £25 |
| **Container Registry** | Azure ACR (Standard) | £16 |
| **Monitoring** | Application Insights (10GB) | £15 |
| **Domain** | Custom domain + SSL | £10 |
| **Total** | | **£198/month** |

### Large Deployment (200-500 concurrent users)

| Component | Option | Cost/month |
|-----------|--------|------------|
| **Compute** | Azure App Service (Standard S2) 3 instances | £270 |
| **Redis** | Azure Cache for Redis (Standard C1) | £45 |
| **Database** | Azure PostgreSQL (General Purpose GP_Gen5_2) | £90 |
| **Container Registry** | Azure ACR (Standard) | £16 |
| **Monitoring** | Application Insights (25GB) | £30 |
| **Backup** | Azure Backup (50GB) | £10 |
| **Domain** | Custom domain + SSL | £10 |
| **Total** | | **£471/month** |

---

## Future Enhancements (Stage 14-16+)

### Stage 14: Scalability & Persistence
- Redis for session store
- PostgreSQL for battle persistence
- Horizontal scaling (3-5 instances)
- Load balancer integration

### Stage 15: Monitoring & Observability
- Prometheus + Grafana dashboards
- Application Performance Monitoring (APM)
- Real-time alerting (PagerDuty, OpsGenie)
- Distributed tracing (Jaeger)

### Stage 16+: Advanced Operations
- Multi-region deployment
- CDN for static assets
- Auto-scaling policies
- Chaos engineering (resilience testing)

---

## Appendix: Deployment Commands Reference

### Docker Commands
```bash
# Build
docker build -t traveller-vtt:v0.12.5 .

# Run
docker run -d -p 3000:3000 --name traveller-vtt traveller-vtt:v0.12.5

# Logs
docker logs -f traveller-vtt

# Stop
docker stop traveller-vtt

# Remove
docker rm traveller-vtt
```

### Docker Compose Commands
```bash
# Start dev
docker-compose up app-dev

# Start prod
docker-compose up -d app-prod

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Health Check Commands
```bash
# Check health
curl http://localhost:3000/health

# Check readiness
curl http://localhost:3000/ready

# Check with verbose output
curl -v http://localhost:3000/health
```

---

**Document Owner:** Bruce (Fractional CTO Portfolio)
**Last Updated:** 2025-11-14
**Next Review:** Stage 14 (Scalability Implementation)
**Status:** ACTIVE - MVP deployment strategy complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
