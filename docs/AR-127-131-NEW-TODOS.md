# New ARs from TODO Processing (2025-12-15)

---

## AR-127: Sensor Objects Display Fix (HIGH PRIORITY)

**Source:** User TODO - "Sensor Objects display needs serious work"
**Risk:** HIGH → needs careful fixes to avoid breaking working features

### Critical Bugs Found

| Bug | Severity | Issue |
|-----|----------|-------|
| Socket mismatch | CRITICAL | Client sends `ops:sensorLock`, server expects `ops:setSensorLock` |
| Missing handlers | CRITICAL | No server handlers for `ops:setECM`, `ops:setECCM`, `ops:breakSensorLock` |
| Duplicate ECM | MEDIUM | ECM section renders twice in role-panels.js (lines 1271 AND 1318) |
| Property naming | MEDIUM | `ecmActive` vs `ecm` inconsistent across files |
| Filter/sort broken | LOW | Dropdowns exist but no event handlers |

### Implementation Plan

**Stage 1: Fix Socket Mismatches (1hr)**
- Client: Change `ops:sensorLock` → `ops:setSensorLock`
- Client: Change `ops:breakSensorLock` → use `ops:setSensorLock` with `locked: false`
- Client: Change `ops:setECM/setECCM` → `ops:setEW` with type parameter

**Stage 2: Remove Duplicate ECM Section (30min)**
- Delete duplicate block at lines 1318-1341 in role-panels.js
- Keep single ECM/ECCM/Stealth section

**Stage 3: Normalize Property Names (1hr)**
- Standardize on `ecm`, `eccm`, `stealth` (not `ecmActive`)
- Update all references in role-panels.js and app.js

**Stage 4: Wire Filter/Sort (1hr)**
- Add onchange handlers to filter/sort dropdowns
- Implement filtering by contact type
- Implement sorting by range/name/type

### Risk Mitigation
- Test each socket event individually
- Verify ECM toggle works before/after
- Test sensor lock acquire/release cycle

### UQs for User
1. Should filter/sort persist across page refresh?
2. Should ECM affect ALL contacts or only selected target?

---

## AR-128: Observer Role Enhancement (MEDIUM PRIORITY)

**Source:** User TODO - "Observers choose to watch any other role"
**Risk:** MEDIUM → new feature, must be crash-resistant

### Current State
- Observer shows static ship status
- No role-watching capability
- Two rendering functions exist (inconsistent)

### Requirements
1. Observer can select which role to watch
2. Observer sees same panel as watched role
3. Default: watch Pilot
4. Must be safe - crash gracefully, lose features not stability

### Implementation Plan

**Stage 1: Role Selector UI (1hr)**
```javascript
// Add dropdown to observer panel
<select id="observer-watch-role" onchange="switchObserverView(this.value)">
  <option value="pilot">Pilot (default)</option>
  <option value="astrogator">Astrogator</option>
  <option value="engineer">Engineer</option>
  <option value="sensors">Sensor Operator</option>
  <option value="captain">Captain</option>
</select>
```

**Stage 2: Safe Panel Rendering (2hr)**
```javascript
function getObserverPanel(...) {
  const watchRole = state.observerWatchRole || 'pilot';
  try {
    // Get watched role's panel but strip actions
    const rolePanel = getRolePanelSafe(watchRole, ...);
    return wrapAsReadOnly(rolePanel);
  } catch (e) {
    // Fallback to basic observer view
    return getBasicObserverPanel(...);
  }
}
```

**Stage 3: Strip Actions from Watched Panel (1hr)**
- Remove all buttons/controls from watched panel
- Add "Observing [Role]" header
- Gray out interactive elements

### Risk Mitigation
- Wrap all role panel calls in try/catch
- Fallback to basic view on any error
- Test with each role individually
- Test with invalid/unknown roles

---

## AR-129: Pilot Navigation Panel Overhaul (HIGH PRIORITY)

**Source:** User TODO - "Replace Navigation panel with Shared System Map"
**Risk:** HIGH → must not break shared map, modular extension required

### Current Issues
- State bifurcation: `state.ship.current_state` vs `state.shipState`
- `window.getShipState()` may return wrong object
- No embedded system map in pilot panel
- Bottom bar button loads wrong thing

