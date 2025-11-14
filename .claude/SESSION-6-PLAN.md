# Session 6: Integrated Automation Framework (Puppeteer + Puppetry)
**Created:** 2025-11-14
**Type:** Autonomous build session
**Risk Level:** MODERATE
**Target Duration:** 12-15h (shared foundation, two modes)

---

## 🎯 STRATEGIC APPROACH: Complementary Automation

**User Requirement:** "Use both. Use one to augment the other. Use them in a complementary way."

**Architecture Decision:** Build unified automation framework supporting BOTH modes:

### Core Foundation (Shared, ~40% of work)
- Element registry (data-test-id attributes)
- Remote control API (server endpoints)
- Test scenario framework
- Battle state inspection

### Puppeteer Mode (Headless, ~30% of work)
- Fast, headless execution
- Performance metrics collection
- Load testing (10 concurrent battles)
- CI/CD integration
- **Use Case:** Performance testing, automated regression tests

### Puppetry Mode (Visible, ~30% of work)
- Visible browser with slow, deliberate actions
- Visual feedback (highlight before click)
- Status overlay ("Now clicking Fire button...")
- Human-watchable execution
- **Use Case:** Debugging, demonstrations, AI gameplay showcase

**Key Insight:** Same test scripts run in BOTH modes via `--headless` flag

---

## 📋 SESSION SCOPE (12-15h)

### Phase 1: Shared Foundation (5h)

#### 1.1 Element Registry System (2h)
**Goal:** Add data-test-id attributes to all interactive elements

**Implementation:**
```html
<!-- Before -->
<button onclick="fireWeapon()">Fire!</button>

<!-- After -->
<button data-test-id="fire-weapon-btn" onclick="fireWeapon()">Fire!</button>
```

**Elements to Register:**
- Ship selection buttons (scout, free-trader)
- Range selection dropdown
- Ready button
- Fire button
- End turn button
- Weapon selection
- Target selection
- Combat log elements
- Status displays

**Deliverable:** `docs/ELEMENT-REGISTRY.md` - Complete element ID reference

---

#### 1.2 Remote Control API (2.5h)
**Goal:** Server endpoints for programmatic control

**New Endpoints:**
```javascript
// Battle control
POST /api/test/battle/create
POST /api/test/battle/join/:battleId
POST /api/test/action/fire
POST /api/test/action/endTurn
GET  /api/test/battle/:battleId/state

// Ship control
POST /api/test/ship/select
POST /api/test/ship/setRange

// Inspection
GET  /api/test/battles/active
GET  /api/test/players/:playerId/state
```

**Security:** Only enabled when `NODE_ENV=test` or `ENABLE_TEST_API=true`

**Deliverable:** `lib/test-api.js` - Remote control endpoints

---

#### 1.3 Test Scenario Framework (0.5h)
**Goal:** Reusable test scenario definitions

**Example Scenario:**
```javascript
const basicCombat = {
  name: "Basic Combat (Scout vs Free Trader)",
  ships: [
    { type: "scout", player: 1 },
    { type: "free-trader", player: 2 }
  ],
  range: "medium",
  actions: [
    { player: 1, action: "fire", weapon: "pulse_laser", target: "ship-2" },
    { player: 2, action: "fire", weapon: "beam_laser", target: "ship-1" },
    { player: 1, action: "endTurn" }
  ]
};
```

**Deliverable:** `tests/scenarios/` - Scenario definitions

---

### Phase 2: Puppeteer Mode (Headless, 3.5h)

#### 2.1 Puppeteer Test Runner (1.5h)
**Goal:** Headless execution for performance testing

**Features:**
- Launch headless Chrome
- Connect to test API
- Execute scenarios at full speed
- Collect performance metrics
- No visual feedback (fast)

**Implementation:**
```javascript
// tests/performance/puppeteer-runner.js
const puppeteer = require('puppeteer');

async function runHeadless(scenario) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Fast execution, no delays
  await page.goto('http://localhost:3000');
  await executeScenario(page, scenario);

  const metrics = await collectMetrics(page);
  await browser.close();
  return metrics;
}
```

**Deliverable:** `tests/performance/puppeteer-runner.js`

---

#### 2.2 Multi-Client Load Testing (2h)
**Goal:** Simulate 2-10 concurrent battles

**Scenarios:**
- Scenario A: 2 battles (4 players) - Baseline
- Scenario B: 5 battles (10 players) - Moderate
- Scenario C: 10 battles (20 players) - Target load

**Metrics Collected:**
- WebSocket latency (client → server → client)
- Combat resolution time (<100ms target)
- Server memory usage
- Server CPU usage
- Connection stability

**Deliverable:** `tests/performance/load-test.js`

---

### Phase 3: Puppetry Mode (Visible, 3.5h)

