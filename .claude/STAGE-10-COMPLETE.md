# Stage 10: Critical Hits & Damage Effects - COMPLETE ✅

**Completed:** 2025-11-09
**Status:** All acceptance criteria met, integration verified
**Test Coverage:** 83 unit tests passing, integration tests verified

---

## Summary

Stage 10 implements the complete Mongoose Traveller 2nd Edition critical hit system with:
- Severity calculation (damage ÷ 10, rounded up, capped at 6)
- Critical hit triggers (Effect ≥6 and damage > 0)
- Sustained damage (automatic Severity 1 crit every 10% hull lost)
- 11 system locations with unique effects
- Damage control and repair system
- Full integration into combat resolution

---

## What Was Built

### New Modules (Incremental Refactoring)

#### `lib/critical-hits.js` (~200 LOC)
Core critical hit mechanics:
- `calculateSeverity(damage)` - Damage ÷ 10, round up, cap at 6
- `rollCriticalLocation()` - 2D6 table for 11 locations
- `triggersCriticalHit(effect, damage)` - Effect ≥6 and damage > 0
- `triggersSustainedDamage(current, max, previous)` - Every 10% hull
- `applyCriticalHit(ship, location, severity)` - Track crits on ship
- `getTotalSeverity(ship, location)` - Sum unrepaired crits
- `attemptRepair(ship, location, skill)` - Engineer repairs (Average 8+ with DM -Severity)

#### `lib/damage-effects.js` (~250 LOC)
System-specific effects for all 11 locations:
- **M-Drive:** Control DM penalty, Thrust reduction, disabled at Sev 5+
- **Power Plant:** Power %, Thrust loss, destroyed at Sev 4+
- **Sensors:** Progressive range limits, disabled at Sev 6
- **Weapons:** Bane (Sev 1), Disabled (Sev 2), Destroyed (Sev 3), Explosion (Sev 4+)
- **J-Drive:** Disabled on any severity
- **Computer:** DM penalties, offline at Sev 4+
- **Armour:** Permanent reduction
- **Hull:** Immediate XD6 damage (X = severity)
- **Crew:** Random crew casualty, 3×severity damage
- **Fuel:** Leaks (tons/hour, tons/round, %, or destroyed)
- **Cargo:** Message only (no mechanical effect)

### Combat Integration

#### Modified `lib/combat.js` (+150 LOC)
- Added imports for critical-hits and damage-effects modules
- Modified `resolveAttack()`:
  - Check for critical hit trigger (Effect ≥6, damage > 0)
  - Check for sustained damage (10% hull thresholds)
  - Apply location-specific effects
  - Track crits on target ship
- Added `applyCriticalEffects(target, location, severity, totalSeverity)` helper
- Updated `formatAttackResult()` to display critical messages
- Added `getCriticalEffectMessage(effects)` for formatting

### Comprehensive Testing

#### Unit Tests: `tests/unit/critical-hits.test.js` (~933 LOC, 83 tests)
- **Severity Calculation** (8 tests): 1-10 damage = Sev 1, 51-60 = Sev 6, cap at 6
- **Critical Triggers** (6 tests): Effect ≥6 and damage > 0 required
- **Sustained Damage** (6 tests): Every 10% hull threshold
- **Location Rolls** (3 tests): Valid locations, variety, string type
- **Apply Critical** (8 tests): Initialize tracking, stack multiple crits
- **M-Drive Effects** (6 tests): Control DM, Thrust penalties, disabled at Sev 5
- **Power Plant Effects** (6 tests): Power %, Thrust loss, destroyed at Sev 4
- **Sensors Effects** (7 tests): Range limits, DM penalties, disabled at Sev 6
- **Weapon Effects** (6 tests): Bane, disabled, destroyed, explosion
- **J-Drive Effects** (3 tests): Disabled on any severity
- **Hull Criticals** (6 tests): 1D6 to 6D6 damage scaling
- **Crew Casualties** (6 tests): Random crew, 3×severity damage
- **Damage Control** (8 tests): Repair checks, worst-first, temporary repairs
- **Total Severity** (4 tests): Stack crits, exclude repaired

**Result:** 83/83 passing ✅

#### Integration Tests
- `tests/integration/critical-hits-combat.test.js` (399 LOC): Full combat scenarios
- `tests/integration/critical-hits-simple.test.js` (104 LOC): Diagnostic verification

**Verified Scenario:**
```
Attack: Effect 12, Damage 32
Critical: Severity 4, Location armour
Effects: Armour reduced by 4
Sustained: Severity 1, Location weapon (32 damage = 40% hull lost)
Result: 2 crits tracked on target ✅
```

