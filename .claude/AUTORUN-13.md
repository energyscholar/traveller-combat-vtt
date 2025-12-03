# AUTORUN 13: Bug Fixes, MVC Extraction & UI Polish

**Created:** 2025-12-02
**Status:** READY
**Risk Level:** MEDIUM (multiple concerns, but well-scoped)
**Prerequisite:** AUTORUN-12 complete, uncommitted WIP to incorporate

## Execution Protocol
**Token Efficiency Mode:** Auto-adjust effort to minimize token use.
- `[65%]` BURST: Exploration, planning, debugging
- `[40%]` CRUISE: Sequential implementation, clear path
- Signal mode changes inline. Override with user instruction.

---

## Overview

Four combined concerns in one autorun:
1. **Test Discovery** - Puppeteer tests for each crew role to find bugs
2. **Bug Fixes** - Fix issues discovered by tests
3. **MVC Stage 2** - Combat handler extraction from server.js
4. **UI Polish** - Expandable panels + full-screen email

---

## Stage 13.0: Puppeteer Role Test Suite (TEST-FIRST DISCOVERY)
**Risk:** LOW | **LOC:** ~400 | **Commit after**

Create comprehensive Puppeteer tests for each crew role to systematically discover what's broken.

### Existing Infrastructure:
- `tests/e2e/puppeteer-utils.js` - Shared utilities (createPage, gmLogin, selectRole, etc.)
- `tests/e2e/puppeteer-operations-suite.js` - Basic regression tests
- `tests/e2e/puppeteer-relieve-test.js` - Relieve crew tests

### New Test File: `tests/e2e/puppeteer-role-tests.js`

| Role | Tests to Create |
|------|-----------------|
| **Captain** | View all panels, issue orders, authorize weapons, relieve crew |
| **Pilot** | Maneuver controls, thrust display, evasion |
| **Astrogator** | Jump plotting, map display, route planning |
| **Engineer** | Power management, damage control, system status |
| **Gunner** | Weapon selection, fire controls, ammo display |
| **Sensor Operator** | Contact list, scan controls, target lock |
| **Comms** | Hail ships, message queue, frequency selection |
| **Medic** | Crew health, injury treatment, medical supplies |
| **Steward** | Passenger manifest, morale, supplies |
| **Marine** | Security status, boarding readiness |
| **Damage Control** | Hull status, repair queue, emergency systems |

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 13.0.1 | Create `puppeteer-role-tests.js` framework | ~50 |
| 13.0.2 | Add role selection helpers to utils | ~30 |
| 13.0.3 | Captain role tests (command functions) | ~40 |
| 13.0.4 | Pilot role tests (flight controls) | ~30 |
| 13.0.5 | Astrogator role tests (navigation) | ~40 |
| 13.0.6 | Engineer role tests (power/systems) | ~30 |
| 13.0.7 | Gunner role tests (weapons) | ~30 |
| 13.0.8 | Sensor Operator role tests (scanning) | ~30 |
| 13.0.9 | Comms role tests (communications) | ~30 |
| 13.0.10 | Medic role tests (medical bay) | ~30 |
| 13.0.11 | Steward/Marine/DC role tests | ~30 |
| 13.0.12 | Run all tests, generate bug report | ~30 |

### Test Pattern for Each Role:
```javascript
async function testRole(page, roleName) {
  const results = [];

  // 1. Can select this role
  results.push(await testRoleSelection(page, roleName));

  // 2. Role panel appears on bridge
  results.push(await testRolePanelVisible(page, roleName));

  // 3. Role-specific controls work
  results.push(await testRoleControls(page, roleName));

  // 4. Role actions execute without error
  results.push(await testRoleActions(page, roleName));

  // 5. Role panel displays correct data
  results.push(await testRolePanelData(page, roleName));

  return results;
}
```