#### 3.1 Visible Automation with Feedback (2h)
**Goal:** Slow, deliberate, human-watchable execution

**Visual Features:**
1. **Element Highlighting:** Yellow border before click
2. **Action Delays:** 500ms-1s between actions
3. **Status Overlay:** Floating div showing current action
4. **Smooth Scrolling:** Scroll to element before click
5. **Hover Effects:** Mouse-over before click

**Implementation:**
```javascript
// tests/puppetry/puppetry-runner.js
async function runVisible(scenario) {
  const browser = await puppeteer.launch({
    headless: false,  // VISIBLE
    slowMo: 500       // 500ms delay between actions
  });

  const page = await browser.newPage();

  // Inject visual feedback
  await page.evaluateOnNewDocument(() => {
    window.puppetryHighlight = (selector) => {
      const el = document.querySelector(selector);
      el.style.border = '3px solid yellow';
      el.style.boxShadow = '0 0 10px yellow';
    };
  });

  // Execute with visual feedback
  await executeScenarioWithFeedback(page, scenario);
}
```

**Deliverable:** `tests/puppetry/puppetry-runner.js`

---

#### 3.2 Status Overlay System (1.5h)
**Goal:** Show what puppetry is doing

**Features:**
- Floating status box (top-right corner)
- Current action description
- Progress indicator
- Color-coded states (green=success, yellow=waiting, red=error)

**Example Overlay:**
```
┌─────────────────────────┐
│ 🤖 PUPPETRY ACTIVE      │
│ ───────────────────     │
│ Now: Selecting Scout    │
│ Next: Clicking Ready    │
│ Battle: 1/10            │
└─────────────────────────┘
```

**Deliverable:** `public/puppetry-overlay.js`

---

### Phase 4: Integration & Testing (2h)

#### 4.1 Unified CLI (1h)
**Goal:** Single command for both modes

**Usage:**
```bash
# Headless performance testing (fast)
npm run test:perf -- --headless --battles=10

# Visible puppetry (slow, watchable)
npm run test:perf -- --visible --slow --battles=2

# Specific scenario
npm run test:perf -- --visible --scenario=basic-combat
```

**Deliverable:** `tests/performance/cli.js`

---

#### 4.2 Performance Report (1h)
**Goal:** Document findings and bottlenecks

**Report Sections:**
1. **Baseline Performance** (2 battles)
2. **Moderate Load** (5 battles)
3. **Target Load** (10 battles)
4. **Bottlenecks Identified**
5. **Optimization Recommendations**

**Deliverable:** `docs/PERFORMANCE-REPORT.md`

---

### Overhead Work (2h, 30% target)

- Pre-session sweep: 0.3h (push Session 5 commits)
- Session planning: 0.5h (this document)
- README updates: 0.3h
- Velocity metrics: 0.4h
- CTO mentor update: 0.3h
- Completion report: 0.2h

---

## 🎯 ACCEPTANCE CRITERIA

### Core Foundation
- [ ] All interactive elements have data-test-id attributes
- [ ] Element registry documented (ELEMENT-REGISTRY.md)
- [ ] Remote control API endpoints functional
- [ ] Test scenarios defined and reusable

### Puppeteer Mode (Headless)
- [ ] Can run headless tests (no visible browser)
- [ ] Can simulate 2-10 concurrent battles
- [ ] Performance metrics collected (latency, memory, CPU)
- [ ] Load test results documented

### Puppetry Mode (Visible)
- [ ] Visible browser execution works
- [ ] Elements highlighted before click
- [ ] Status overlay shows current action
- [ ] Slow, deliberate, human-watchable execution

### Integration
- [ ] Unified CLI supports both modes (--headless / --visible)
- [ ] Same scenarios work in both modes
- [ ] All 197 existing tests still passing
- [ ] No regressions introduced

### Documentation
- [ ] Element registry complete
- [ ] Performance report created
- [ ] Usage guide for both modes
- [ ] Bottleneck recommendations documented

---

## 📊 RISK ASSESSMENT

### Risk 1: Scope Too Large (12-15h)
**Severity:** MEDIUM | **Probability:** MEDIUM

**Mitigation:**
- Shared foundation reduces duplicate work (60%+ code reuse)
- Focus on MVP: Basic element registry, simple API, one scenario
- Defer advanced features (animations, complex overlays) to Session 7

**Checkpoint at 8h:** Evaluate progress, GO/NO-GO/PIVOT

**Residual Risk:** MEDIUM

---

### Risk 2: ChromeOS Visible Browser Issues
**Severity:** MEDIUM | **Probability:** LOW

**Description:** ChromeOS may restrict visible browser automation

**Mitigation:**
1. Test visible mode early (Phase 3.1)
2. Fallback to headless if visible mode fails
3. Document platform limitations

**Contingency:** If visible mode doesn't work on ChromeOS, document limitation and recommend cloud testing environment