---

## Acceptance Criteria

- [x] Severity scales with damage (1-6) ✅
- [x] All 11 crit locations have effects ✅
- [x] M-Drive hits reduce Thrust ✅
- [x] Sensor hits reduce range ✅
- [x] Weapon hits disable turrets ✅
- [x] Engineer can repair crits ✅
- [ ] Jump misjump on damage/proximity (DEFERRED to Stage 12 - Jump Drive mechanics)
- [x] Critical hits integrated into combat resolution ✅
- [x] Sustained damage triggers (every 10% hull lost) ✅
- [x] 83 unit tests passing ✅
- [x] Integration tests created and verified ✅
- [x] Incremental refactoring: lib/critical-hits.js and lib/damage-effects.js ✅

---

## Technical Details

### Critical Hit Trigger Logic
```javascript
// In resolveAttack() after damage calculation
const effect = attackTotal - RULES.attackTarget;
const previousHull = target.hull;

// Critical hit: Effect ≥6 and damage > 0
if (triggersCriticalHit(effect, damage)) {
  const severity = calculateSeverity(damage);
  const location = rollCriticalLocation();
  const critResult = applyCriticalHit(target, location, severity);

  result.critical = {
    triggered: true,
    effect,
    severity,
    location,
    totalSeverity: critResult.totalSeverity,
    message: critResult.message,
    effects: applyCriticalEffects(target, location, severity, critResult.totalSeverity)
  };
}

// Sustained damage: Every 10% hull lost
if (triggersSustainedDamage(result.newHull, maxHull, previousHull)) {
  const location = rollCriticalLocation();
  const critResult = applyCriticalHit(target, location, 1);

  result.critical.sustainedDamage = {
    triggered: true,
    location,
    severity: 1,
    totalSeverity: critResult.totalSeverity,
    message: `Sustained damage: ${critResult.message}`,
    effects: applyCriticalEffects(target, location, 1, critResult.totalSeverity)
  };
}
```

### Severity Calculation
```javascript
function calculateSeverity(damage) {
  if (damage <= 0) return 0;
  const severity = Math.ceil(damage / 10);
  return Math.min(severity, 6); // Cap at 6
}
```

Examples:
- 1-10 damage → Severity 1
- 11-20 damage → Severity 2
- 21-30 damage → Severity 3
- 51-60 damage → Severity 6
- 100+ damage → Severity 6 (capped)

### Sustained Damage Thresholds
```javascript
function triggersSustainedDamage(currentHull, maxHull, previousHull) {
  const threshold = maxHull * 0.1;
  const hullLost = maxHull - currentHull;
  const previousHullLost = maxHull - previousHull;

  const currentThresholds = Math.floor(hullLost / threshold);
  const previousThresholds = Math.floor(previousHullLost / threshold);

  return currentThresholds > previousThresholds;
}
```

Scout (40 Hull): Crits at ≤36, ≤32, ≤28, ≤24, ≤20, ≤16, ≤12, ≤8, ≤4
Free Trader (80 Hull): Crits at ≤72, ≤64, ≤56, ≤48, ≤40, ≤32, ≤24, ≤16, ≤8

### Location Table (2D6)
```javascript
const locations = {
  2: 'sensors',
  3: 'powerPlant',
  4: 'fuel',
  5: 'weapon',
  6: 'armour',
  7: 'hull',      // Most common (16.7%)
  8: 'mDrive',
  9: 'cargo',
  10: 'jDrive',
  11: 'crew',
  12: 'computer'
};
```

### Damage Control
```javascript
function attemptRepair(ship, location, engineerSkill) {
  // Find worst unrepaired crit
  const unrepaired = ship.crits[location]
    .filter(c => !c.repaired)
    .sort((a, b) => b.severity - a.severity);

  const targetCrit = unrepaired[0];
  const targetNumber = 8;  // Average difficulty
  const dm = -targetCrit.severity;

  const roll = dice.roll2d6();
  const total = roll.total + engineerSkill + dm;
  const success = total >= targetNumber;

  if (success) {
    targetCrit.repaired = true;
    targetCrit.temporary = true;  // Repairs last 1D hours
  }

  return { success, location, severity, roll, total, needed: targetNumber };
}
```

---

## Code Statistics

### Files Modified
- `lib/combat.js`: +150 LOC (critical hit integration)
- `lib/critical-hits.js`: +5 LOC (defensive fix)
- `.claude/STAGE-10-PLAN.md`: Updated acceptance criteria

