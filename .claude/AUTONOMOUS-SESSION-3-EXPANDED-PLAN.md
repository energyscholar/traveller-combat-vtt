# Autonomous Session 3 - MAXIMUM VELOCITY PLAN

**Created:** 2025-11-13
**Status:** EXPANDED SCOPE - Forward-Looking
**Philosophy:** Pull forward ALL safe, dependency-free work from future stages
**Estimated Duration:** 18-25 hours total

---

## 🚀 VELOCITY STRATEGY

**Goal:** Build as much SAFE work as possible, even from future stages
**Approach:** Identify work with zero dependencies and zero UI requirements
**Justification:** High confidence in Claude's implementation = aggressive forward-building

---

## 📋 EXPANDED WORK STREAMS

### 1. SMALL CRAFT TEMPLATES (Priority: HIGH, Safe: YES) ⭐

**From:** Current stage requirements
**Dependencies:** NONE (uses existing validation)

**Templates to Create:**
1. **Pinnace** (40t, multipurpose shuttle)
2. **Gig** (20t, light shuttle)
3. **Tlatl Missile Fighter** (10t, military fighter)
4. **BONUS:** Air/Raft, Cutter, Ship's Boat (if time permits)

**Tasks:**
- [ ] Extract specifications from High Guard 2022
- [ ] Create V2 JSON templates (data/ships/v2/small_craft/)
- [ ] Full validation with validateCompleteShip()
- [ ] Add to ship-templates.html viewer
- [ ] Update test-ship-templates.js
- [ ] Document in EXTRACTED-SHIP-DATA.md

**Estimated Time:** 4-6 hours (3 required + 3 bonus)

---

### 2. COMPLETE HIGH GUARD REFERENCE DATA (Priority: HIGH, Safe: YES) ⭐⭐

**From:** Deferred extraction work (spread across stages)
**Dependencies:** NONE (pure reference data)

**Goal:** Complete extraction of ALL tables from High Guard 2022

**Missing Tables to Extract:**

#### A. Weapons (Complete Table)
- [ ] **Turret Weapons:** Full table with TL, tonnage, cost, power, damage, traits
- [ ] **Bay Weapons:** 50t+ weapons (for capital ships)
- [ ] **Screens:** Meson screens, nuclear dampers
- [ ] **Point Defense:** Sandcasters, beam laser batteries
- [ ] **Missiles:** Types, guidance systems, warheads

#### B. Electronics & Sensors
- [ ] **Computer Ratings:** Complete 1-50 table with costs
- [ ] **Sensor Grades:** All grades with DMs, range, cost
- [ ] **Countermeasures:** ECM, ECCM, stealth systems
- [ ] **Software Packages:** All software with ratings, costs, TL

#### C. Accommodations & Facilities
- [ ] **Cabin Types:** Standard, luxury, low berth, emergency
- [ ] **Common Areas:** Galleys, lounges, recreation
- [ ] **Specialized:** Medical bays, laboratories, workshops (already done)
- [ ] **Barracks & Armories:** (already done)

#### D. Power & Propulsion Variants
- [ ] **Power Plant Types:** Fusion (all TLs), Fission, Solar, Batteries
- [ ] **Alternative Drives:** Solar sails, gravitic compensators
- [ ] **Fuel Options:** Hydrogen, refined, unrefined, drop tanks

#### E. Hull Options
- [ ] **Hull Configurations:** All types with multipliers
- [ ] **Armor Materials:** All types with formulas (expand existing)
- [ ] **Hull Options:** Reinforced, distributed, reflec coating

**Output File:** `.claude/HIGH-GUARD-COMPLETE-REFERENCE.md`

**Estimated Time:** 3-4 hours

**Success Criteria:**
- ✅ Every table from High Guard extracted
- ✅ All formulas documented
- ✅ All costs verified
- ✅ TL requirements listed
- ✅ Cross-referenced with existing EXTRACTED-SHIP-DATA.md

---

### 3. JSON EXPORT/IMPORT SCHEMAS (Priority: MEDIUM, Safe: YES) ⭐

**From:** Stage 14 (API Integration & VTT Interoperability)
**Dependencies:** NONE (data structures only, no implementation)