**Residual Risk:** LOW

---

### Risk 3: Test API Security Concerns
**Severity:** LOW | **Probability:** LOW

**Description:** Remote control API could be abused if exposed in production

**Mitigation:**
1. Only enable when `NODE_ENV=test` or `ENABLE_TEST_API=true`
2. Add rate limiting (max 100 requests/minute)
3. Document security considerations
4. Add warning in server logs when enabled

**Residual Risk:** VERY LOW

---

## 📈 VELOCITY PROJECTION

**Based on Sessions 3A-5:**

| Metric | Session 4 | Session 5 | Session 6 Target |
|--------|-----------|-----------|------------------|
| Duration | 9h | 8h | **12-15h** |
| Overhead | 20% | 19% | **≤30%** |
| LOC/hour | 347 | 287 | **200-250** (complex automation) |
| Tests Added | 48 | 0 | **15-25** (Puppeteer + Puppetry) |

**Expected Output:**
- Element registry: ~50-100 LOC (HTML attributes)
- Remote control API: ~300-400 LOC
- Puppeteer runner: ~200-300 LOC
- Puppetry runner: ~300-400 LOC
- CLI + scenarios: ~100-200 LOC
- Documentation: ~300-500 LOC
- **Total: ~1,250-1,900 LOC**

---

## 🚀 EXECUTION PLAN

### Pre-Start (0.5h)
1. Push Session 5 commits to origin (8 commits)
2. Verify CI/CD pipeline runs successfully
3. Clean up background server process
4. Create session branch: `feature/session-6-automation`

### Phase 1: Foundation (5h) - Hours 0-5
1. Add data-test-id to all interactive elements
2. Create element registry documentation
3. Implement remote control API endpoints
4. Create basic test scenarios

**Checkpoint 1 (5h):** Foundation complete, can control app via API

### Phase 2: Puppeteer (3.5h) - Hours 5-8.5
5. Create Puppeteer headless runner
6. Implement multi-client load testing
7. Collect performance metrics

**Checkpoint 2 (8h):** Headless mode working, performance data collected

### Phase 3: Puppetry (3.5h) - Hours 8.5-12
8. Create visible Puppetry runner
9. Add visual feedback (highlighting, delays)
10. Create status overlay system

**Checkpoint 3 (12h):** Visible mode working, human-watchable

### Phase 4: Integration (2h) - Hours 12-14
11. Create unified CLI
12. Test both modes with same scenarios
13. Document findings and bottlenecks

**Checkpoint 4 (14h):** Both modes working, report complete

### Overhead (2h) - Throughout
- Session planning (0.5h, start)
- README updates (0.3h, mid)
- Velocity metrics (0.4h, end)
- Completion report (0.2h, end)
- CTO mentor update (0.3h, end)
- Misc overhead (0.3h, throughout)

---

## 🎓 COMPLEMENTARY VALUE PROPOSITION

**Why This Integrated Approach Is Superior:**

### 1. Code Reuse (60%+)
- Element registry used by BOTH modes
- Test API used by BOTH modes
- Scenarios used by BOTH modes
- Only runners differ (headless vs visible)

### 2. Development Efficiency
- Building separately: 10h (Puppeteer) + 15.5h (Puppetry) = **25.5h**
- Building together: 12-15h with shared foundation = **40% time savings**

### 3. Complementary Use Cases
- **Puppeteer (headless):** Fast performance testing, CI/CD, regression tests
- **Puppetry (visible):** Debugging, demonstrations, stakeholder showcases, AI gameplay

### 4. Same Test Coverage
- Write scenario ONCE
- Run in BOTH modes
- Fast validation (headless) + visual debugging (visible)

### 5. Portfolio Impact
- Demonstrates architectural thinking (reusable foundations)
- Shows understanding of complementary tools
- Proves efficiency optimization (code reuse)

---

## ✅ FINAL GO/NO-GO DECISION

**All Criteria Met:**
- ✅ Integrated architecture designed (shared foundation)
- ✅ Scope realistic (12-15h with 60%+ code reuse)
- ✅ Checkpoints defined (5h, 8h, 12h, 14h)
- ✅ Risks assessed and mitigated
- ✅ Clear acceptance criteria
- ✅ Session 5 complete (portfolio foundation solid)
- ✅ All 197 tests passing
- ✅ Environment ready (Puppeteer installed)

**GO/NO-GO:** 🟢 **GO - Integrated Automation Framework**

**Next Steps:**
1. Push Session 5 commits
2. Verify CI/CD pipeline
3. Begin Phase 1: Shared Foundation

---

**Created:** 2025-11-14
**Status:** READY FOR EXECUTION
**Risk Level:** MODERATE (managed with checkpoints)
**Target Duration:** 12-15h
**Strategic Focus:** Complementary automation (headless + visible)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
