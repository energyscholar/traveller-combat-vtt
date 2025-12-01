# Autorun 4: REVISED PLAN - Preparation & Hardening
**Created:** 2025-12-01
**Token Budget:** 600K | **Deadline:** 26 hours to game
**Scope:** Preparation only - NO live AWS deployment

---

## Revised Scope

### ✅ IN SCOPE (This Autorun)
- Install prerequisites (Docker, AWS CLI)
- Containerize and test locally
- Bug fixes for game-day
- Security hardening (CORS, graceful shutdown)
- Prepare all AWS artifacts (scripts, configs, task definitions)
- Document deployment process
- Local testing with Docker

### ❌ OUT OF SCOPE (Future Session)
- Live AWS deployment
- DNS/Domain setup
- HTTPS/TLS configuration
- Production monitoring setup

### Game Day Plan
- Run locally: `npm start` or `docker run`
- Share via ngrok if remote players needed
- AWS deployment can happen post-game when less time pressure

---

## Revised Phases

| Phase | Focus | Risk | Effort | Tokens |
|-------|-------|------|--------|--------|
| **0** | Prerequisites (Docker, AWS CLI) | LOW | 1 hr | 40K |
| **1** | Containerization & Local Test | LOW | 1.5 hrs | 60K |
| **2** | Bug Fixes | MED | 1.5 hrs | 80K |
| **3** | Security Hardening | LOW | 1 hr | 50K |
| **4** | AWS Artifacts Prep (no deploy) | LOW | 1.5 hrs | 80K |
| **5** | Testing & Verification | LOW | 1 hr | 50K |
| **6** | Documentation | LOW | 0.5 hr | 30K |
| | **Buffer** | | | 210K |
| | **TOTAL** | | **8 hrs** | **600K** |

---

## Phase 0: Prerequisites
**Time:** 1 hour | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 0.1 Install Docker | 20 min | 0 | 15K | apt install docker.io |
| 0.2 Verify Docker | 5 min | 0 | 5K | docker run hello-world |
| 0.3 Install AWS CLI | 15 min | 0 | 10K | apt install awscli |
| 0.4 Configure AWS (dry) | 10 min | 0 | 5K | Setup without creds if needed |
| 0.5 Verify npm test passes | 10 min | 0 | 5K | Baseline confirmation |

---

## Phase 1: Containerization & Local Test
**Time:** 1.5 hours | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 1.1 Review existing Dockerfile | 10 min | 0 | 10K | Verify still correct |
| 1.2 Build Docker image | 15 min | 0 | 15K | docker build -t traveller-vtt . |
| 1.3 Run container locally | 10 min | 0 | 10K | docker run -p 3000:3000 |
| 1.4 Test /health endpoint | 5 min | 0 | 5K | curl localhost:3000/health |
| 1.5 Test space combat in container | 20 min | 0 | 15K | Full flow test |
| 1.6 Test operations VTT in container | 15 min | 0 | 10K | Campaign/bridge test |
| 1.7 Fix any container issues | 15 min | ~20 | 15K | If needed |

---

## Phase 2: Bug Fixes
**Time:** 1.5 hours | **Risk:** MEDIUM

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 2.1 Verify multiple-fire bug status | 15 min | 0 | 15K | Test if fixed |
| 2.2 Fix multiple-fire (if needed) | 30 min | ~30 | 30K | Time-boxed |
| 2.3 Combat log display order | 15 min | ~5 | 15K | CSS fix |
| 2.4 Clean up old TODO files | 10 min | 0 | 10K | Remove fixed bug docs |
| 2.5 Update version number | 5 min | ~2 | 5K | Reflect autorun 4 |
| 2.6 Smoke test fixes | 15 min | 0 | 10K | Verify nothing broken |

---

## Phase 3: Security Hardening
**Time:** 1 hour | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 3.1 CORS lockdown | 20 min | ~15 | 20K | Environment-based origins |
| 3.2 Graceful shutdown | 15 min | ~25 | 15K | Clear intervals, close sockets |
| 3.3 Enhanced /health endpoint | 10 min | ~20 | 10K | Add metrics |
| 3.4 SIGINT handler | 5 min | ~10 | 5K | Ctrl+C cleanup |
| 3.5 Test hardening locally | 10 min | 0 | 10K | Verify no regressions |

---

## Phase 4: AWS Artifacts Preparation (NO DEPLOY)
**Time:** 1.5 hours | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 4.1 Create aws/ directory | 5 min | 0 | 5K | Structure |
| 4.2 Create task-definition.json | 20 min | ~50 | 20K | Template with placeholders |
| 4.3 Create deploy-aws.sh script | 25 min | ~60 | 25K | Full deployment automation |
| 4.4 Create security-group.sh | 10 min | ~20 | 10K | SG creation script |
| 4.5 Create pre-flight-check.sh | 15 min | ~40 | 15K | Verify prereqs before deploy |
| 4.6 Document AWS deployment steps | 15 min | ~50 | 20K | README for aws/ |

---

## Phase 5: Testing & Verification
**Time:** 1 hour | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 5.1 Run full test suite | 15 min | 0 | 15K | npm test |
| 5.2 Manual space combat test | 15 min | 0 | 15K | Multi-round fight |
| 5.3 Manual operations VTT test | 15 min | 0 | 15K | Campaign flow |
| 5.4 Docker container test | 10 min | 0 | 10K | Final container verify |
| 5.5 Document any issues found | 5 min | 0 | 5K | For future reference |

---

## Phase 6: Documentation
**Time:** 0.5 hour | **Risk:** LOW

