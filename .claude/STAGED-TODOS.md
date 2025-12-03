# Staged TODOs for Operations VTT

**Created:** 2025-11-30
**Last Updated:** 2025-12-02

---

## Known Bugs (AUTORUN-13 Stage 13.1)

| Bug | Description | Severity | Status |
|-----|-------------|----------|--------|
| GM as Crew | GM appears in crew list with relieve button | HIGH | AUTORUN-13 |
| Captain Conflict | "Role captain already taken" error on reconnect | HIGH | AUTORUN-13 |
| Relieve UI Missing | Relieve button not showing for some crew | MEDIUM | AUTORUN-13 |

Screenshots: `screenshots/Bug_GM_shows_as_crew*.png`, `screenshots/relieve_of_duty*.png`

---

## Stage 2: Combat Handler Extraction (MVC Phase 2)
**Risk:** MEDIUM | **Time:** 2-3 hours | **Priority:** HIGH
**Status:** AUTORUN-13 (Stage 13.2)

### Tasks:
1. Create `lib/combat/ai.js` - Extract AI decision logic
2. Create `lib/combat/state.js` - Combat state management
3. Extract combat handlers incrementally from server.js
4. Target: server.js under 500 LOC

### Dependencies:
- Stage 1 complete (operations handlers extracted) ✅

---

## Stage 3: Bridge View Polish
**Risk:** LOW | **Time:** 1-2 hours | **Priority:** MEDIUM
**Autorun:** AUTORUN-OPS-2.md (combined with Stage 4)

### Tasks:
1. Role detail panel content (pilot, engineer, gunner views)
2. Time system UI with GM advance controls
3. Guest login UI completion
4. Multiple identical roles support (2+ gunners)

### Dependencies:
- Stage 1 complete ✅

---

## Stage 4: Sensor & Contact System
**Risk:** MEDIUM | **Time:** 2-3 hours | **Priority:** MEDIUM
**Autorun:** AUTORUN-OPS-2.md (combined with Stage 3)

### Tasks:
1. Contact data model in database
2. GM contact management tools
3. Sensor display with range bands
4. Fog of war (sensor-based visibility)

### Dependencies:
- Stage 3 bridge view (same autorun)

---

## Stage 5: Combat Integration
**Risk:** HIGH | **Time:** 3-4 hours | **Priority:** MEDIUM
**Autorun:** Not yet created - needs risk mitigation plan

### Tasks:
1. Combat mode transition from bridge
2. Contact-to-combatant conversion
3. Role-to-station mapping
4. Shared combat state sync
5. Exit combat with state persistence

### Risk Mitigation Needed:
- State sync strategy between ops DB and combat memory
- Multi-player action sequencing
- Preserve solo mode functionality
- Consider: view-only first, actions later

---

## Stage 6: Ship Systems & Damage
**Risk:** MEDIUM | **Time:** 2-3 hours | **Priority:** LOW
**Autorun:** Not yet created - needs risk mitigation plan

### Tasks:
1. System data model per ship
2. Critical hit → system damage
3. Engineer repair actions
4. System status display

### Risk Mitigation Needed:
- Balance repair times vs combat pace
- Define system dependency tree
- Test with existing critical hit system

---

## Stage 7: Time & Jump Travel
**Risk:** LOW | **Time:** 1-2 hours | **Priority:** LOW
**Autorun:** Can be standalone or combined

### Tasks:
1. Imperial calendar (Year-Day format)
2. Jump initiation and fuel consumption
3. In-jump state (168 hours)
4. Jump exit and location update

---

## Stage 8: NPC Crew Actions
**Risk:** MEDIUM | **Time:** 2-3 hours | **Priority:** LOW
**Autorun:** Not yet created - needs risk mitigation plan

### Tasks:
1. NPC skill definitions
2. Automatic NPC actions in combat
3. GM override controls
4. Crew casualties and hiring

### Risk Mitigation Needed:
- NPC AI decision tree (keep simple)
- Balance: NPCs < players in effectiveness
- Test NPC actions don't break combat flow

---

## Stage 9: Character Import System
**Risk:** MEDIUM | **Time:** 3-4 hours | **Priority:** MEDIUM
**Autorun:** Not yet created

### Problem Statement:
Everyone stores Traveller characters slightly differently - no 100% standard format exists.
Need to support both precise imports and "best effort" fuzzy imports.

### Tasks:
1. Define canonical JSON character schema for VTT
2. Precise JSON import (direct mapping when format matches)
3. AI-assisted best-effort import:
   - Parse various text/JSON formats
   - Extract stats (STR, DEX, END, INT, EDU, SOC)
   - Extract skills with levels
   - Handle UPP notation (e.g., "777777")
   - Extract equipment, credits, etc.
   - Flag uncertain fields for user review
