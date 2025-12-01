# Autorun 4: Detailed Task Metrics
**Created:** 2025-12-01
**Token Budget:** 600K | **Deadline:** 26 hours to game

---

## ALL TASKS - Line by Line with Metrics

| # | Task | Priority | Risk | Effort | LOC | Tokens | Notes |
|---|------|----------|------|--------|-----|--------|-------|
| **PHASE 1: AWS DEPLOYMENT** ||||||| |
| 1.1 | AWS Prerequisites Check | CRITICAL | LOW | 15 min | 0 | 5K | Verify creds, get Account ID |
| 1.2 | Create ECR Repository | CRITICAL | LOW | 15 min | 0 | 10K | One AWS CLI command |
| 1.3 | Build Docker Image | CRITICAL | LOW | 20 min | 0 | 10K | Dockerfile already exists |
| 1.4 | Push Image to ECR | CRITICAL | LOW | 15 min | 0 | 10K | Tag + push commands |
| 1.5 | Create ECS Cluster | CRITICAL | LOW | 15 min | 0 | 15K | Fargate cluster |
| 1.6 | Create Task Definition | CRITICAL | MEDIUM | 45 min | 50 | 25K | JSON config, env vars, health |
| 1.7 | Create CloudWatch Log Group | HIGH | LOW | 10 min | 0 | 10K | Logging setup |
| 1.8 | Create VPC/Subnets (if needed) | HIGH | MEDIUM | 30 min | 0 | 20K | May use default VPC |
| 1.9 | Create Security Groups | HIGH | MEDIUM | 20 min | 0 | 15K | Port 3000, 80/443 |
| 1.10 | Create Target Group | CRITICAL | MEDIUM | 20 min | 0 | 15K | IP type, health checks |
| 1.11 | Create ALB | CRITICAL | HIGH | 45 min | 0 | 40K | WebSocket config critical |
| 1.12 | Configure ALB Listener | CRITICAL | MEDIUM | 15 min | 0 | 10K | HTTP:80 → target group |
| 1.13 | Create ECS Service | CRITICAL | HIGH | 30 min | 0 | 30K | Connect all pieces |
| 1.14 | Verify Deployment | CRITICAL | LOW | 20 min | 0 | 15K | Health check, browser test |
| 1.15 | Create deploy-aws.sh Script | HIGH | LOW | 30 min | 40 | 15K | Automation for future |
| | **PHASE 1 SUBTOTAL** | | | **5.5 hrs** | **90** | **245K** | |
| **PHASE 2: BUG FIXES** ||||||| |
| 2.1 | Verify Multiple-Fire Bug | HIGH | LOW | 20 min | 0 | 10K | May already be fixed |
| 2.2 | Fix Multiple-Fire (if needed) | HIGH | MEDIUM | 45 min | 30 | 25K | Turret tracking logic |
| 2.3 | Combat Log Display Order | MEDIUM | LOW | 15 min | 5 | 10K | CSS flex-direction |
| 2.4 | Version Display Update | LOW | LOW | 5 min | 2 | 3K | Update version string |
| 2.5 | Clean Up Old TODO Files | LOW | LOW | 10 min | 0 | 5K | Delete fixed bug docs |
| | **PHASE 2 SUBTOTAL** | | | **1.5 hrs** | **37** | **53K** | |
| **PHASE 3: CHATGPT RECOMMENDATIONS** ||||||| |
| 3.1 | CORS Lockdown | HIGH | LOW | 25 min | 15 | 20K | Environment-based origins |
| 3.2 | Graceful Shutdown | HIGH | LOW | 20 min | 25 | 15K | Clear intervals, close IO |
| 3.3 | Enhanced /health Endpoint | MEDIUM | LOW | 15 min | 20 | 15K | Add metrics to response |
| 3.4 | Rate Limiting Audit | MEDIUM | MEDIUM | 40 min | 0 | 25K | Review, document gaps |
| 3.5 | Input Validation Audit | MEDIUM | MEDIUM | 45 min | 0 | 30K | Review socket handlers |
| 3.6 | Add SIGINT Handler | LOW | LOW | 10 min | 10 | 8K | Handle Ctrl+C gracefully |
| | **PHASE 3 SUBTOTAL** | | | **2.5 hrs** | **70** | **113K** | |
| **PHASE 4: TESTING & VERIFICATION** ||||||| |
| 4.1 | Local Smoke Test | HIGH | LOW | 20 min | 0 | 10K | npm test, manual test |
| 4.2 | Space Combat E2E Test | HIGH | LOW | 25 min | 0 | 15K | Full combat flow |
| 4.3 | Operations VTT Test | HIGH | LOW | 20 min | 0 | 15K | Campaign, bridge view |
| 4.4 | AWS Smoke Test | CRITICAL | MEDIUM | 30 min | 0 | 20K | Test on deployed URL |
| 4.5 | WebSocket Connectivity Test | CRITICAL | MEDIUM | 20 min | 0 | 15K | Verify real-time sync |
| 4.6 | CloudWatch Logs Verify | HIGH | LOW | 15 min | 0 | 10K | Check logs appear |
| 4.7 | Load Test (Basic) | LOW | LOW | 30 min | 0 | 20K | 5-10 concurrent users |
| | **PHASE 4 SUBTOTAL** | | | **2.5 hrs** | **0** | **105K** | |
| **PHASE 5: DOCUMENTATION** ||||||| |
| 5.1 | Update README (AWS URL) | MEDIUM | LOW | 10 min | 10 | 5K | Add deployed URL |
| 5.2 | AWS Architecture Notes | LOW | LOW | 20 min | 30 | 15K | Document setup |
| 5.3 | Commit & Push | HIGH | LOW | 10 min | 0 | 5K | Git operations |
| | **PHASE 5 SUBTOTAL** | | | **0.5 hrs** | **40** | **25K** | |

