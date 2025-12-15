# AR Overnight Run Plan (2025-12-15)

## UQ Answers Incorporated

| AR | UQ Question | Answer |
|----|-------------|--------|
| AR-127 | ECM scope | Targeted only (not all contacts) |
| AR-127 | Filter persist | localStorage |
| AR-128 | Observer buttons | Hide completely (not gray out) |
| AR-129 | Frame bug | Loads into wrong container |
| AR-130 | NPC storage | Database table |
| AR-130 | Email limit | 5000 chars |
| AR-131 | Log entries | Both (action + result) |
| AR-131 | Override anyone | Yes, captain can override any role |
| AR-131 | Response length | NPC personality decides |
| AR-133 | Map views | Both (iso + top-down toggle) |
| AR-133 | Body display | Icons/symbols |
| AR-134 | Validation | Full validation |
| AR-135 | Bump notification | Toast to bumped player |
| AR-125 | Tooltip trigger | Hover + click to pin |

---

## Execution Order (Risk-Sorted)

### Phase 1: Bug Fixes (LOW RISK)

**AR-132: PC Disappears** ✓ COMPLETE
- Added `ops:releaseSlot` handler and emits

**AR-127: Sensor Display Fix**
- Risk: LOW (after UQ clarification)
- Fix socket mismatches: `ops:sensorLock` → `ops:setSensorLock`
- Remove duplicate ECM section (lines 1318-1341)
- ECM targets selected contact only
- Filter/sort persist to localStorage

**AR-129: Pilot Navigation Frame**
- Risk: LOW (isolated fix)
- Find frame container bug
- Ensure pilot map loads into correct container
- Wire to shared system map

### Phase 2: Enhancements (MEDIUM RISK)

**AR-128: Observer Role**
- Risk: LOW (after UQ)
- Add role selector dropdown
- Call existing role panels, strip buttons (hide, not gray)
- Wrap in try/catch with fallback

**AR-133: Pilot Map Views**
- Risk: LOW (additive)
- Add toggle button: iso ↔ top-down
- Top-down uses icons/symbols for bodies
- Save preference to localStorage

**AR-135: Role Replacement**
- Risk: MEDIUM (state management)
- Player can take any role from another player
- Bumped player becomes Observer
- Toast notification to bumped player
- Socket event: `ops:roleReplaced`

### Phase 3: New Features (MEDIUM-HIGH RISK)

**AR-131: Captain Solo Mode**
- Risk: MEDIUM (many integrations)
- Action buttons only (not condensed panels)
- Captain can override any filled role
- Log both action attempt and result
- Skill defaults: 0 direct, 1 filled, actual if skilled

**AR-134: Data Integrity Tests**
- Risk: LOW (tests only)
- Full validation suite
- Run via `npm run test:integrity`
- Validate all database relationships

**AR-130: NPC Personae**
- Risk: HIGH (new system + Claude API)
- Database table for NPCs
- 5000 char email limit
- Response length per personality
- GM-gated API calls

### Phase 4: Scenario Features (DEFERRED)

**AR-125: Pirate Scenario**
- Log tooltips: hover shows preview, click pins popup
- Ship-to-ship comms in log
- Cargo manifest CRUD
- Defer: Q-ship reveal, trade mechanics

---

## Implementation Details

### AR-127 Socket Fixes

```javascript
// Client changes needed:
// OLD: socket.emit('ops:sensorLock', { contactId, locked: true })
// NEW: socket.emit('ops:setSensorLock', { contactId, locked: true })

// OLD: socket.emit('ops:setECM', { enabled: true })
// NEW: socket.emit('ops:setEW', { type: 'ecm', enabled: true, targetId: selectedContactId })

// Filter/sort persistence:
localStorage.setItem('sensorFilter', filterValue);
localStorage.setItem('sensorSort', sortValue);
```

### AR-128 Observer Panel

```javascript
function getObserverPanel(state, ship, shipState) {
  const watchRole = state.observerWatchRole || 'pilot';
  try {
    const panel = getRolePanel(watchRole, state, ship, shipState);
    return stripButtons(panel); // Hide all buttons, not gray
  } catch (e) {
    return getBasicObserverPanel(state, ship, shipState);
  }
}

function stripButtons(html) {
  // Remove all <button> elements entirely
  return html.replace(/<button[^>]*>.*?<\/button>/gs, '');
}
```

