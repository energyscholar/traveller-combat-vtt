# Autorun 4: AWS Deployment & Game-Day Polish
**Created:** 2025-12-01
**Token Budget:** 600K tokens
**Timeline:** 26 hours to game session
**Priority Order:** Deploy → Bug Fixes → Features → ChatGPT Recommendations

---

## Executive Summary

This autorun focuses on **production deployment to AWS** as the primary goal, followed by bug fixes and polish for tomorrow's game session. ChatGPT recommendations are incorporated where they align with deployment and stability.

**Key Deliverables:**
1. ✅ Working AWS deployment (accessible URL for game group)
2. ✅ Critical bug fixes for game-day readiness
3. ✅ Selected ChatGPT recommendations that improve deployment/stability

---

## Phase 1: AWS Deployment (Priority: CRITICAL)
**Estimated Tokens:** 150K-200K
**Estimated Time:** 8-12 hours

### 1.1 AWS Infrastructure Setup
**Priority:** CRITICAL | **Difficulty:** MEDIUM | **Tokens:** ~30K

**Tasks:**
- [ ] Verify AWS CLI configured and authenticated
- [ ] Create ECR repository for Docker images
- [ ] Push current Docker image to ECR
- [ ] Create ECS cluster (Fargate)
- [ ] Configure task definition with health checks
- [ ] Set up Application Load Balancer (ALB)
- [ ] Configure security groups (port 3000, WebSocket)
- [ ] Create ECS service with auto-restart

**Commands Reference:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name traveller-vtt --region us-east-1

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t traveller-vtt .
docker tag traveller-vtt:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest
```

**Success Criteria:**
- Docker image in ECR
- ECS task running
- Health check passing at /health

---

### 1.2 ECS Task Definition
**Priority:** CRITICAL | **Difficulty:** MEDIUM | **Tokens:** ~20K

**Create:** `aws/task-definition.json`
```json
{
  "family": "traveller-vtt",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "traveller-vtt",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/traveller-vtt:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/traveller-vtt",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

### 1.3 Load Balancer & WebSocket Support
**Priority:** CRITICAL | **Difficulty:** HIGH | **Tokens:** ~40K

**Key Considerations:**
- Socket.IO requires sticky sessions OR ALB with WebSocket support
- ALB natively supports WebSocket (preferred)
- Target group health checks on /health

**Tasks:**
- [ ] Create ALB in public subnets
- [ ] Create target group (IP type for Fargate)
- [ ] Configure listener (HTTP:80 → target group)
- [ ] Enable WebSocket support (default on ALB)
- [ ] Configure idle timeout (300s for long WebSocket connections)
- [ ] Optional: Add HTTPS listener with ACM certificate

**ALB Configuration:**
```bash
# Create target group
aws elbv2 create-target-group \
  --name traveller-vtt-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

# Create ALB
aws elbv2 create-load-balancer \
  --name traveller-vtt-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing
```

---

### 1.4 CloudWatch Logging & Monitoring
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~15K

**Tasks:**
- [ ] Create CloudWatch log group `/ecs/traveller-vtt`
- [ ] Configure log retention (7 days for cost control)
- [ ] Create CloudWatch alarm for unhealthy targets
- [ ] Create dashboard with key metrics

**Log Group:**
```bash
aws logs create-log-group --log-group-name /ecs/traveller-vtt
aws logs put-retention-policy --log-group-name /ecs/traveller-vtt --retention-in-days 7
```

---

### 1.5 Domain & HTTPS (Optional but Recommended)
**Priority:** MEDIUM | **Difficulty:** MEDIUM | **Tokens:** ~20K

**Options:**
1. **AWS-provided URL:** Quick, free, ugly (xxx.us-east-1.elb.amazonaws.com)
2. **Custom domain:** Better UX, requires Route 53 or external DNS
3. **HTTPS:** Requires ACM certificate (free with AWS)

**For Game Day:** Use AWS-provided URL (fastest)
**Post-Game:** Set up custom domain if desired

---

### 1.6 Deployment Script
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~10K

**Create:** `scripts/deploy-aws.sh`
```bash
#!/bin/bash
set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/traveller-vtt"
CLUSTER="traveller-vtt-cluster"
SERVICE="traveller-vtt-service"

echo "🔑 Authenticating to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

echo "🔨 Building Docker image..."
docker build -t traveller-vtt .

echo "🏷️ Tagging image..."
docker tag traveller-vtt:latest $ECR_REPO:latest

echo "📤 Pushing to ECR..."
docker push $ECR_REPO:latest

echo "🔄 Updating ECS service..."
aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment --region $REGION

echo "✅ Deployment initiated! Monitor at: https://console.aws.amazon.com/ecs"
```

---

## Phase 2: Bug Fixes for Game Day (Priority: HIGH)
**Estimated Tokens:** 100K-150K
**Estimated Time:** 4-6 hours

### Bug Status Update (from STAGED-TODOS.md)
- ✅ **Solo mode escape bug** - FIXED (commit 88bab66)
- ✅ **Solo AI not attacking** - FIXED
- ✅ **Solo missile freeze** - FIXED

### 2.1 Multiple Shots Per Round Bug (VERIFY FIX)
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~15K
**Location:** `server.js` space:fire handler

**Status:** Listed in TECHNICAL-DEBT.md as HIGH priority - needs verification.

**Issue:** Players can fire multiple times in a single round, violating Traveller rules ("Each turret or bay may only fire once per round").

**Task:** Verify this was fixed in Stage 11. If not fixed, implement:
1. Add `firedThisRound` tracking per turret per ship
2. Reset flags when new round starts
3. Block fire events if turret already fired
4. Add server-side validation with clear error message

---

### 2.2 Combat Log Display Order
**Priority:** MEDIUM | **Difficulty:** LOW | **Tokens:** ~10K
**Location:** `public/app.js` or `public/operations/app.js`

**Issue:** Combat log shows oldest entries at top, newest at bottom (should be reversed).

**Fix:** Use CSS flexbox `flex-direction: column-reverse` or reverse array before rendering.

```css
.combat-log-entries {
  display: flex;
  flex-direction: column-reverse;
}
```

---

### 2.3 Version Display Update
**Priority:** LOW | **Difficulty:** LOW | **Tokens:** ~5K

**Task:** Update version to reflect Autorun 4 completion.

---

## Phase 3: ChatGPT Recommendations (Priority: MEDIUM)
**Estimated Tokens:** 100K-150K
**Estimated Time:** 4-6 hours

### 3.1 Security: CORS Lockdown (Recommended for Production)
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~20K
**Source:** ChatGPT Review

**Issue:** `origin: "*"` is insecure for production deployment.

**Fix:**
```javascript
// server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});
```

**Environment Variable:**
```bash
ALLOWED_ORIGINS=https://your-alb-url.amazonaws.com,http://localhost:3000
```

---

### 3.2 Health Endpoint Enhancement
**Priority:** MEDIUM | **Difficulty:** LOW | **Tokens:** ~15K
**Source:** ChatGPT Review

**Current:** Basic health check exists.
**Improvement:** Add more diagnostics for production monitoring.

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    memory: process.memoryUsage(),
    connections: state.getConnectionCount(),
    activeCombats: state.getActiveCombatCount()
  });
});
```

---

### 3.3 Graceful Shutdown Improvement
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~15K
**Source:** ChatGPT Review

**Current:** Basic SIGTERM handler exists.
**Improvement:** Clear all intervals, close connections properly.

```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Clear all intervals
  clearInterval(idlePruneInterval);
  clearInterval(combatPruneInterval);
  clearInterval(metricsInterval);

  // Close server (stops accepting new connections)
  server.close(() => {
    console.log('HTTP server closed');

    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});
