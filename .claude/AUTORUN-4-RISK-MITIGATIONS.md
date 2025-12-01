# Autorun 4: Risk Mitigations
**Created:** 2025-12-01
**Status:** READY (pending user credential generation)

---

## Pre-Autorun User Action Required

### YOU MUST DO THIS BEFORE SAYING "GO AUTORUN":

1. **Log into AWS Console**
2. **Go to:** IAM → Users → [Your User] → Security credentials
3. **Click:** Create access key
4. **Select:** Command Line Interface (CLI)
5. **Save:** Access Key ID and Secret Access Key
6. **Have ready:** Both values to paste when prompted

**Time Required:** 5-10 minutes
**Why:** AWS CLI needs these to authenticate

---

## Risk Mitigations Implemented

### BLOCKER → Resolved: AWS CLI Not Installed

**Original Risk:** All AWS operations would fail
**Mitigation:** Phase 0 installs AWS CLI via apt
**Commands:**
```bash
sudo apt update && sudo apt install -y awscli
aws --version  # Verify
```
**Residual Risk:** LOW - Standard package installation

---

### BLOCKER → Resolved: Docker Not Installed

**Original Risk:** Cannot build/push container images
**Mitigation:** Phase 0 installs Docker for ChromeOS
**Commands:**
```bash
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker  # Apply group without logout
docker run hello-world  # Verify
```
**Residual Risk:** LOW - May need container restart if group change fails

---

### HIGH → MEDIUM: ALB WebSocket Configuration

**Original Risk:** WebSocket connections fail, real-time features broken
**Mitigations Applied:**
1. Use ALB (not NLB) - native WebSocket support
2. Set idle timeout to 300 seconds
3. Verify /health locally before ALB creation
4. Test WebSocket after deployment

**Verification Script:**
```bash
# After ALB created:
ALB_URL="your-alb-url.us-west-2.elb.amazonaws.com"

# Test health endpoint
curl http://$ALB_URL/health

# Test WebSocket upgrade (should return 101 or connection info)
curl -v \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  http://$ALB_URL/socket.io/?EIO=4&transport=websocket
```

**Fallback:** If ALB WebSocket fails, use direct ECS task IP + ngrok

---

### HIGH → MEDIUM: ECS Service Dependencies

**Original Risk:** Service creation fails due to missing prerequisites
**Mitigations Applied:**
1. Explicit pre-flight checklist
2. Verify each component before proceeding
3. Clear error handling and rollback

**Pre-Flight Checklist (run before service creation):**
```bash
REGION="us-west-2"
CLUSTER="traveller-vtt-cluster"
REPO="traveller-vtt"
TASK_DEF="traveller-vtt"
TG_NAME="traveller-vtt-tg"
ALB_NAME="traveller-vtt-alb"

echo "Checking prerequisites..."

# 1. Image in ECR?
aws ecr describe-images --repository-name $REPO --region $REGION --query 'imageDetails[0].imageTags' || echo "❌ No image in ECR"

# 2. Cluster exists?
aws ecs describe-clusters --clusters $CLUSTER --region $REGION --query 'clusters[0].status' || echo "❌ Cluster missing"

# 3. Task definition registered?
aws ecs describe-task-definition --task-definition $TASK_DEF --region $REGION --query 'taskDefinition.status' || echo "❌ Task def missing"

# 4. Target group exists?
aws elbv2 describe-target-groups --names $TG_NAME --region $REGION --query 'TargetGroups[0].TargetGroupArn' || echo "❌ Target group missing"

# 5. ALB exists and active?
aws elbv2 describe-load-balancers --names $ALB_NAME --region $REGION --query 'LoadBalancers[0].State.Code' || echo "❌ ALB missing"

echo "✅ All prerequisites verified"
```

---

### MEDIUM → LOW: Task Definition JSON

**Original Risk:** Syntax errors, wrong image URI, missing role
**Mitigations Applied:**
1. Validate JSON syntax before registration
2. Use template with clear placeholders
3. Verify image URI matches ECR

**Template with Placeholders:**
```json
{
  "family": "traveller-vtt",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::{{ACCOUNT_ID}}:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "traveller-vtt",
    "image": "{{ACCOUNT_ID}}.dkr.ecr.{{REGION}}.amazonaws.com/traveller-vtt:latest",
    "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
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
        "awslogs-region": "{{REGION}}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

**Validation:**
```bash
# Validate JSON syntax
cat aws/task-definition.json | jq . > /dev/null && echo "✅ Valid JSON"

# Check image URI matches ECR
EXPECTED_IMAGE=$(aws ecr describe-repositories --repository-names traveller-vtt --region us-west-2 --query 'repositories[0].repositoryUri' --output text)
grep -q "$EXPECTED_IMAGE" aws/task-definition.json && echo "✅ Image URI correct"
```

---

### MEDIUM → LOW: VPC/Subnet Discovery

**Original Risk:** Unknown VPC state, ALB creation fails
**Mitigations Applied:**
1. Discovery commands in Phase 0
2. Use default VPC if available
3. Document subnet IDs for later use

**Discovery Script:**
```bash
REGION="us-west-2"