### Requirements
1. Pilot map INHERITS from shared system map (no bifurcation)
2. Modular extension - protect against shared map changes
3. Fix bottom bar bug
4. Add pilot-specific controls to lower bar

### Implementation Plan

**Stage 1: Find and Fix Bottom Bar Bug (1hr)**
- Locate the button that "loads wrong thing from wrong place"
- Trace call path and fix

**Stage 2: Create Pilot Map Wrapper (2hr)**
```javascript
// public/operations/modules/pilot-map.js
class PilotMapExtension {
  constructor(sharedMapInstance) {
    this.baseMap = sharedMapInstance;
  }

  // Override only pilot-specific behaviors
  handleSetCourse(destination) { ... }
  showPilotControls() { ... }

  // Delegate everything else to base
  render() { return this.baseMap.render(); }
}
```

**Stage 3: Embed in Pilot Panel (2hr)**
- Replace current Navigation section with full system map
- Add controls bar at bottom
- Wire pilot-specific actions

**Stage 4: Fix State Bifurcation (1hr)**
- Ensure `window.getShipState()` returns canonical state
- Remove duplicate state updates
- Single source of truth for positionVerified

### Risk Mitigation
- Create pilot-map.js as separate module
- Never modify system-map.js directly for pilot features
- Test shared map still works after changes
- Test pilot map after shared map updates

### UQs for User
1. What controls should be on pilot's bottom bar?
2. Should pilot have zoom/pan or just destination selection?

---

## AR-130: NPC Personae Collection (MEDIUM PRIORITY)

**Source:** User TODO - "Build collection of NPC personae"
**Risk:** MEDIUM → requires Claude API integration

### Requirements
- Each NPC has: personality, goals, situation, wealth, PC connections, location, mail delay
- NPCs can send/receive email to PCs
- NPCs remember conversation context
- Claude API plays NPC personalities
- System stores email conversations

### Implementation Plan

**Stage 1: NPC Schema & Database (2hr)**
```sql
CREATE TABLE npc_personae (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  personality TEXT,
  goals TEXT,
  situation TEXT,
  wealth TEXT,
  location TEXT,
  mail_delay_weeks INTEGER DEFAULT 1,
  system_prompt TEXT,  -- For Claude API
  created_at TEXT
);

CREATE TABLE npc_pc_connections (
  npc_id TEXT,
  pc_id TEXT,
  relationship TEXT,
  notes TEXT
);
```

**Stage 2: Email System Extension (3hr)**
- Add NPC as valid email recipient
- Store conversation history per NPC-PC pair
- Track mail delay for delivery timing

**Stage 3: Claude API Integration (4hr)**
- Load NPC personality as system prompt
- Include conversation history in context
- Generate NPC response
- Queue response with mail delay

**Stage 4: Conversation Memory (2hr)**
- Store full conversation per NPC
- Truncate old messages but keep summary
- (Future TODO: AI summarization of long chains)

### Risk Mitigation
- Test with mock Claude responses first
- Graceful fallback if API unavailable
- Rate limit API calls
- Cache NPC responses

### Dependencies
- Claude API must be configured
- Email system must be working

---

## AR-131: Captain Solo Mode (MEDIUM PRIORITY)

**Source:** User TODO - "Captain can command all roles from captain console"
**Risk:** MEDIUM → complex UI, many integrations

### Requirements
- Captain can operate ship alone (1-player mode)
- Simplified controls for each role's critical functions
- Skill defaults: Captain direct = 0, Filled role = 1, Skilled crew = actual skill
- Use case: Jump → Verify → Fly to fuel → Refuel → Refine → Fly to jump → Jump out

### Critical Actions to Expose

| Role | Action | Captain Command |
|------|--------|-----------------|
| Astrogator | Plot Jump | "Plot Jump to [hex]" |
| Astrogator | Verify Position | "Verify Position" |
| Pilot | Set Course | "Fly to [destination]" |
| Engineer | Refuel | "Refuel from [source]" |
| Engineer | Process Fuel | "Refine Fuel" |

### Implementation Plan