4. Character export (to canonical JSON)
5. Clipboard paste import (for quick entry)

### Supported Import Sources (Target):
- Traveller Character Generator outputs
- PDF copy-paste text
- Roll20 character sheet exports
- Foundry VTT exports
- Plain text "UPP + skills" format
- Custom JSON from other tools

### Risk Mitigation:
- AI parsing should be optional (user can skip to manual entry)
- Show preview before committing import
- Allow field-by-field correction
- Log parsing decisions for debugging

---

## Cleanup TODOs (Any Stage)

### Delete After MVC Stable:
- `tests/operations-handlers.test.js` (safety net for refactor)

### Files to Delete (bugs fixed):
- ~~`.claude/TODO-solo-mode-escape.md`~~ (DELETED - Autorun 4)
- ~~`.claude/TODO-solo-ai-not-attacking.md`~~ (DELETED - Autorun 4)
- ~~`.claude/TODO-solo-missile-freeze.md`~~ (DELETED - Autorun 4)

---

## UI/UX Enhancements (2025-12-02)

### TODO 1: Bridge View Title
**Risk:** LOW | **Time:** 15 min | **Priority:** LOW

Add "Bridge View" title top center, just to the right of the alert indicator.

---

### TODO 2: Expandable Role Panels
**Risk:** MEDIUM | **Time:** 2-3 hours | **Priority:** HIGH
**Status:** AUTORUN-13 (Stage 13.3)

Crew role panels need expansion options for data-heavy roles:
- **Problem:** Role panel often too small. Astrogator plotting Jump-6 needs large map display.
- **Solution:**
  1. **Claim Sensor Display** - Role panel expands into sensor area (half-screen)
  2. **Full Screen** - Role panel takes entire viewport

**Affected Roles:**
- Astrogator (jump maps) - PRIMARY
- Sensors (contact analysis)
- Captain (tactical overview)
- Engineer (system diagnostics)
- Medic (medical records)

**Implementation:**
1. Add expand/collapse button to role panel header
2. CSS for expanded states (full-screen, half-screen)
3. Keyboard shortcut (Escape to collapse, F for fullscreen)
4. Remember expansion state per role

---

### TODO 3: Full-Screen Email App
**Risk:** LOW | **Time:** 2-3 hours | **Priority:** HIGH
**Status:** AUTORUN-13 (Stage 13.4)

Email popups don't persist. Should be a full-screen app experience.

**Current Problem:**
- Email appears as popup/modal
- Closes on interaction
- Feels like notification, not app

**Solution:**
- Full-screen email client UI
- Inbox list on left, message view on right
- Persists until user explicitly closes
- Read/unread status indicators
- Compose new message (to GM or crew)

**Implementation:**
1. Create full-screen email container (new app layer)
2. Inbox list with read/unread indicators
3. Message view pane
4. Close with X button or Escape key
5. Mark messages as read on view

---

### TODO 4: Shared Traveller Map View
**Risk:** MEDIUM | **Time:** 3-4 hours | **Priority:** HIGH
**Status:** Moved to AR-14 (Stage 14.4)

GM-controlled shared map display for all players.

---

### TODO 5: Add All Known Ships to Library
**Risk:** LOW | **Time:** 20-40 hours | **Priority:** LOW
**Status:** Future (ask before starting)

Add ALL known Traveller ships to `data/ships/`:
- Core Rulebook ships (complete set)
- High Guard ships
- Small craft (launches, pinnaces, cutters, shuttles)
- Fighters (light, medium, heavy)
- Special cases (system defense boats, etc.)

**Note:** This is a HUGE task. Ask before starting.

---

### TODO 6: Comprehensive Crew Role Tests
**Risk:** MEDIUM | **Time:** 8-12 hours | **Priority:** MEDIUM
**Dependency:** AR-13 Stage 13.3 (Expandable Role Panels)

Complete Puppeteer test suite for all 11 crew roles:
- Test every role's panel UI
- Test role-specific actions
- Test role interactions
- Regression tests for role bugs

**Goal:** Very detailed crew role actions that make gameplay fun.

---

### TODO 7: Ship Builder System
**Risk:** HIGH | **Time:** 56-81 hours | **Priority:** LOW
**Status:** AR-14 scope (Stages 14.1-14.3)
**Reference:** `.claude/TODO-ship-builder-system.md`

Full CRUD ship customization with High Guard rules:
- Ship list management
- Component picker UI
- Rules validation
- Import/Export

**Test Case:** Gorram (600-ton X-Carrier) - `data/ships/gorram.json`
