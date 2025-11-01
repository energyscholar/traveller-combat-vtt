# Stage 2: Combat Math (Mongoose Traveller 2e)

**Date:** 2025-10-31
**Duration:** 2 hours
**Goal:** Implement Traveller combat rules with automated testing

## What Was Built

### Core Combat System
- `lib/dice.js` - Seeded random number generator for testing
- `lib/combat.js` - Attack resolution with Mongoose 2e rules
- `data/rules/combat-rules.json` - Combat rules reference
- `tests/unit/combat.test.js` - 7 automated functional tests

### Combat Rules Implemented

**Attack Resolution:**
```
Roll: 2d6 + pilot_skill + range_DM - dodge_DM
Hit if: roll >= 8
```

**Damage Calculation:**
```
Damage: max(0, 2d6 - armor)
New Hull: current_hull - damage
```

**Range Modifiers:**
- Adjacent: +2
- Close: +1
- Medium: 0
- Long: -2
- Very Long: -4

**Dodge Modifiers:**
- None: 0
- Partial: -1
- Full: -2

### Test Ships

**Scout Ship:**
- Hull: 10, Armor: 2
- Pilot Skill: +2
- Weapon: Pulse Laser

**Corsair:**
- Hull: 15, Armor: 4
- Pilot Skill: +1
- Weapon: Beam Laser

### Test Coverage (7/7 Passing)

1. ✅ Socket connection test
2. ✅ Basic combat math
3. ✅ Hit detection (roll >= 8)
4. ✅ Miss detection (roll < 8)
5. ✅ Range modifier application
6. ✅ Dodge modifier application
7. ✅ Multi-tab synchronization

### User Interface

- Attack button for each ship
- Range selection dropdown
- Dodge selection dropdown
- Combat log showing all results
- Test mode button (bottom-right, orange)

## Known Limitations (Intentional)

- Hull damage doesn't persist (fixed in Stage 6)
- No victory detection (Stage 6)
- Both tabs control both ships (fixed in Stage 3)

## Files Modified

- `server.js` - Added combat event handler
- `public/index.html` - Added combat UI and test mode

## Files Created

- `lib/dice.js`
- `lib/combat.js`
- `data/rules/combat-rules.json`
- `tests/unit/combat.test.js`

## Next Stage

Stage 3: Multiplayer sync - each tab controls ONE ship only