---

## SUMMARY BY PHASE

| Phase | Tasks | Risk Profile | Effort | LOC | Tokens |
|-------|-------|--------------|--------|-----|--------|
| 1. AWS Deploy | 15 | 2 HIGH, 5 MED, 8 LOW | 5.5 hrs | 90 | 245K |
| 2. Bug Fixes | 5 | 0 HIGH, 1 MED, 4 LOW | 1.5 hrs | 37 | 53K |
| 3. ChatGPT Recs | 6 | 0 HIGH, 2 MED, 4 LOW | 2.5 hrs | 70 | 113K |
| 4. Testing | 7 | 2 MED, 5 LOW | 2.5 hrs | 0 | 105K |
| 5. Documentation | 3 | 0 HIGH, 0 MED, 3 LOW | 0.5 hrs | 40 | 25K |
| **BUFFER** | - | - | - | - | **59K** |
| **TOTAL** | **36** | | **12.5 hrs** | **237** | **600K** |

---

## RISK MATRIX

### HIGH RISK Tasks (Monitor Closely)
| # | Task | Risk Factor | Mitigation |
|---|------|-------------|------------|
| 1.11 | Create ALB | WebSocket config complex | Follow AWS docs exactly, test early |
| 1.13 | Create ECS Service | Many dependencies | Create after all prereqs verified |

### MEDIUM RISK Tasks
| # | Task | Risk Factor | Mitigation |
|---|------|-------------|------------|
| 1.6 | Task Definition | Config errors | Use working examples, validate JSON |
| 1.8 | VPC/Subnets | May need creation | Use default VPC if possible |
| 1.9 | Security Groups | Port misconfig | Double-check 3000, 80 open |
| 1.10 | Target Group | Health check setup | Test /health locally first |
| 2.2 | Multiple-Fire Fix | State management | Add tests before changing |
| 3.4 | Rate Limit Audit | Scope creep | Time-box to 40 min |
| 3.5 | Input Validation | Scope creep | Document only, don't fix |
| 4.4 | AWS Smoke Test | May find issues | Keep rollback plan ready |
| 4.5 | WebSocket Test | ALB config | Have ngrok fallback |

---

## EFFORT BY CATEGORY

| Category | Tasks | Total Effort | % of Time |
|----------|-------|--------------|-----------|
| AWS Infrastructure | 14 | 5 hrs | 40% |
| Code Changes | 6 | 2 hrs | 16% |
| Testing | 7 | 2.5 hrs | 20% |
| Verification | 5 | 1.5 hrs | 12% |
| Documentation | 4 | 1.5 hrs | 12% |
| **TOTAL** | **36** | **12.5 hrs** | **100%** |

---

## LOC BREAKDOWN

| Category | Files | LOC Added | LOC Modified |
|----------|-------|-----------|--------------|
| AWS Config | aws/task-definition.json | 50 | 0 |
| Scripts | scripts/deploy-aws.sh | 40 | 0 |
| Server | server.js | 35 | 20 |
| CSS | public/*.css | 5 | 0 |
| Docs | README.md, .claude/*.md | 80 | 20 |
| **TOTAL** | | **210** | **40** |

---

## CRITICAL PATH (Must Complete for Game Day)

```
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.9 → 1.10 → 1.11 → 1.12 → 1.13 → 1.14
 ↓                                                                               ↓
AWS   ECR   Docker  Push   ECS    Task   Logs   SecGrp  TG     ALB    Listen Service
Creds Repo  Build   Image  Cluster Def   Group                                 ✓ LIVE
                                                                                 ↓
                                                                              4.4 → 4.5
                                                                              Smoke  WS
                                                                              Test   Test
```

**Estimated Critical Path Time:** 4-5 hours
**Buffer for Issues:** 2-3 hours

---

## OPTIONAL TASKS (If Time Permits)

| # | Task | Value | Effort | Skip Impact |
|---|------|-------|--------|-------------|
| 2.3 | Combat Log Order | Medium | 15 min | Minor UX issue |
| 3.4 | Rate Limit Audit | Low | 40 min | Doc only, no fix |
| 3.5 | Input Validation | Low | 45 min | Doc only, no fix |
| 4.7 | Load Test | Low | 30 min | Can test live |
| 5.2 | AWS Architecture Notes | Low | 20 min | Can do later |

**Total Skippable:** ~2.5 hrs, 115K tokens

---

## DECISION POINTS

| Point | Question | Options | Recommendation |
|-------|----------|---------|----------------|
| 1.8 | Use default VPC? | Default / Create new | Default (faster) |
| 1.11 | HTTP or HTTPS? | HTTP only / Add HTTPS | HTTP only (faster) |
| 2.2 | Fix multi-fire if broken? | Fix now / Defer | Fix if <30 min, else defer |
| 3.x | Do ChatGPT recs? | All / Some / Skip | CORS + Shutdown only |

---

## ROLLBACK TRIGGERS

| Trigger | Action |
|---------|--------|
| AWS auth fails | Use ngrok fallback |
| ALB WebSocket fails | Direct ECS IP + ngrok |
| >2 hrs stuck on single task | Skip, document, continue |
| <3 hrs to game, not deployed | Local + ngrok |

---

**STATUS:** READY FOR EXECUTION
**TOTAL EFFORT:** 12.5 hours (fits in 26 hour window with buffer)
**TOTAL LOC:** ~250 (minimal code changes)
**TOTAL TOKENS:** 600K (full budget)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