### Output: Bug Discovery Report
After running tests, generate `BUG-DISCOVERY-REPORT.md`:
```markdown
## Role Test Results

| Role | Selection | Panel | Controls | Actions | Data |
|------|-----------|-------|----------|---------|------|
| Captain | ✓ | ✓ | ✗ | ✗ | ✓ |
| Pilot | ✓ | ✓ | ✓ | ✓ | ✓ |
...

## Bugs Found
1. Captain: "Authorize Weapons" button throws error
2. Engineer: Power slider doesn't update display
...
```

**Deliverable:** Complete test suite for all 11 roles, bug discovery report generated.

---

## Stage 13.1: Bug Fixes (Discovered by 13.0 + Known Issues)
**Risk:** MEDIUM | **LOC:** ~200+ | **Commit after**

Fix bugs discovered by Puppeteer tests PLUS known issues from screenshots.

### Known Bugs (Pre-Discovery):
| Bug | Description | Root Cause | Fix |
|-----|-------------|------------|-----|
| GM as Crew | GM appears in crew list with relieve button | GM socket joins bridge, gets listed as crew | Filter GM from crew display |
| Captain Conflict | "Role captain already taken" on reconnect | Reconnecting player's old role not cleared | Clear stale role on disconnect |
| Relieve UI Missing | Relieve button not showing for some crew | Conditional logic bug in role-panels.js | Fix visibility condition |

### Bugs to Discover (via 13.0):
- Role panel functionality issues
- Button actions that throw errors
- Data display problems
- Socket event failures
- State sync issues

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 13.1.1 | Fix GM-as-crew bug | ~30 |
| 13.1.2 | Fix captain role conflict | ~40 |
| 13.1.3 | Fix relieve button visibility | ~30 |
| 13.1.4 | Fix bugs from discovery report | ~100+ |
| 13.1.5 | Verify all Puppeteer tests pass | ~0 |

**Deliverable:** All discovered bugs fixed, Puppeteer role tests green.

---

## ~~Stage 13.2: Combat Handler Extraction (MVC Phase 2)~~ ALREADY COMPLETE ✅

**Status:** DONE - Verified 2025-12-02

MVC extraction already complete:
- `server.js` is **414 LOC** (target was <500) ✅
- `lib/socket-handlers/combat.handlers.js` exists ✅
- `lib/socket-handlers/space.handlers.js` (32KB) ✅
- `lib/socket-handlers/operations.handlers.js` (125KB) ✅

**No work needed for this stage.**

---

## Stage 13.3: Expandable Role Panels
**Risk:** LOW | **LOC:** ~200 | **Commit after**

Role panels need expansion options for data-heavy roles.

### Problem:
- Crew role panel often too small
- Astrogator needs large map display
- Sensors needs room for contact analysis

### Solution:
Two expansion modes:
1. **Claim Sensor Display** - Role panel expands into sensor area (half-screen)
2. **Full Screen** - Role panel takes entire viewport

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 13.3.1 | Add expand/collapse buttons to role panel header | ~30 |
| 13.3.2 | CSS for half-screen mode (claim sensor area) | ~40 |
| 13.3.3 | CSS for full-screen mode | ~40 |
| 13.3.4 | JavaScript toggle logic with state persistence | ~50 |
| 13.3.5 | Keyboard shortcut (Escape to collapse, F to fullscreen) | ~20 |
| 13.3.6 | Remember expansion state per role | ~20 |

### Affected Roles:
- Astrogator (jump maps) - PRIMARY
- Sensors (contact analysis)
- Captain (tactical overview)
- Engineer (system diagnostics)
- Medic (medical records)

**Deliverable:** Any role panel can expand to half-screen or full-screen.

---

## Stage 13.4: Full-Screen Email App
**Risk:** LOW | **LOC:** ~250 | **Commit after**

Email should be a full-screen application experience.

### Current Behavior:
- Email appears as popup/modal
- Doesn't persist - closes on interaction
- Feels like notification, not app