**Stage 1: Captain Command Panel UI (3hr)**
```html
<div class="captain-command-panel">
  <h4>Ship Operations</h4>
  <div class="command-group">
    <label>Navigation</label>
    <button onclick="captainCommand('plotJump')">Plot Jump</button>
    <button onclick="captainCommand('verifyPosition')">Verify Position</button>
  </div>
  <div class="command-group">
    <label>Helm</label>
    <select id="captain-destination">...</select>
    <button onclick="captainCommand('flyTo')">Fly To</button>
  </div>
  <div class="command-group">
    <label>Engineering</label>
    <button onclick="captainCommand('refuel')">Refuel</button>
    <button onclick="captainCommand('refineFuel')">Refine Fuel</button>
  </div>
</div>
```

**Stage 2: Skill Calculation System (2hr)**
```javascript
function getEffectiveSkill(role, action) {
  const crewMember = getCrewInRole(role);
  if (!crewMember) return 0;  // Captain direct, no crew
  if (crewMember.skill > 0) return crewMember.skill;
  return 1;  // Default for filled position
}
```

**Stage 3: Command Execution (3hr)**
- Each command calls existing role socket events
- Pass `{ actor: 'captain', skill: effectiveSkill }`
- Log shows "Captain orders [action]"

**Stage 4: Solo Play Journey Test (2hr)**
- E2E test: Captain-only completes multi-jump journey
- Verify all commands work from captain panel

### Risk Mitigation
- Reuse existing role handlers (don't duplicate logic)
- Test each command individually
- Test full journey flow
- Verify skill calculations

### UQs for User
1. Should captain see condensed versions of other role panels, or just command buttons?
2. Should commands show confirmation dialogs?
3. Should there be a "recommended action" hint system?

---

## Priority Order

| AR | Title | Priority | Risk | Est. Hours |
|----|-------|----------|------|------------|
| AR-127 | Sensor Display Fix | HIGH | HIGH | 4 |
| AR-129 | Pilot Navigation | HIGH | HIGH | 6 |
| AR-128 | Observer Enhancement | MEDIUM | MEDIUM | 4 |
| AR-131 | Captain Solo Mode | MEDIUM | MEDIUM | 10 |
| AR-130 | NPC Personae | MEDIUM | MEDIUM | 11 |

**Recommended Order:**
1. AR-127 (fixes broken features)
2. AR-129 (core pilot improvement)
3. AR-128 (observer safety)
4. AR-131 (captain enhancement)
5. AR-130 (NPC system - depends on email)

---

## UQs Summary

### AR-127 (Sensors)
1. Should filter/sort persist across page refresh?
2. Should ECM affect ALL contacts or only selected target?

### AR-129 (Pilot)
1. What controls should be on pilot's bottom bar?
2. Should pilot have zoom/pan or just destination selection?

### AR-131 (Captain)
1. Condensed role panels or just command buttons?
2. Confirmation dialogs for commands?
3. Recommended action hints?

---

## AR-146: Remove Archaic district268.json (LOW)

**Source:** User TODO - "district268.json is an archaic relic, should not exist"

**Description:** Move functionality from district268.json to proper places and delete the file. It's a legacy file from when the app started.

**Steps:**
1. Identify what uses district268.json directly
2. Move data to proper subsector files (spinward-marches-o.json is District 268 proper)
3. Update any hardcoded references
4. Delete district268.json
5. Update DEFAULT_SUBSECTOR_FILE to a valid subsector

**Scope:** 1hr, LOW risk

---

## AR-142: Server Startup - Multistage Test Commands (LOW)

**Source:** User TODO - "modify the Server Startup text to add npm commands to run multistage use case tests"

**Description:** Add npm commands for running multistage use case tests to the server startup message, displayed after the Features section.

**Location:** `server.js:434` (after Features list, before Instructions)

**Implementation:**
```javascript
log.info('');
log.info('Test Commands:');
log.info('- npm run test:fast       # Smoke tests (~0.6s)');
log.info('- npm run test            # Full suite (~3s)');
log.info('- npm run test:e2e <file> # E2E with cleanup');
log.info('- node tests/ar-137-captain-journey.test.js  # Journey test');
log.info('- node tests/ar-140-modules.test.js          # Module test');
```

**Scope:** 15min, LOW risk
