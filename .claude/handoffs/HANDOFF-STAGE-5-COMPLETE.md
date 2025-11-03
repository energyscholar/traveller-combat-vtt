# STAGE 5 COMPLETE → Ready for Stage 6
**Date:** 2025-11-02 | **Branch:** main | **Tests:** 64/64 ✅

## QUICK START NEXT SESSION
```
"Implement Stage 6: Crew System. See STAGE-PLAN.md lines 147-185.
Read only: lib/combat.js, this handoff. Target: 70k tokens."
```

---

## CURRENT STATUS
- **Location:** `/home/bruce/software/traveller-combat-vtt`
- **Stage:** 5 COMPLETE ✅ → Next: Stage 6 (Crew System)
- **Tests:** 64/64 passing (7 combat + 17 multiplayer + 20 turn + 20 weapon)
- **Git:** All committed, on main branch

---

## STAGE 5 CHANGES: WEAPON SELECTION & AMMO

### New Features
✅ Multiple weapons per ship (Pulse Laser, Beam Laser, Missiles)
✅ Weapon dropdown selector in UI
✅ Different damage profiles (2d6, 3d6, 4d6)
✅ Ammo tracking for missiles (6 shots, depletes on use)
✅ Weapon range restrictions (Beam Laser: close-medium only)
✅ Missile long range bonus (+2 DM negates -2 penalty)
✅ Real-time ammo sync between clients
✅ Ammo resets on game reset

### Ship Loadouts
**Scout:**
- Pulse Laser: 2d6 damage, unlimited, all ranges
- Missiles: 4d6 damage, 6 shots, long range +2 DM

**Corsair:**
- Beam Laser: 3d6 damage, unlimited, close-medium only
- Missiles: 4d6 damage, 6 shots, long range +2 DM

### Files Changed (4 files, 789 additions)
1. **lib/combat.js** - SHIPS now have `weapons[]` array, `resolveAttack()` uses weapon damage
2. **server.js** - Weapon selection handling, ammo tracking in shipState, ammoUpdate events
3. **public/index.html** - Weapon dropdown, ammo display, weapon selection logic
4. **tests/unit/weapon-system.test.js** - 20 new tests (weapon selection, ammo, damage)

### Key Implementation Details

**Weapon Object Structure:**
```javascript
{
  name: 'Pulse Laser',
  damage: '2d6',      // Dice formula
  ammo: null,         // null = unlimited
  range: 'all',       // 'all', 'close-medium', etc.
  rangeDM: {}         // e.g., { long: 2 }
}
```

**Game State (server.js):**
```javascript
shipState = {
  scout: {
    hull: 15,
    selectedWeapon: 0,    // Index into SHIPS.scout.weapons
    ammo: [null, 6]       // Ammo for each weapon
  },
  corsair: {
    hull: 12,
    selectedWeapon: 0,
    ammo: [null, 6]
  }
}
```

**Server Events:**
- `selectWeapon` - Player selects weapon from dropdown
- `ammoUpdate` - Broadcasts ammo state after firing missiles
- `weaponUnavailable` - Error when trying to fire weapon with 0 ammo

**Client Changes:**
- Weapon dropdown populated from SHIPS data
- Ammo display shows "Missiles: 4/6" format
- Weapon selection persists across turns
- Attack button disabled if selected weapon has 0 ammo

---

## TEST RESULTS (64/64 ✅)

**Weapon System Tests (20 new):**
```
✅ Weapon selection (8 tests)
  - Default weapon selection, change weapon, invalid index handling
✅ Ammo tracking (6 tests)
  - Missile depletion, unlimited weapons, 0 ammo blocking, reset
✅ Damage calculation (6 tests)
  - 2d6, 3d6, 4d6 damage profiles, range restrictions, range bonuses
```

**Previously Passing (44):**
- 7 combat unit tests
- 17 multiplayer unit tests
- 20 turn system unit tests

---

## TOKEN USAGE
**Stage 5 Session:** ~72,000 tokens (under 90k target)
**Time:** ~2.5 hours

---

## WHAT WORKS NOW
✅ Ship assignment (Scout/Corsair/Spectator)
✅ Turn-based combat (initiative, round counter)
✅ **Weapon selection (3 weapons per ship)**
✅ **Ammo tracking (missiles deplete)**
✅ **Different damage profiles (2d6/3d6/4d6)**
✅ **Range restrictions (Beam Laser limited)**
✅ Victory detection (hull <= 0)
✅ Game reset (hull + rounds + ammo)

**Still TODO (Future Stages):**
⏭️ Crew/character system (Stage 6)
⏭️ Movement/positioning (Stage 7)
⏭️ More ships (Stage 8)
⏭️ Persistence (Stage 9)

---

## STAGE 6 PREVIEW: CREW SYSTEM

**Target:** 70k tokens | **Time:** 3-4 hours | **Difficulty:** Hard

**Key Features:**
- Crew roster (Pilot, Gunner, Engineer)
- Character sheets (Name, Skills, Stats)
- Role assignment to stations
- Skill bonuses (Pilot +init, Gunner +attack, Engineer repairs)
- Crew damage/injuries (reduced effectiveness)

**Test-Driven Approach:**
1. Write 20 crew tests FIRST (skills, roles, damage)
2. Implement to pass tests
3. Manual verification last

**Files to Read:**
- `lib/combat.js` (to see current SHIPS structure)
- `tests/unit/turn-system.test.js` (to see initiative/skill patterns)
- This handoff

**Files to Modify:**
- `lib/combat.js` - Add CREW data, crew skill modifiers
- `server.js` - Crew assignment, crew damage tracking
- `public/index.html` - Crew roster UI
- `tests/unit/crew-system.test.js` - NEW: 20 tests

**Deliverables:**
- Crew affects combat (gunner skill → attack bonus)
- Can assign crew to roles
- Engineer can repair hull
- 20 new tests passing

---

**END OF HANDOFF**

See `.claude/STAGE-PLAN.md` for complete roadmap.