**Goal:** Define JSON schemas for data portability (future-proof)

**Schemas to Create:**

#### A. Ship Export Schema
```javascript
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Traveller Ship Export v1",
  "type": "object",
  "properties": {
    "version": "1.0.0",
    "ship": { /* V2 template structure */ },
    "customizations": { /* modifications from template */ },
    "metadata": { "created", "modified", "author", "notes" }
  }
}
```

#### B. Battle State Export Schema
```javascript
{
  "version": "1.0.0",
  "battle": {
    "id": "string",
    "turn": "number",
    "phase": "string",
    "ships": [ /* combat state snapshots */ ]
  },
  "history": [ /* turn-by-turn log */ ]
}
```

#### C. Character/Crew Export Schema
```javascript
{
  "version": "1.0.0",
  "character": {
    "name": "string",
    "stats": { /* UPP */ },
    "skills": { /* skill: level */ },
    "role": "string"
  }
}
```

**Tasks:**
- [ ] Create JSON schemas (data/schemas/)
- [ ] Write schema validation utilities (lib/schemas.js)
- [ ] Add schema tests (tests/schemas.test.js)
- [ ] Document schemas (.claude/JSON-SCHEMAS.md)
- [ ] NO implementation (just structure)

**Estimated Time:** 2-3 hours

---

### 4. DETAIL LEVEL FORMATTERS (Priority: MEDIUM, Safe: YES) ⭐

**From:** Stage 12 (Ship Builder)
**Dependencies:** NONE (pure data transformation, no UI)

**Goal:** Create formatters for Simple/Standard/Technical detail levels

**Pure Functions to Create:**

#### File: `lib/ship-formatters.js`

```javascript
/**
 * Format ship data for different detail levels
 * Pure functions, no DOM manipulation
 */

// Simple: High-level overview (layperson)
function formatShipSimple(template) {
  return {
    jumpRange: `${template.drives.jump.rating} parsecs`,
    thrust: `${template.drives.manoeuvre.thrust}G`,
    cost: formatCurrency(template.costs.base),
    crew: formatCrew(template.crew),
    cargo: `${template.cargo.tonnage}t`,
    weapons: formatWeaponsSimple(template.weapons),
    special: extractSpecialFeatures(template)
  };
}

// Standard: Component breakdown (gamers)
function formatShipStandard(template) {
  return {
    propulsion: formatPropulsionStandard(template),
    hull: formatHullStandard(template),
    accommodations: formatAccommodationsStandard(template),
    weapons: formatWeaponsStandard(template),
    validation: formatValidationStandard(template)
  };
}

// Technical: Full specifications (engineers)
function formatShipTechnical(template) {
  return {
    /* Every detail, formulas shown, TL requirements */
    /* Power calculations broken down */
    /* Tonnage allocation table */
    /* Cost breakdown by component */
  };
}
```

**Tasks:**
- [ ] Create lib/ship-formatters.js
- [ ] Implement all three formatters
- [ ] Pure functions (input → output, no side effects)
- [ ] Add unit tests (tests/ship-formatters.test.js)
- [ ] Document usage (.claude/SHIP-FORMATTERS.md)

**Estimated Time:** 3-4 hours

**Success Criteria:**
- ✅ 3 formatters implemented
- ✅ All pure functions (testable)
- ✅ 20+ tests covering all formatters
- ✅ Works with all 7 ship templates
- ✅ Ready to plug into UI later

---

### 5. SHIP COMPARISON UTILITIES (Priority: LOW, Safe: YES)

**From:** Stage 12/16 (Ship Builder / Advanced Features)
**Dependencies:** NONE (pure data operations)

**Goal:** Compare ships side-by-side (data only, no UI)

**File:** `lib/ship-comparison.js`

```javascript
// Compare two ships, return differences
function compareShips(ship1, ship2) {
  return {
    tonnage: { ship1: 100, ship2: 200, diff: +100 },
    jump: { ship1: 2, ship2: 1, diff: -1 },
    thrust: { ship1: 2, ship2: 1, diff: -1 },
    cost: { ship1: 36900000, ship2: 37100000, diff: +200000 },
    // ... all comparable fields
  };
}

// Rank ships by criteria
function rankShips(ships, criteria) {
  // criteria: 'speed', 'firepower', 'cost', 'cargo', etc.
  return ships.sort((a, b) => /* ranking logic */);
}

// Find ships matching criteria
function filterShips(ships, filters) {
  // filters: { minJump: 2, maxCost: 50000000, role: 'military' }
  return ships.filter(/* filter logic */);
}
```

