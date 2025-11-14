# Autonomous Session 4 - Plan
**Date:** 2025-11-13
**Type:** Forward-Pulling Safe Work (Stages 14-15)
**Duration Target:** 10-12h (8h primary + 2.4h overhead = 30% target)
**Branch:** autonomous-session-4

---

## 🎯 SESSION OBJECTIVES

**Primary Goal:** Implement export/import system for Session 3A schemas + deployment infrastructure

**Success Criteria:**
- ✅ Export/import functions for ship/battle/character schemas
- ✅ Schema validation implementation
- ✅ Docker containerization (Dockerfile + docker-compose)
- ✅ Health check endpoint
- ✅ All tests passing (161+ baseline)
- ✅ 30% overhead limit maintained

---

## 📋 PRE-SESSION SWEEP RESULTS

**Stages Scanned:** 13, 14, 15, 16

### Stage 13 (Refactoring) - ⚠️ HIGH RISK
- Requires major refactoring of combat.js (1,605 LOC)
- Could break existing tests
- **Decision:** SKIP for this session (too risky)

### Stage 14 (VTT Integration) - ✅ SAFE WORK FOUND
**Pullable Work:**
- ✅ Export/import functions (schemas already exist from Session 3A)
- ✅ Schema validation implementation
- ✅ Migration utilities
- ✅ Schema versioning system
- ⚠️ VTT-specific APIs (Roll20, Foundry, FG) - SKIP (needs research)

### Stage 15 (Deployment) - ✅ SAFE WORK FOUND
**Pullable Work:**
- ✅ Dockerfile (standard Node.js pattern)
- ✅ docker-compose.yml (dev + prod configs)
- ✅ Health check endpoint
- ⚠️ CI/CD pipeline - DEFER (needs cloud platform decision)
- ⚠️ Azure/GCP/AWS specifics - DEFER (needs user decision)

### Stage 16 (Advanced Features) - ❌ NO SAFE WORK
- Most requires UI/UX work or complex business logic
- **Decision:** SKIP for this session

---

## 📦 PLANNED DELIVERABLES

### Primary Work (Target: 8.0h)

#### 1. Export/Import System (3.5h)
**File:** `lib/export-import.js`
**Tests:** `tests/unit/export-import.test.js`

**Functions to Implement:**
```javascript
// Ship Instance Export/Import
function exportShipInstance(ship, battleState)
function importShipInstance(jsonData)
function validateShipInstance(jsonData)

// Battle State Export/Import
function exportBattleState(gameState)
function importBattleState(jsonData)
function validateBattleState(jsonData)

// Character Export/Import
function exportCharacter(character)
function importCharacter(jsonData)
function validateCharacter(jsonData)

// Utility Functions
function migrateSchema(jsonData, fromVersion, toVersion)
function detectSchemaVersion(jsonData)
function validateAgainstSchema(jsonData, schemaPath)
```

**Schema Files Used:**
- `data/schemas/ship-instance-export.schema.json` (Session 3A)
- `data/schemas/battle-state-export.schema.json` (Session 3A)
- `data/schemas/character-export.schema.json` (Session 3A)

**Tests:**
- Export valid ship instance
- Import and reconstruct ship state
- Export multi-ship battle
- Import and restore full battle state
- Character export/import round-trip
- Schema validation (valid/invalid data)
- Migration from v1 to v2
- Schema version detection
- Error handling (malformed JSON, missing fields)

**Estimated:** 3.5h (2h implementation + 1.5h tests)

---

#### 2. Schema Validation Module (1.5h)
**File:** `lib/schema-validator.js`
**Tests:** `tests/unit/schema-validator.test.js`

**Functions:**
```javascript
function validateJSON(data, schemaPath)
function getSchemaVersion(data)
function getSupportedVersions()
function getSchemaPath(type, version)
```

**Estimated:** 1.5h (1h implementation + 0.5h tests)

---

#### 3. Docker Containerization (1.5h)
**Files Created:**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

**Dockerfile Features:**
- Multi-stage build (build + runtime)
- Node.js 18 LTS base image
- npm ci for production dependencies
- Security: run as non-root user
- Health check command
- Optimized layer caching

**docker-compose.yml:**
- Development configuration
- Production configuration (separate service)
- Volume mounts for dev mode
- Port mapping (3000:3000)
- Environment variable examples

**Estimated:** 1.5h (1h Dockerfile + 0.5h docker-compose + testing)

---

#### 4. Health Check Endpoint (0.5h)
**File:** `server.js` (add endpoint)
**Tests:** `tests/integration/health-check.test.js`

