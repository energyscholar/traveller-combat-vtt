# STAGE 6 COMPLETE → Ready for Stage 7
**Date:** 2025-11-02 | **Branch:** main | **Tests:** 84/84 ✅

## QUICK START NEXT SESSION
```
"Implement Stage 7: Movement. See STAGE-PLAN.md lines 86-123.
Read only: lib/combat.js, server.js (gameState), this handoff.
Target: 70k tokens. TDD: Write 20 grid tests FIRST, then implement."
```

---

## CURRENT STATUS
- **Location:** `/home/bruce/software/traveller-combat-vtt`
- **Stage:** 6 COMPLETE ✅ → Next: Stage 7 (Movement & Positioning)
- **Tests:** 84/84 passing (7 combat + 17 multiplayer + 20 turn + 20 weapon + 20 crew)
- **Git:** All committed, on main branch

---

## STAGE 6 CHANGES: CREW SYSTEM & CHARACTER SKILLS

### New Features
✅ Crew roster (3 crew members per ship)
✅ Character sheets (Name, Skills, Health)
✅ Gunner skill adds to attack rolls (+2 Scout, +1 Corsair)
✅ Pilot skill affects initiative (stored in ship.pilotSkill)
✅ Engineer repair action (1d6 HP per turn, capped at maxHull)
✅ Crew health tracking (10/10 HP each)
✅ Crew damage mechanics (health scales skill effectiveness)
✅ Crew death when health reaches 0
✅ Crew roster UI with health display
✅ Repair button (enabled on your turn)

### Crew Roster

**Scout Crew (Skilled):**
- Lt. Sarah Chen - Pilot +2
- Cpl. James Martinez - Gunner +2
- Tech. Emily Wong - Engineer +1

**Corsair Crew (Pirates):**
- Pirate Kane - Pilot +1
- Pirate Vex - Gunner +1
- Pirate Rusty - Engineer +0

### Files Changed (4 files, 701 additions)
1. **lib/combat.js** - CREW data, applyCrew(), assignCrewRole(), crewTakeDamage(), engineerRepair(), getEffectiveSkill()
2. **server.js** - Crew state in shipState, applyCrew() to attacker, engineerRepair event handler
3. **public/index.html** - Crew roster UI, repair button, CSS styles, socket event handlers
4. **tests/unit/crew-system.test.js** - 20 new tests (skill application, role assignment, damage)

### Key Implementation Details

**Crew Data Structure (lib/combat.js):**
```javascript
CREW = {
  scout: [
    { id, name, role, skills: { pilot, gunner, engineering }, health, maxHealth }
  ],
  corsair: [...]
}
```

**Apply Crew Function:**
```javascript
applyCrew(ship, crewAssignments)
// crewAssignments = { pilot, gunner, engineer }
// Returns ship with crew bonuses applied
```

**Effective Skill (scales with health):**
```javascript
effectiveSkill = baseSkill * (health / maxHealth)
// Full health = full skill
// 50% health = 50% skill effectiveness
// 0 health (dead) = 0 skill
```

**Engineer Repair:**
```javascript
engineerRepair(ship, engineer, { seed })
// Rolls 1d6 for repair amount
// Caps at ship.maxHull
// Returns { repaired, repairRoll, hullRepaired, newHull }
```

**Server State (server.js):**
```javascript
shipState.scout.crew = {
  pilot: { ...CREW.scout[0] },
  gunner: { ...CREW.scout[1] },
  engineer: { ...CREW.scout[2] }
}
```

**Combat Integration:**
- Gunner skill automatically added to attack rolls via applyCrew()
- Pilot skill sets ship.pilotSkill (used for initiative in rollInitiative())
- Engineer repair validated on server (turn check, engineer alive check)

**UI Elements:**
- Crew roster displays all 6 crew members (3 per ship)
- Health bars show HP (e.g., "10/10")
- Repair button (🔧) enabled on your turn only
- Repair results logged to combat log

---

## TEST RESULTS (84/84 ✅)

**Crew System Tests (20 new):**
```
✅ Crew skill application (8 tests)
  - Gunner +attack, pilot +initiative, engineer repair, skill stacking
✅ Role assignment (6 tests)
  - Assign/unassign crew, validation
✅ Crew damage (6 tests)
  - Damage, death, skill reduction, healing
```

**Previously Passing (64):**
- 7 combat unit tests
- 17 multiplayer unit tests
- 20 turn system unit tests
- 20 weapon system unit tests

---

## TOKEN USAGE
**Stage 6 Session:** ~70,000 tokens (on target!)
**Time:** ~3 hours

---

## WHAT WORKS NOW
✅ Ship assignment (Scout/Corsair/Spectator)
✅ Turn-based combat (initiative, rounds)
✅ Weapon selection (3 weapons per ship)
✅ Ammo tracking (missiles deplete)
✅ **Crew system (3 crew per ship)**
✅ **Gunner skills affect combat (+2 attack bonus)**
✅ **Pilot skills affect initiative**
✅ **Engineer can repair (1d6 HP per turn)**
✅ **Crew health and damage mechanics**
✅ Victory detection (hull <= 0)
✅ Game reset (hull + rounds + ammo)

**Still TODO (Future Stages):**
⏭️ Movement/positioning grid (Stage 7)
⏭️ More ship types (Stage 8)
⏭️ Persistence/save-load (Stage 9)

---

## NEXT STAGE PREVIEW: MOVEMENT & POSITIONING

**Target:** 70k tokens | **Time:** 3-4 hours | **Difficulty:** Hard

**Key Features:**
- 10x10 hex grid (SVG rendering)
- Ship positioning and movement
- Movement points (Scout: 3, Corsair: 2)
- Range auto-calculated from hex distance
- Line of sight checks
- Movement phase before combat

**TDD Test Breakdown (20 tests):**
1. Movement validation (8 tests): within movement points, invalid moves
2. Range calculation (6 tests): hex distance → range bands
3. Line of sight (6 tests): blocked/clear paths

**Files to Modify:**
- `lib/combat.js` - Add hex distance calculation, LOS checks
- `server.js` - Position tracking, movement validation, range calculation
- `public/index.html` - SVG hex grid, click-to-move
- `tests/unit/grid-system.test.js` - NEW: 20 tests

**Deliverables:**
- Ships visible on grid, can move
- Range auto-calculated correctly
- LOS blocks attacks
- 104/104 tests passing (84 + 20 new)

---

**END OF HANDOFF**

See `.claude/STAGE-PLAN.md` for complete roadmap.