**Tasks:**
- [ ] Create lib/ship-comparison.js
- [ ] Implement comparison functions
- [ ] Add tests (tests/ship-comparison.test.js)

**Estimated Time:** 1-2 hours

---

### 6. RULES VERIFICATION SWEEP (Priority: HIGH, Safe: MIXED) ⭐⭐⭐

**From:** User request (current)
**Dependencies:** Existing codebase

**Focus Areas:**

#### A. Initiative & Phase Rules (User Priority)
- [ ] Review High Guard p.XX initiative rules
- [ ] Verify 2D6 + Pilot + Thrust implementation
- [ ] Check Tactics roll bonus logic
- [ ] Verify turn order sorting
- [ ] Check initiative tie handling
- [ ] **FIX EASY:** Obvious corrections
- [ ] **FIX MEDIUM:** Safe improvements
- [ ] **DEFER HARD:** Document for later

#### B. Ship Combat Mechanics
- [ ] Attack resolution (to-hit calculation)
- [ ] Damage application (armor reduction)
- [ ] Range band modifiers (DMs)
- [ ] Weapon characteristics verification
- [ ] Critical hit thresholds (25/50/75% correct?)

#### C. Component Validation
- [ ] Drive formulas (jump, maneuver)
- [ ] Power plant calculations
- [ ] Fuel requirements
- [ ] Armor tonnage formulas
- [ ] Cost calculations (all verified)

**Deliverable:** `.claude/RULES-VERIFICATION-REPORT.md`

**Estimated Time:** 5-8 hours

---

### 7. TEST COVERAGE EXPANSION (Priority: MEDIUM, Safe: YES)

**From:** Current (test debt)

**New Test Files:**

#### A. `tests/ship-templates.test.js` (20+ tests)
- loadTemplates() success/failure/partial
- getStatusClass() power validation
- calculateTonnageUsed() all components
- renderTable() safe property access
- renderTemplateDetails() null handling

#### B. `tests/ship-formatters.test.js` (15+ tests)
- Simple formatter output
- Standard formatter output
- Technical formatter output
- Edge cases (missing data)

#### C. `tests/ship-comparison.test.js` (10+ tests)
- Compare two ships
- Rank by criteria
- Filter by criteria

#### D. `tests/schemas.test.js` (15+ tests)
- Schema validation
- Invalid data rejection
- Version compatibility

**Estimated Time:** 3-4 hours

---

### 8. EDGE CASE SWEEP (Priority: MEDIUM, Safe: YES)

**From:** Current (defensive coding)

**Scenarios to Cover:**
- [ ] Malformed JSON templates
- [ ] Server 404/500 errors
- [ ] Missing required fields
- [ ] Null nested properties
- [ ] Empty arrays
- [ ] Type mismatches (string numbers)
- [ ] Missing powerRequirements
- [ ] Components with no tonnage

**Deliverable:** `.claude/EDGE-CASES-COMPREHENSIVE.md`

**Estimated Time:** 2 hours

---

### 9. REFACTORING OPPORTUNITIES DOCUMENT (Priority: LOW, Safe: YES)

**From:** Stage 13 prep

**Document only, no implementation:**
- [ ] Code duplication analysis
- [ ] Magic numbers audit
- [ ] Helper function opportunities
- [ ] Module split candidates

**Deliverable:** `.claude/REFACTORING-OPPORTUNITIES.md`

**Estimated Time:** 1 hour

---

### 10. WEAPON & ARMOR VALIDATION MODULES (Priority: MEDIUM, Safe: YES) ⭐

**From:** Ship builder prerequisites
**Dependencies:** NONE (extends existing lib/ship-*.js pattern)

**Goal:** Complete weapon and armor validation modules

**Files to Create:**