**Implementation:**
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: require('./package.json').version,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', (req, res) => {
  // Readiness check (can accept traffic)
  const ready = true; // Add actual readiness checks
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    timestamp: new Date().toISOString()
  });
});
```

**Tests:**
- Health endpoint returns 200
- Health endpoint returns expected JSON
- Ready endpoint returns 200 when ready
- Ready endpoint returns 503 when not ready

**Estimated:** 0.5h (0.25h implementation + 0.25h tests)

---

#### 5. Documentation (1.0h)
**Files:**
- `docs/export-import-api.md` - API documentation for export/import functions
- `docs/docker-deployment.md` - Docker deployment guide
- Update `README.md` - Add Docker quickstart section

**Estimated:** 1.0h

---

**Total Primary Work: 8.0h**

---

### Overhead Work (Target: 2.4h max = 30%)

#### 1. README Updates (0.25h)
- Update status to "Export/Import System Complete"
- Add Docker deployment section
- Update feature list

#### 2. MD File Index Update (0.1h)
- Add new documentation files if created
- Update file count

#### 3. Code Quality Pass (0.5h)
- Run lint check
- Fix any trivial warnings
- Remove any console.log statements
- Check for unused imports

#### 4. Session Completion Report (0.5h)
- Document deliverables
- Metrics tracking
- Overhead analysis
- Update OVERHEAD-LIMIT-TRACKING.md

#### 5. Brief CTO Note (0.5h)
- Brief session notes
- No deep analysis (save for future synthesis)

**Total Overhead: 1.85h (23% - under 30% target ✅)**

---

## 🎯 RISK ASSESSMENT

### Primary Work Risk Analysis

| Work Item | Risk Score | Rationale |
|-----------|-----------|-----------|
| Export/Import | **LOW (10%)** | Pure functions, schemas defined, well-tested pattern |
| Schema Validation | **LOW (15%)** | Standard JSON schema validation, no dependencies |
| Dockerfile | **LOW (10%)** | Standard pattern, well-documented |
| docker-compose | **LOW (10%)** | Standard configuration |
| Health Endpoint | **ZERO (5%)** | Trivial HTTP endpoint |
| Documentation | **ZERO (5%)** | Pure documentation |

**Overall Session Risk:** **LOW (9%)** → Safe for 12h session ✅

---

## ⏱️ TIME ALLOCATION

**Primary Work:** 8.0h
- Export/Import System: 3.5h
- Schema Validation: 1.5h
- Docker Containerization: 1.5h
- Health Endpoint: 0.5h
- Documentation: 1.0h

**Overhead Work:** 1.85h (23%)
- README updates: 0.25h
- MD index: 0.1h
- Code quality: 0.5h
- Session report: 0.5h
- CTO note: 0.5h

**Total Estimated:** 9.85h (~10h session)

**Overhead Compliance:** 23% (under 30% target ✅)

---

## 📊 SUCCESS METRICS

**Code Metrics:**
- New production LOC: ~600-800
- New test LOC: ~400-500
- Total LOC: ~1,000-1,300

**Test Coverage:**
- Baseline: 161 tests passing
- Target: 180-190 tests passing (+19-29 tests)

**Quality Gates:**
- ✅ All existing tests pass
- ✅ New tests pass
- ✅ No console errors
- ✅ Lint clean (or documented exceptions)
- ✅ Docker container builds and runs
- ✅ Health endpoint responds correctly

---

## 🚨 DEFERRAL TRIGGERS

**Stop work immediately if:**
- Any existing test breaks
- Time estimate 2× over on any item
- Integration points unclear
- Schema assumptions incorrect
- Docker build fails repeatedly

**Deferral Protocol:**
1. Stop work
2. Document issue
3. Commit work in progress
4. Move to next safe item
5. Report deferral in completion report

---

## 📝 COMMIT STRATEGY

**Commit after each deliverable:**
1. "feat: Implement export/import system for ship/battle/character schemas"
2. "feat: Add schema validation module with version detection"
3. "feat: Add Docker containerization (Dockerfile + docker-compose)"
4. "feat: Add health check and readiness endpoints"
5. "docs: Add export/import API documentation and Docker guide"
6. "chore: Update README with Docker deployment and export/import features"
7. "docs: Session 4 completion report"

**Tag at completion:** `session-4-complete`

---

## ✅ DEFINITION OF DONE

**Primary Work:**
- [ ] Export/import functions implemented with tests
- [ ] Schema validation module complete
- [ ] Dockerfile builds successfully
- [ ] docker-compose.yml works (dev + prod)
- [ ] Health/ready endpoints respond correctly
- [ ] Documentation complete

**Quality:**
- [ ] All tests passing (180+ tests)
- [ ] No regressions
- [ ] Lint clean
- [ ] Docker container runs application

**Overhead:**
- [ ] README updated
- [ ] MD index current
- [ ] Session report complete
- [ ] Overhead tracked (should be ~23-30%)

---

**Status:** READY TO EXECUTE
**Next:** Begin with export/import system implementation
**Estimated Completion:** 10 hours