### New Behavior:
- Full-screen email client UI
- Inbox list on left, message view on right
- Persists until user explicitly closes
- Read/unread status
- Compose new message (to GM or crew)

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 13.4.1 | Create full-screen email container HTML | ~40 |
| 13.4.2 | Email app CSS (inbox list, message pane) | ~60 |
| 13.4.3 | Email app JavaScript (open/close, navigation) | ~60 |
| 13.4.4 | Inbox list with read/unread indicators | ~30 |
| 13.4.5 | Message view with full content | ~30 |
| 13.4.6 | Close button and Escape key to exit | ~20 |
| 13.4.7 | Socket event to mark messages as read | ~10 |

### UI Layout:
```
┌─────────────────────────────────────────────────────┐
│ SHIP MAIL                                     [X]   │
├─────────────────┬───────────────────────────────────┤
│ INBOX           │ FROM: Starport Authority          │
│                 │ DATE: 310-1115 08:16              │
│ ● New Message   │ SUBJ: Docking Clearance           │
│ ○ Old Message   │ ─────────────────────────────────│
│ ○ Another Msg   │                                   │
│                 │ Your vessel Kimbly has been       │
│                 │ cleared for docking at Bay 7...   │
│                 │                                   │
├─────────────────┴───────────────────────────────────┤
│ [Compose New Message]                               │
└─────────────────────────────────────────────────────┘
```

**Deliverable:** Email is a proper full-screen app, not a transient popup.

---

## Total Estimates

| Stage | LOC | Risk |
|-------|-----|------|
| 13.0 Puppeteer Role Tests | ~400 | LOW |
| 13.1 Bug Fixes | ~200+ | MEDIUM |
| ~~13.2 MVC Extraction~~ | ~~300~~ | ✅ DONE |
| 13.3 Expandable Panels | ~200 | LOW |
| 13.4 Full-Screen Email | ~250 | LOW |
| **Total** | **~1050+** | **MEDIUM** |

---

## Stage Dependencies

```
13.0 (Puppeteer Tests) ───┐
          │               │
          ▼               │
13.1 (Bug Fixes) ─────────┤
                          ├──→ Final Commit
13.3 (Expandable Panels) ─┤
                          │
13.4 (Full-Screen Email) ─┘
```

**Execution Order:**
1. **13.0 first** - Creates tests, discovers bugs
2. **13.1 second** - Fixes bugs found by 13.0
3. **13.3-13.4** - Independent, any order

*Note: 13.2 (MVC Extraction) already complete - skipped*

---

## Pre-Flight Checklist

Before starting:
- [ ] Review uncommitted changes (~1,119 LOC)
- [ ] Decide: commit WIP or incorporate into 13.1
- [ ] Run tests to confirm 325 passing
- [ ] Note any new test failures

---

## Success Criteria

| Stage | Criterion |
|-------|-----------|
| 13.1 | No role bugs, GM excluded from crew list, reconnect works |
| 13.2 | Combat handlers extracted, server.js < 500 LOC, tests pass |
| 13.3 | Role panels expand to half/full screen, Escape collapses |
| 13.4 | Email is full-screen app, persists, shows inbox list |

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Bug fixes break other features | Run full test suite after each fix |
| MVC extraction introduces regressions | Incremental extraction, test after each move |
| UI changes affect responsive layout | Test on multiple screen sizes |
| Email state conflicts with other modals | Use dedicated app layer, not modal system |

---

## Commit Strategy

1. **Commit 1:** Stage 13.1 - Bug fixes for role management
2. **Commit 2:** Stage 13.2 - Combat handler extraction
3. **Commit 3:** Stage 13.3 - Expandable role panels
4. **Commit 4:** Stage 13.4 - Full-screen email app
5. **Final:** Squash or keep separate per preference

---

## Definition of Done

- [ ] All 3 role management bugs fixed
- [ ] Combat handlers in dedicated file
- [ ] server.js reduced in size
- [ ] Role panels can expand (half-screen, full-screen)
- [ ] Email is full-screen persistent app
- [ ] All tests pass (325+)
- [ ] No console errors in browser
- [ ] Manual testing of all flows