#### A. `lib/ship-weapons-complete.js`
- Validate all turret weapons (not just basic)
- Bay weapons validation (50t+)
- Missile types and variants
- Point defense systems
- Screens (meson, nuclear)

#### B. `lib/ship-armor-complete.js`
- All armor types (not just Crystaliron/Titanium)
- Bonded superdense
- Molecular bonded
- Reflec coating
- Armor by TL table

**Tasks:**
- [ ] Create complete weapon validation
- [ ] Create complete armor validation
- [ ] Add to lib/index.js exports
- [ ] Add comprehensive tests
- [ ] Document in DEVELOPER-GUIDE

**Estimated Time:** 3-4 hours

---

## ⏱️ EXPANDED TIME BREAKDOWN

| Work Stream | Min | Max | Priority |
|-------------|-----|-----|----------|
| 1. Small craft (3 + bonus) | 4h | 6h | HIGH ⭐ |
| 2. Complete HG tables | 3h | 4h | HIGH ⭐⭐ |
| 3. JSON schemas | 2h | 3h | MEDIUM ⭐ |
| 4. Detail formatters | 3h | 4h | MEDIUM ⭐ |
| 5. Ship comparison | 1h | 2h | LOW |
| 6. Rules verification | 5h | 8h | HIGH ⭐⭐⭐ |
| 7. Test coverage | 3h | 4h | MEDIUM |
| 8. Edge cases | 2h | 2h | MEDIUM |
| 9. Refactoring docs | 1h | 1h | LOW |
| 10. Weapon/armor modules | 3h | 4h | MEDIUM ⭐ |
| **TOTAL** | **27h** | **38h** | |

**Realistic Target:** 20-25 hours (focus on starred items)

---

## 🎯 PRIORITIZED EXECUTION ORDER

**Phase 1: Core Deliverables (10-12h)**
1. Small craft templates (3 required)
2. Rules verification (CRITICAL)
3. Complete High Guard tables
4. Test coverage for ship-templates.js

**Phase 2: Foundation Building (8-10h)**
5. Detail formatters (pure functions)
6. JSON export/import schemas
7. Weapon/armor validation modules
8. Edge case sweep

**Phase 3: Nice-to-Haves (5-8h)**
9. Ship comparison utilities
10. Bonus small craft (3 more)
11. Refactoring documentation
12. Additional test coverage

---

## ✅ SUCCESS CRITERIA (Tiered)

### MUST HAVE (Phase 1)
- ✅ All 3 required small craft templates
- ✅ Rules verification report with fixes
- ✅ Complete High Guard reference tables
- ✅ 20+ new tests for ship-templates.js
- ✅ All 161+ existing tests passing

### SHOULD HAVE (Phase 2)
- ✅ Detail level formatters (all 3)
- ✅ JSON export/import schemas
- ✅ Complete weapon/armor validation
- ✅ Edge cases documented and handled
- ✅ 40+ new tests total

### NICE TO HAVE (Phase 3)
- ✅ Ship comparison utilities
- ✅ 3 bonus small craft
- ✅ Refactoring roadmap
- ✅ 60+ new tests total
- ✅ >85% code coverage

---

## 📦 DELIVERABLES (Expanded)

**New Files (Data):**
- `data/ships/v2/small_craft/pinnace.json`
- `data/ships/v2/small_craft/gig.json`
- `data/ships/v2/small_craft/tlatl.json`
- `data/ships/v2/small_craft/air_raft.json` (bonus)
- `data/ships/v2/small_craft/cutter.json` (bonus)
- `data/ships/v2/small_craft/ship_boat.json` (bonus)
- `data/schemas/ship-export-v1.schema.json`
- `data/schemas/battle-state-v1.schema.json`
- `data/schemas/character-v1.schema.json`

**New Files (Code):**
- `lib/ship-formatters.js` (detail levels)
- `lib/ship-comparison.js` (utilities)
- `lib/ship-weapons-complete.js` (all weapons)
- `lib/ship-armor-complete.js` (all armor)
- `lib/schemas.js` (JSON schema validation)

