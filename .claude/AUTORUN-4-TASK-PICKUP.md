# Autorun 4: Task Pickup Ready
**Created:** 2025-12-01
**Token Budget:** 600K | **Deadline:** 26 hours to game session

---

## Quick Reference: Priority Order

```
1. AWS DEPLOY (Critical)    → 200K tokens, must complete
2. BUG FIXES (High)         → 100K tokens, for game day
3. CHATGPT RECS (Medium)    → 100K tokens, if time permits
4. TESTING (High)           → 100K tokens, verify everything
5. BUFFER                   → 100K tokens, overhead/issues
```

---

## PHASE 1: AWS DEPLOYMENT (Pick these first)

### Task 1.1: AWS Prerequisites Check
**Tokens:** 5K | **Time:** 15 min | **PICK FIRST**
```bash
# Run these to verify AWS access
aws sts get-caller-identity
aws ecr describe-repositories
docker --version
```
**Output:** Confirm AWS credentials work, note Account ID and Region

---

### Task 1.2: Create ECR Repository
**Tokens:** 10K | **Time:** 15 min
```bash
aws ecr create-repository \
  --repository-name traveller-vtt \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```
**Output:** ECR repository URI

---

### Task 1.3: Build & Push Docker Image
**Tokens:** 20K | **Time:** 30 min
```bash
# Get login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t traveller-vtt .

# Tag
docker tag traveller-vtt:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest

# Push
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/traveller-vtt:latest
```
**Output:** Image pushed successfully

---

### Task 1.4: Create ECS Cluster
**Tokens:** 15K | **Time:** 20 min
```bash
aws ecs create-cluster \
  --cluster-name traveller-vtt-cluster \
  --capacity-providers FARGATE \
  --region us-east-1
```
**Output:** Cluster ARN

---

### Task 1.5: Create Task Definition
**Tokens:** 25K | **Time:** 30 min
- Create `aws/task-definition.json` (see AUTORUN-4-AWS-DEPLOY.md)
- Register task definition
- Configure health checks, logging, port mappings

---

### Task 1.6: Create ALB & Target Group
**Tokens:** 40K | **Time:** 45 min
- Create target group (IP type, port 3000)
- Create ALB (internet-facing)
- Configure listener (HTTP:80)
- Enable WebSocket support (default)
- Set idle timeout to 300s

**CRITICAL:** WebSocket requires sticky sessions or ALB (ALB preferred)

---

### Task 1.7: Create ECS Service
**Tokens:** 30K | **Time:** 30 min
```bash
aws ecs create-service \
  --cluster traveller-vtt-cluster \
  --service-name traveller-vtt-service \
  --task-definition traveller-vtt \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "..." \
  --load-balancers "..."
```
**Output:** Service ARN, public URL

---

### Task 1.8: CloudWatch Logging
**Tokens:** 15K | **Time:** 20 min
```bash
aws logs create-log-group --log-group-name /ecs/traveller-vtt
aws logs put-retention-policy --log-group-name /ecs/traveller-vtt --retention-in-days 7
```
**Output:** Log group created

---

### Task 1.9: Deployment Script
**Tokens:** 10K | **Time:** 20 min
- Create `scripts/deploy-aws.sh`
- Make executable
- Test deployment flow

---

## PHASE 2: BUG FIXES (Pick after deployment works)

### Task 2.1: Verify Multiple-Fire Bug Fix
**Tokens:** 15K | **Time:** 30 min
- Check if Stage 11 fixed this
- Test in browser: can player fire twice per round?
- If NOT fixed, implement turret firing tracking

---

### Task 2.2: Combat Log Display Order
**Tokens:** 10K | **Time:** 20 min
- Add CSS `flex-direction: column-reverse` to combat log
- Verify newest entries appear at top
- Test with multiple combat rounds

---

## PHASE 3: CHATGPT RECOMMENDATIONS (Pick if time permits)

### Task 3.1: CORS Lockdown
**Tokens:** 20K | **Time:** 30 min
- Add `ALLOWED_ORIGINS` environment variable
- Update Socket.IO CORS config
- Test both localhost and AWS URLs work

---

### Task 3.2: Graceful Shutdown
**Tokens:** 15K | **Time:** 20 min
- Clear all intervals on SIGTERM
- Close Socket.IO connections properly
- Add 10s force-exit timeout

---

### Task 3.3: Enhanced Health Endpoint
**Tokens:** 15K | **Time:** 20 min
- Add connection count
- Add active combat count
- Add memory usage
- Add version number

---

## PHASE 4: TESTING & VERIFICATION (Pick last)

### Task 4.1: Local Smoke Test
**Tokens:** 10K | **Time:** 20 min
- Start server locally
- Create battle, join as player 2
- Fire weapons, verify damage
- Check logs for errors

---

### Task 4.2: AWS Deployment Test
**Tokens:** 20K | **Time:** 30 min
- Access ALB URL in browser
- Verify /health returns OK
- Create battle on AWS
- Test WebSocket connectivity
- Check CloudWatch logs

---

### Task 4.3: Operations VTT Test
**Tokens:** 15K | **Time:** 20 min
- Access /operations on AWS
- Create campaign
- Join as player
- Verify bridge view loads

---

## ROLLBACK PLAN

If AWS deployment fails:
1. Run locally: `npm start`
2. Use ngrok: `ngrok http 3000`
3. Share ngrok URL with game group

---

## TOKENS BY PHASE

| Phase | Est. Tokens | Cumulative |
|-------|-------------|------------|
| Deploy (1.1-1.9) | 170K | 170K |
| Bug Fixes (2.1-2.2) | 25K | 195K |
| ChatGPT (3.1-3.3) | 50K | 245K |
| Testing (4.1-4.3) | 45K | 290K |
| Buffer/Issues | 310K | 600K |

---

## DONE CHECKLIST

### Minimum Success (MUST HAVE)
- [ ] AWS deployment accessible via URL
- [ ] /health returns healthy
- [ ] Can create and join battles
- [ ] WebSocket works (real-time updates)

### Full Success
- [ ] CloudWatch logs visible
- [ ] Deployment script working
- [ ] CORS configured
- [ ] Graceful shutdown
- [ ] All smoke tests pass

---

## QUICK COMMANDS

```bash
# Test locally
npm test && npm start

# Build Docker
docker build -t traveller-vtt .

# Run Docker locally
docker run -p 3000:3000 traveller-vtt

# Check AWS identity
aws sts get-caller-identity

# View ECS service status
aws ecs describe-services --cluster traveller-vtt-cluster --services traveller-vtt-service

# View CloudWatch logs
aws logs tail /ecs/traveller-vtt --follow
```

---

**STATUS:** READY FOR AUTORUN EXECUTION
**NEXT ACTION:** Start Task 1.1 (AWS Prerequisites Check)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