| Task | Effort | LOC | Tokens | Notes |
|------|--------|-----|--------|-------|
| 6.1 Update main README | 10 min | ~20 | 10K | Docker instructions |
| 6.2 Create DEPLOYMENT.md | 15 min | ~50 | 15K | Full AWS guide |
| 6.3 Commit all changes | 5 min | 0 | 5K | Clean commit |

---

## Complete Task List (Line by Line)

| # | Task | Priority | Risk | Effort | LOC | Tokens |
|---|------|----------|------|--------|-----|--------|
| 0.1 | Install Docker | HIGH | LOW | 20 min | 0 | 15K |
| 0.2 | Verify Docker | HIGH | LOW | 5 min | 0 | 5K |
| 0.3 | Install AWS CLI | MED | LOW | 15 min | 0 | 10K |
| 0.4 | Configure AWS (dry) | MED | LOW | 10 min | 0 | 5K |
| 0.5 | Verify npm test | HIGH | LOW | 10 min | 0 | 5K |
| 1.1 | Review Dockerfile | MED | LOW | 10 min | 0 | 10K |
| 1.2 | Build Docker image | HIGH | LOW | 15 min | 0 | 15K |
| 1.3 | Run container locally | HIGH | LOW | 10 min | 0 | 10K |
| 1.4 | Test /health | HIGH | LOW | 5 min | 0 | 5K |
| 1.5 | Test space combat | HIGH | LOW | 20 min | 0 | 15K |
| 1.6 | Test operations VTT | HIGH | LOW | 15 min | 0 | 10K |
| 1.7 | Fix container issues | MED | LOW | 15 min | 20 | 15K |
| 2.1 | Verify multi-fire bug | HIGH | LOW | 15 min | 0 | 15K |
| 2.2 | Fix multi-fire | HIGH | **MED** | 30 min | 30 | 30K |
| 2.3 | Combat log order | MED | LOW | 15 min | 5 | 15K |
| 2.4 | Clean TODO files | LOW | LOW | 10 min | 0 | 10K |
| 2.5 | Update version | LOW | LOW | 5 min | 2 | 5K |
| 2.6 | Smoke test | HIGH | LOW | 15 min | 0 | 10K |
| 3.1 | CORS lockdown | HIGH | LOW | 20 min | 15 | 20K |
| 3.2 | Graceful shutdown | HIGH | LOW | 15 min | 25 | 15K |
| 3.3 | Enhanced /health | MED | LOW | 10 min | 20 | 10K |
| 3.4 | SIGINT handler | LOW | LOW | 5 min | 10 | 5K |
| 3.5 | Test hardening | HIGH | LOW | 10 min | 0 | 10K |
| 4.1 | Create aws/ dir | LOW | LOW | 5 min | 0 | 5K |
| 4.2 | task-definition.json | MED | LOW | 20 min | 50 | 20K |
| 4.3 | deploy-aws.sh | MED | LOW | 25 min | 60 | 25K |
| 4.4 | security-group.sh | LOW | LOW | 10 min | 20 | 10K |
| 4.5 | pre-flight-check.sh | MED | LOW | 15 min | 40 | 15K |
| 4.6 | AWS docs | MED | LOW | 15 min | 50 | 20K |
| 5.1 | Run test suite | HIGH | LOW | 15 min | 0 | 15K |
| 5.2 | Manual combat test | HIGH | LOW | 15 min | 0 | 15K |
| 5.3 | Manual ops test | HIGH | LOW | 15 min | 0 | 15K |
| 5.4 | Docker test | HIGH | LOW | 10 min | 0 | 10K |
| 5.5 | Document issues | LOW | LOW | 5 min | 0 | 5K |
| 6.1 | Update README | MED | LOW | 10 min | 20 | 10K |
| 6.2 | Create DEPLOYMENT.md | MED | LOW | 15 min | 50 | 15K |
| 6.3 | Commit changes | HIGH | LOW | 5 min | 0 | 5K |

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| **Total Tasks** | 35 |
| **Total Effort** | 8 hours |
| **Total LOC** | ~420 |
| **Total Tokens** | 390K (+ 210K buffer) |
| **HIGH Risk Tasks** | 1 (multi-fire fix) |
| **MEDIUM Risk Tasks** | 1 (multi-fire fix) |
| **LOW Risk Tasks** | 33 |

---

## Risk Summary (Post-Mitigation)

| Risk | Original | Mitigated | Notes |
|------|----------|-----------|-------|
| AWS deployment failure | HIGH | **ELIMINATED** | Not deploying this session |
| WebSocket ALB issues | HIGH | **ELIMINATED** | Not deploying this session |
| Docker issues | MEDIUM | LOW | Well-documented process |
| Multi-fire bug complex | MEDIUM | LOW | Time-boxed, can defer |
| Container issues | MEDIUM | LOW | Fallback to npm start |

**Overall Risk:** LOW (was HIGH before scope change)
**Confidence:** 95% clean autorun

---

## Game Day Options

### Option A: Docker (Recommended)
```bash
docker run -d -p 3000:3000 --name vtt traveller-vtt:latest
# Access at http://localhost:3000
```

### Option B: npm start (Fallback)
```bash
npm start
# Access at http://localhost:3000
```

### Option C: Remote Players (if needed)
```bash
# After starting server:
ngrok http 3000
# Share ngrok URL with players
```

---

## Post-Game: AWS Deployment

All artifacts will be ready. When you have time:
1. Generate AWS credentials from console
2. Run: `./aws/pre-flight-check.sh`
3. Run: `./aws/deploy-aws.sh`
4. Test deployed URL
5. Share with group for future sessions

---

**STATUS:** READY FOR GO AUTORUN
**Scope:** Preparation & hardening only
**Deployment:** Deferred to post-game session
**Game Day:** Local Docker or npm start

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