**New Files (Tests):**
- `tests/ship-templates.test.js` (20+ tests)
- `tests/ship-formatters.test.js` (15+ tests)
- `tests/ship-comparison.test.js` (10+ tests)
- `tests/schemas.test.js` (15+ tests)
- `tests/ship-weapons-complete.test.js` (20+ tests)
- `tests/ship-armor-complete.test.js` (15+ tests)

**New Files (Documentation):**
- `.claude/HIGH-GUARD-COMPLETE-REFERENCE.md`
- `.claude/RULES-VERIFICATION-REPORT.md`
- `.claude/JSON-SCHEMAS.md`
- `.claude/SHIP-FORMATTERS.md`
- `.claude/EDGE-CASES-COMPREHENSIVE.md`
- `.claude/REFACTORING-OPPORTUNITIES.md`
- `.claude/AUTONOMOUS-SESSION-3-COMPLETION-REPORT.md`

**Modified Files:**
- `lib/index.js` (export new modules)
- `public/ship-templates.js` (edge case fixes, use formatters)
- `test-ship-templates.js` (small craft validation)
- `.claude/EXTRACTED-SHIP-DATA.md` (merge with complete reference)

---

## 🚫 STILL OUT OF SCOPE

**UI Components (dependencies on user feedback):**
- Card grid layout
- Detail slider UI component
- Ship library UI
- Editing interfaces
- localStorage UI integration

**Risky/Complex Work:**
- Stage 13 refactoring (needs all features complete)
- Server deployment (Stage 15)
- API integrations (Stage 14 implementations)
- Fleet battles (Stage 16)

**Anything with Dependencies:**
- Features requiring incomplete work
- Integration between unfinished systems
- User-facing changes requiring feedback

---

## 🎯 RATIONALE: Why This is Safe

### Data Structures (Schemas)
✅ **Safe:** Pure data definitions, no implementation
✅ **No Dependencies:** JSON schemas are standalone
✅ **Won't Change:** Based on stable V2 template structure
✅ **Future-Proof:** Enables Stage 14 work later

### Pure Functions (Formatters, Comparison)
✅ **Safe:** Input → Output, no side effects
✅ **No Dependencies:** Work with existing templates
✅ **Testable:** Easy to verify correctness
✅ **Reusable:** UI can use them later

### Reference Data (High Guard Tables)
✅ **Safe:** Extracting from published rulebook
✅ **No Dependencies:** Standalone documentation
✅ **Won't Change:** Official Mongoose Traveller rules
✅ **High Value:** Needed for all future ship work

### Validation Modules (Weapons, Armor)
✅ **Safe:** Extends existing lib/ship-*.js pattern
✅ **No Dependencies:** Standalone validation
✅ **Testable:** Unit tests verify correctness
✅ **Needed:** Ship builder will require these

### Test Infrastructure
✅ **Safe:** Tests never break features
✅ **No Dependencies:** Test existing code
✅ **High Value:** Catch regressions early

---

## 🔄 ROLLBACK STRATEGY

**Zero Risk Rollback:**
- All new files can be deleted (no impact on existing features)
- Modified files can be reverted to previous commit
- Git commit after each phase
- Can rollback to any phase completion

**Commit Strategy:**
- Commit after Phase 1 (core deliverables)
- Commit after Phase 2 (foundation)
- Commit after Phase 3 (nice-to-haves)
- Tag before starting risky work

---

## 📊 VALUE ANALYSIS

**Work Pulled Forward from Future Stages:**

| Item | Original Stage | Time Saved Later |
|------|----------------|------------------|
| JSON schemas | 14 | 2-3h |
| Detail formatters | 12 | 3-4h |
| Ship comparison | 12/16 | 1-2h |
| Complete HG tables | Ongoing | 3-4h |
| Weapon/armor modules | 12 | 3-4h |
| **TOTAL** | | **12-17h** |

**ROI:** Invest 20-25h now, save 12-17h later + reduce future risk

**Benefit:** These components are stable, won't change, can be built confidently now

---

**STATUS:** ✅ EXPANDED PLAN COMPLETE
**Approach:** Maximum safe velocity
**Risk Level:** LOW (all dependency-free work)
**Confidence:** HIGH (proven in Sessions 1 & 2)
**Expected Value:** VERY HIGH (multiply force efficiently)

**Next Step:** User approval, then GO for autonomous mega-session