### Files Created
- `lib/critical-hits.js`: 194 LOC (core mechanics)
- `lib/damage-effects.js`: 309 LOC (system effects)
- `tests/unit/critical-hits.test.js`: 431 LOC (83 tests)
- `tests/integration/critical-hits-combat.test.js`: 399 LOC
- `tests/integration/critical-hits-simple.test.js`: 104 LOC

### Total Changes
- **Production code:** ~653 LOC (critical-hits + damage-effects + combat integration)
- **Test code:** ~934 LOC (unit + integration)
- **Total:** ~1,587 LOC
- **Test:Code ratio:** 1.4:1 ✅

---

## Incremental Refactoring

As planned in Stage 10, we extracted focused modules to reduce `combat.js` bloat:

### Before Stage 10
- `lib/combat.js`: 1,605 LOC (monolithic)

### After Stage 10
- `lib/combat.js`: 1,755 LOC (+150 LOC integration)
- `lib/critical-hits.js`: 194 LOC (extracted)
- `lib/damage-effects.js`: 309 LOC (extracted)

**Pattern established** for Stages 11-12:
- Extract focused, single-purpose modules while adding features
- Maintain backward compatibility
- Comprehensive test coverage
- Sets foundation for Stage 13 comprehensive refactoring

---

## What's Next: Stage 11

### Stage 11: Missiles & UI Improvements
**Scope:**
- Missile mechanics (4D6 damage, +2 DM at long range, limited ammo)
- Point defense turrets (shoot down incoming missiles)
- UI Option B horizontal layout (save ~140px vertical space)
- Expand/collapse for Crew and Combat Log

**Estimated:** 8-10 hours

**Focus:**
- Continue incremental refactoring (extract missile mechanics)
- Implement UI wireframe from UI-IMPLEMENTATION-ROADMAP.md
- Maintain test coverage
- Keep velocity high

---

## Lessons Learned

### What Went Well
1. **Incremental refactoring** while adding features reduced technical debt
2. **83 comprehensive unit tests** caught bugs early (sustained damage, hull dice rolls)
3. **Simple diagnostic test** (critical-hits-simple.test.js) verified integration quickly
4. **Defensive programming** (ship.crits[location] check) prevented runtime errors

### Bugs Fixed During Implementation
1. **Sustained damage calculation:** Was using `currentHull / threshold` instead of `hullLost / threshold`
2. **Hull critical dice rolls:** Used wrong DiceRoller API (`roll(string)` vs `roll(count, sides)`)
3. **Location array undefined:** Added defensive check `if (!ship.crits[location])`

### Technical Decisions
1. **Deferred Jump misjump to Stage 12:** Jump Drive mechanics not yet implemented
2. **Weapons use individual severity, not total:** Per Traveller rules, each hit is independent
3. **Hull criticals apply immediate damage:** Modifies target.hull directly during effect application
4. **Repair targets worst crit first:** Logical priority, simplifies UI

---

## Commits

### Stage 10 Commits
1. `dd6f89a` - Add kill command helper to npm start for port 3000 conflicts
2. `1f1a7c4` - Stage 10: Implement critical hits and damage effects system
3. `4353ba6` - Stage 10: Integrate critical hits into combat resolution

### Changes Since Stage 9
- Ship stats corrected (Scout 40 Hull, Free Trader 80 Hull)
- UI planning completed (UI-IMPLEMENTATION-ROADMAP.md)
- Refactoring strategy documented (Stage 13 plan)
- Critical hits fully implemented and integrated

---

## References

### Implementation Files
- `lib/critical-hits.js` - Core mechanics
- `lib/damage-effects.js` - System effects
- `lib/combat.js:446-490` - Integration in resolveAttack()
- `lib/combat.js:495-542` - applyCriticalEffects helper
- `lib/combat.js:561-582` - Format critical messages

### Test Files
- `tests/unit/critical-hits.test.js` - 83 unit tests
- `tests/integration/critical-hits-combat.test.js` - Full combat scenarios
- `tests/integration/critical-hits-simple.test.js` - Diagnostic

### Planning Documents
- `.claude/STAGE-10-PLAN.md` - Stage plan with acceptance criteria
- `.claude/STAGE-11-PLAN.md` - Next stage plan
- `.claude/UI-IMPLEMENTATION-ROADMAP.md` - UI planning
- `.claude/STAGE-13-PLAN.md` - Comprehensive refactoring plan

### Traveller Rules References
- Mongoose Traveller 2e Core Rulebook: Critical Hits (p. 160-163)
- Damage Effects by Location (p. 162)
- Severity Calculation (p. 161)
- Damage Control Actions (p. 163)

---

**Status:** Stage 10 COMPLETE ✅
**Next:** Stage 11 - Missiles & UI Improvements
**Last Updated:** 2025-11-09