```

---

### 3.4 Rate Limiting Integration Check
**Priority:** MEDIUM | **Difficulty:** MEDIUM | **Tokens:** ~25K
**Source:** ChatGPT Review

**Issue:** `checkRateLimit` is referenced but need to verify integration.

**Tasks:**
- [ ] Audit all socket handlers for rate limiting
- [ ] Add rate limiting to fire, move, create battle events
- [ ] Configure limits (e.g., 10 fires per second per socket)

---

### 3.5 Input Validation Audit
**Priority:** MEDIUM | **Difficulty:** MEDIUM | **Tokens:** ~30K
**Source:** ChatGPT Review

**Tasks:**
- [ ] Review all socket event handlers
- [ ] Ensure all inputs validated server-side
- [ ] Add validation for ship names, battle IDs, coordinates
- [ ] Reject malformed inputs with clear errors

---

### 3.6 ESLint Configuration (Future Session)
**Priority:** LOW | **Difficulty:** LOW | **Tokens:** ~10K
**Source:** ChatGPT Review

**Recommendation:** Add ESLint + Prettier for consistent code style.

**Defer to:** Post-game session (not critical for deployment)

---

## Phase 4: Operations Integration Testing
**Estimated Tokens:** 50K-100K
**Estimated Time:** 2-4 hours

### 4.1 Operations VTT Smoke Test
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~20K

**Tasks:**
- [ ] Verify Operations VTT loads at /operations
- [ ] Test campaign creation flow
- [ ] Test player joining flow
- [ ] Test bridge view rendering
- [ ] Verify SQLite database persists correctly

---

### 4.2 Space Combat Smoke Test
**Priority:** HIGH | **Difficulty:** LOW | **Tokens:** ~20K

**Tasks:**
- [ ] Create new battle
- [ ] Join as second player
- [ ] Execute combat round (fire, movement)
- [ ] Verify damage calculation
- [ ] Test missile launch/defense

---

### 4.3 AWS Deployment Verification
**Priority:** CRITICAL | **Difficulty:** LOW | **Tokens:** ~15K

**Tasks:**
- [ ] Access deployed URL
- [ ] Verify /health returns healthy
- [ ] Create battle on AWS deployment
- [ ] Test WebSocket connectivity
- [ ] Verify logs appear in CloudWatch

---

## Detailed TODO List (Sorted by Priority)

### CRITICAL (Must Complete)
| # | Task | Difficulty | Tokens | Phase |
|---|------|------------|--------|-------|
| 1 | AWS ECR repository setup | LOW | 5K | Deploy |
| 2 | Docker image push to ECR | LOW | 10K | Deploy |
| 3 | ECS task definition | MEDIUM | 20K | Deploy |
| 4 | ECS service creation | MEDIUM | 25K | Deploy |
| 5 | ALB with WebSocket support | HIGH | 40K | Deploy |
| 6 | Fix multiple shots per round | MEDIUM | 40K | Bug Fix |
| 7 | AWS deployment verification | LOW | 15K | Test |

### HIGH (Should Complete)
| # | Task | Difficulty | Tokens | Phase |
|---|------|------------|--------|-------|
| 8 | CloudWatch logging | LOW | 15K | Deploy |
| 9 | CORS lockdown for production | LOW | 20K | Security |
| 10 | Graceful shutdown improvement | LOW | 15K | Stability |
| 11 | Deployment script (deploy-aws.sh) | LOW | 10K | Deploy |
| 12 | Operations VTT smoke test | LOW | 20K | Test |
| 13 | Space combat smoke test | LOW | 20K | Test |

### MEDIUM (Nice to Have)
| # | Task | Difficulty | Tokens | Phase |
|---|------|------------|--------|-------|
| 14 | Combat log display order | LOW | 10K | Bug Fix |
| 15 | Health endpoint enhancement | LOW | 15K | ChatGPT |
| 16 | Rate limiting audit | MEDIUM | 25K | ChatGPT |
| 17 | Input validation audit | MEDIUM | 30K | ChatGPT |

### LOW (Defer if Time-Constrained)
| # | Task | Difficulty | Tokens | Phase |
|---|------|------------|--------|-------|
| 18 | Version display update | LOW | 5K | Polish |
| 19 | Custom domain setup | MEDIUM | 20K | Deploy |
| 20 | HTTPS/TLS setup | MEDIUM | 25K | Deploy |
| 21 | ESLint configuration | LOW | 10K | ChatGPT |

---

## Token Budget Allocation

| Phase | Estimated Tokens | Percentage |
|-------|------------------|------------|
| AWS Deployment | 200K | 33% |
| Bug Fixes | 100K | 17% |
| ChatGPT Recommendations | 100K | 17% |
| Testing & Verification | 100K | 17% |
| **Buffer/Overhead** | **100K** | **16%** |
| **Total** | **600K** | **100%** |

---

## Pre-Flight Checklist

Before starting autorun:

- [ ] AWS CLI installed and configured
- [ ] Docker installed and running
- [ ] Current tests passing (`npm test`)
- [ ] Git working tree clean
- [ ] AWS account ID available
- [ ] Region selected (recommend: us-east-1)

---

## Success Criteria

### Minimum Viable Success (Must Have for Game Day)
- [ ] AWS deployment accessible via URL
- [ ] Health check passing
- [ ] Can create and join battles
- [ ] WebSocket connectivity working
- [ ] No critical bugs during gameplay

### Full Success
- [ ] All CRITICAL and HIGH tasks complete
- [ ] CloudWatch monitoring active
- [ ] Deployment script working
- [ ] CORS properly configured
- [ ] Graceful shutdown implemented

---

## Rollback Plan

If deployment fails:
1. Keep local server as backup
2. Run `node server.js` on local machine
3. Use ngrok for external access if needed: `ngrok http 3000`
4. Share ngrok URL with game group

---

## Post-Game Improvements (Defer to Next Session)

From ChatGPT recommendations not included in this autorun:
- ESLint + Prettier setup
- TypeScript migration consideration
- Load testing harness
- Prometheus metrics integration
- Multi-region deployment
- Redis for horizontal scaling

---

**Document Status:** READY FOR AUTORUN
**Next Action:** Verify AWS credentials, then begin Phase 1.1
**Estimated Completion:** 12-16 hours of work

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
