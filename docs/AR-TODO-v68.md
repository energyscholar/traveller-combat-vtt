# AR TODOs from v68 (Processed 2025-12-11)

## AR-67: Fix hailContact Timing Bug
**Priority:** HIGH (JS console error)
**Source:** prompts_for_TODOS_v68.txt line 3-8
**Symptoms:** `Uncaught ReferenceError: hailContact is not defined` when captain clicks Hail button
**Analysis:** Window export exists at app.js:10475. Likely timing issue - captain panel renders before app.js fully loads.
**Fix:** Investigate captain panel load order, ensure hailContact available before render.
**Scope:** 30min

---

## AR-68: Astrogator Verify Position After Jump
**Priority:** MEDIUM (gameplay feature)
**Source:** prompts_for_TODOS_v68.txt line 26
**Description:** After emerging from jump at STARSYSTEM JUMP EXIT POINT, pilot course plotting is blocked until Astrogator performs "Verify Position".
**Implementation:**
1. Add `positionVerified: false` to ship state after jump exit
2. Block pilot "Travel To" until verified
3. Add "Verify Position" button to Astrogator panel
4. Roll sensor/astrogation check (+2 good jump, +2 good maps)
5. Add red/green LED indicator for verification status
**Scope:** 2hr

---

## AR-69: Von Sydo Corrupt Player Data
**Priority:** LOW (specific data issue)
**Source:** prompts_for_TODOS_v68.txt line 1
**Symptoms:**
- Crew Role doesn't highlight when selected
- Can enter Bridge with undefined role (breaks things)
- Von Sydo disappears from PC list
**Investigation:** Check JSON for unescaped characters, validate PC structure
**Also:** Create Observer Role as fallback for unknown roles
**Scope:** 1hr investigation + 1hr Observer Role

---

## Future ARs (Not Processed)

### Sensor Role Enhancement
- Popup panels for clicked objects with scan buttons
- Passive/Active/Deep scan with LED indicators
- Mongoose Traveller sensor roll rules

### Bridge Objects as Destinations
- Objects need systemHex, coordinates, velocity
- Visible unique IDs for cross-role reference
- Objects appear on Starsystem Map

### MULTISYSTEM-TRAVEL1 Use Case
- Full journey test: Flammarion -> Faldor -> Bowman -> Asteltine -> Flammarion
- Wilderness refueling, fuel processing, gas giant skimming
- Multi-browser puppeteer test with screenshots

### Shooting Use Case
- Ship targets asteroid at optimal laser range
- Gunner destroys asteroid (~10 hits)
- Combat resolution flow