### AR-135 Role Replacement

```javascript
// Server handler
socket.on('ops:claimRole', ({ role, shipId }) => {
  const currentHolder = findRoleHolder(shipId, role);
  if (currentHolder && currentHolder.socketId !== socket.id) {
    // Bump to observer
    io.to(currentHolder.socketId).emit('ops:roleBumped', {
      oldRole: role,
      newRole: 'observer',
      message: `${opsSession.slotName} claimed ${role} role`
    });
    setPlayerRole(currentHolder.accountId, 'observer');
  }
  setPlayerRole(opsSession.accountId, role);
  broadcastCrewUpdate(shipId);
});
```

### AR-131 Captain Commands

```javascript
const CAPTAIN_COMMANDS = {
  plotJump: { role: 'astrogator', skill: 'Astrogation', event: 'ops:plotJump' },
  verifyPosition: { role: 'astrogator', skill: 'Electronics(Sensors)', event: 'ops:verifyPosition' },
  setCourse: { role: 'pilot', skill: 'Pilot', event: 'ops:setCourse' },
  refuel: { role: 'engineer', skill: 'Engineer', event: 'ops:startRefueling' },
  refineFuel: { role: 'engineer', skill: 'Engineer', event: 'ops:processUnrefinedFuel' }
};

function captainCommand(cmd) {
  const def = CAPTAIN_COMMANDS[cmd];
  const skill = getEffectiveSkill(def.role, def.skill);

  // Log attempt
  addLogEntry(`Captain orders: ${cmd}`);

  // Execute via existing handler
  socket.emit(def.event, { ...params, skill, actor: 'captain' });

  // Result logged by handler
}
```

### AR-130 NPC Schema

```sql
CREATE TABLE npc_personae (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  personality TEXT,
  goals TEXT,
  situation TEXT,
  wealth TEXT,
  location TEXT,
  mail_delay_weeks INTEGER DEFAULT 1,
  system_prompt TEXT,
  created_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE npc_emails (
  id TEXT PRIMARY KEY,
  npc_id TEXT NOT NULL,
  player_account_id TEXT,
  direction TEXT CHECK(direction IN ('to_npc', 'from_npc')),
  subject TEXT,
  body TEXT CHECK(length(body) <= 5000),
  game_date TEXT,
  delivered INTEGER DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (npc_id) REFERENCES npc_personae(id)
);
```

---

## Test Requirements Per AR

| AR | Test Type | Count |
|----|-----------|-------|
| AR-127 | Socket event | 4 |
| AR-128 | Panel render | 6 (each role) |
| AR-129 | Container load | 2 |
| AR-130 | DB CRUD | 5 |
| AR-131 | Command exec | 5 |
| AR-133 | View toggle | 2 |
| AR-134 | Integrity | 10+ |
| AR-135 | Role bump | 3 |

---

## Risk Mitigation Summary

| AR | Original Risk | Mitigated Risk | Mitigation |
|----|---------------|----------------|------------|
| AR-127 | HIGH | LOW | UQs answered, socket mapping clear |
| AR-128 | MEDIUM | LOW | UQ: hide buttons, try/catch fallback |
| AR-129 | HIGH | LOW | Isolated frame fix |
| AR-130 | HIGH | MEDIUM | Schema defined, limits set |
| AR-131 | MEDIUM | MEDIUM | Reuse existing handlers |
| AR-133 | LOW | LOW | Additive feature |
| AR-134 | LOW | LOW | Tests only |
| AR-135 | MEDIUM | LOW | UQ: toast notification |

---

## Overnight Run Command

```bash
# Execute in order, stop on first failure
npm run cleanup:all

# Phase 1
# AR-127, AR-129

# Phase 2
# AR-128, AR-133, AR-135

# Phase 3
# AR-131, AR-134, AR-130

npm test
npm run test:smoke
```

---

## Status: READY FOR OVERNIGHT RUN

All UQs collected. Risk mitigated to LOW/MEDIUM for all ARs.
Execute phases 1-2 first (bug fixes + enhancements).
Phase 3 (new features) if time permits.