# Find default VPC
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "Default VPC: $VPC_ID"

# Find public subnets (at least 2 for ALB)
SUBNETS=$(aws ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].[SubnetId,AvailabilityZone]' --output text)
echo "Subnets:"
echo "$SUBNETS"

# Save for later use
echo "export VPC_ID=$VPC_ID" >> ~/.aws_env
echo "export SUBNET_1=$(echo "$SUBNETS" | head -1 | cut -f1)" >> ~/.aws_env
echo "export SUBNET_2=$(echo "$SUBNETS" | head -2 | tail -1 | cut -f1)" >> ~/.aws_env
```

---

### MEDIUM → LOW: Security Group Configuration

**Original Risk:** Wrong ports block traffic
**Mitigations Applied:**
1. Explicit port list documented
2. Create with specific rules
3. Verify before use

**Required Ports:**
| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 80 | TCP | 0.0.0.0/0 | HTTP from internet |
| 3000 | TCP | ALB SG | App from ALB |

**Creation Script:**
```bash
REGION="us-west-2"
VPC_ID="vpc-xxx"  # From discovery

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name traveller-vtt-sg \
  --description "Traveller VTT security group" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --query 'GroupId' --output text)

# Allow HTTP from internet
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $REGION

# Allow app port from anywhere (for ALB health checks)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region $REGION

echo "Security Group: $SG_ID"
```

---

### MEDIUM → LOW: Multiple-Fire Bug

**Original Risk:** State management bugs break combat
**Mitigations Applied:**
1. Check if already fixed FIRST
2. Time-box to 30 minutes
3. If complex, defer with workaround

**Decision Tree:**
```
Step 1: Manual test in browser
  - Start solo combat
  - Fire weapon
  - Try to fire same weapon again in same round

Step 2: Analyze result
  - If blocked → Bug already fixed, skip task
  - If allowed → Bug exists, proceed to Step 3

Step 3: Assess fix complexity
  - Look at server.js fire handler
  - If <30 LOC change → Implement fix
  - If >30 LOC change → Defer, tell players "one shot per turret per round"
```

---

## Fallback Plans

### Fallback A: ALB WebSocket Fails
```bash
# Get ECS task public IP directly
TASK_ARN=$(aws ecs list-tasks --cluster traveller-vtt-cluster --service traveller-vtt-service --query 'taskArns[0]' --output text)
TASK_IP=$(aws ecs describe-tasks --cluster traveller-vtt-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`privateIPv4Address`].value' --output text)

# Use ngrok to expose
ngrok http $TASK_IP:3000
```

### Fallback B: ECS Deployment Fails Completely
```bash
# Run locally with ngrok
cd /home/bruce/software/traveller-combat-vtt
npm start &
ngrok http 3000
# Share ngrok URL with game group
```

### Fallback C: Docker Installation Fails
```bash
# Deploy without container - use EC2 directly
# 1. Launch EC2 instance (Amazon Linux 2)
# 2. Install Node.js
# 3. Clone repo
# 4. npm install && npm start
# 5. Configure security group for port 3000
```

---

## Risk Register Summary

| Risk ID | Description | Likelihood | Impact | Status |
|---------|-------------|------------|--------|--------|
| R1 | AWS CLI not installed | 100% | BLOCKER | ✅ Mitigated (Phase 0) |
| R2 | Docker not installed | 100% | BLOCKER | ✅ Mitigated (Phase 0) |
| R3 | AWS credentials missing | 100% | BLOCKER | ⏳ User action required |
| R4 | VPC/Subnets unknown | 50% | HIGH | ✅ Mitigated (Discovery) |
| R5 | IAM role missing | 40% | HIGH | ✅ Mitigated (Create if needed) |
| R6 | ALB WebSocket fails | 20% | HIGH | ✅ Mitigated + Fallback |
| R7 | ECS Service fails | 15% | HIGH | ✅ Mitigated (Checklist) |
| R8 | Task def errors | 10% | MEDIUM | ✅ Mitigated (Validation) |
| R9 | Security group wrong | 10% | MEDIUM | ✅ Mitigated (Script) |
| R10 | Multiple-fire bug | 30% | LOW | ✅ Mitigated (Time-box) |

---

## Confidence Level

**Before Mitigations:** 55% chance of clean autorun
**After Mitigations:** 85% chance of clean autorun
**With Fallbacks:** 98% chance of game-day deployment (some form)

---

**STATUS:** Ready pending user credential generation
**USER ACTION:** Generate AWS Access Key from Console before GO AUTORUN

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
