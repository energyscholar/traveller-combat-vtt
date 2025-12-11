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

## AR-70: Sensor Role Enhancement - Scan Buttons
**Priority:** HIGH (core gameplay)
**Source:** prompts_for_TODOS_v68.txt line 10
**Risk:** MEDIUM → Needs rules research

**Description:** Popup panels for clicked objects include scan buttons (Passive, Active, Deep) with LED indicators.

**Implementation:**
1. Expand object popup panel size
2. Add scan buttons: Passive Scan, Active Scan, Deep Scan
3. LED indicator per scan (red→green when complete)
4. Skill rolls per Mongoose Traveller rules:
   - Passive: -2 penalty, no signature
   - Active: Normal roll, detectable
   - Deep: +2 bonus, very detectable
5. Scan reveals info based on Effect

**Risk Mitigation:**
- [ ] Confirm Mongoose Traveller sensor rules accessible
- [ ] Unit test for each scan type
- [ ] Puppeteer test for UI workflow

**Scope:** 4hr

---

## AR-71: Bridge Objects as System Map Destinations
**Priority:** HIGH (enables travel to objects)
**Source:** prompts_for_TODOS_v68.txt line 12
**Risk:** LOW → Reuse existing orbital mechanics (plan mode complete)

**Description:** Sensor contact objects become visitable destinations on System Map.

**Key Insight:** "Contacts are just celestial objects with `type: 'Contact'`"
- System map renders anything with AU coordinates
- Convert bearing/range → absolute AU position
- Zero changes to existing orbital code

**Implementation (Plan Approved):**
1. `contactToMapObject(contact, shipPosition)` - convert relative→absolute coords
2. `renderContactDot(ctx, contact, ...)` - minimal render function (~20 lines)
3. Wire into existing render loop (additive, no modifications)

**Phases:**
- Phase 1: Static rendering (2hr)
- Phase 2: Selectable as destination (2hr)
- Phase 3: Motion/orbits (2hr, optional)

**Files:** `system-map.js`, `app.js`, `sensors.js`

**Risk Mitigation:**
- [x] Plan mode research complete
- [ ] Unit test conversion function
- [ ] E2E test contact visibility on map

**Scope:** 6hr (unchanged, but LOW risk now)

---

## AR-72: Fuel Source Tagging
**Priority:** MEDIUM (enables wilderness refueling)
**Source:** prompts_for_TODOS_v68.txt line 19
**Risk:** LOW → Data-only change

**Description:** Tag destinations as fuel sources in JSON.

**Implementation:**
1. Add `fuelSource` field to location JSON:
   - `{ type: 'gas_giant', fuelType: 'unrefined', unlimited: true }`
   - `{ type: 'wilderness', fuelType: 'unrefined', requires: 'hydrographics > 0' }`
   - `{ type: 'starport', fuelType: 'refined', cost: 500 }`
2. Engineer refuel UI shows available fuel sources at location
3. Validate in schema

**Risk Mitigation:**
- [ ] Update location schema
- [ ] Test each fuel source type
- [ ] Update existing system JSONs

**Scope:** 2hr

---

## AR-73: MULTISYSTEM-TRAVEL1 Use Case
**Priority:** HIGH (integration test for journey)
**Source:** prompts_for_TODOS_v68.txt line 22
**Risk:** MEDIUM → Depends on AR-70/71/72
**Dependencies:** AR-68, AR-70, AR-71, AR-72

**Description:** Full multi-system journey puppeteer test with screenshots.

**Journey:**
```
Flammarion Highport → Undock → Jump Point → Jump to 567-908 →
Verify Position → Fly to orbit → Land (water) →
Wilderness refuel → Fuel process → Fly to Jump Point →
Jump to Bowman → Fly to Gas Giant → Fuel skim →
Fuel process → Jump to Flammarion → Dock at Highport → Refuel (refined)
```

**Implementation:**
1. Multi-browser puppeteer (Pilot, Astrogator, Engineer)
2. Screenshot at each major step
3. Assert state changes after each action
4. Save final screenshots to `tests/e2e/screenshots/`

**Risk Mitigation:**
- [ ] Complete dependencies first
- [ ] Build incrementally (partial journey → full journey)
- [ ] Existing `journey-test.js` as starting point

**Scope:** 6hr (after dependencies)

---

## AR-74: Sensor Scan Use Case
**Priority:** MEDIUM (proves AR-70)
**Source:** prompts_for_TODOS_v68.txt line 14-15
**Risk:** LOW → Uses AR-70 infrastructure
**Dependencies:** AR-70, AR-71

**Description:** Two-browser test: Pilot + Sensor Operator scan unknown objects.

**Journey:**
```
Ship at Jump Exit → Multiple unknown objects visible →
Sensor scans each object → Info revealed →
One object is derelict spacecraft → Pilot flies to it →
Close-range Deep Scan reveals more details
```

**Implementation:**
1. Seed system with unknown objects at Jump Exit
2. Puppeteer: Sensor operator scans all objects
3. Assert info revealed matches scan type
4. Pilot travels to derelict
5. Screenshot before/after scans

**Scope:** 3hr (after AR-70/71)

---

## AR-75: Shooting Use Case - Target Practice
**Priority:** LOW (combat integration)
**Source:** prompts_for_TODOS_v68.txt line 28
**Risk:** MEDIUM → Combat system integration
**Dependencies:** AR-71

**Description:** Gunner destroys target asteroid with laser fire.

**Journey:**
```
Ship jumps into system → Pilot flies to destination →
Objects visible → Pilot flies to optimal laser range →
Gunner fires laser at asteroid → ~10 hits destroys it →
Pilot flies to orbit
```

**Implementation:**
1. Add "Target Asteroid" object type
2. Object has hull points (~10)
3. Gunner can target and fire
4. Object destroyed when HP = 0
5. Puppeteer test with Pilot + Gunner browsers

**Risk Mitigation:**
- [ ] Verify existing combat code can target objects (not just ships)
- [ ] Test object destruction state sync

**Scope:** 4hr

---

## AR-76: System Map Technical Documentation
**Priority:** LOW (knowledge capture)
**Source:** prompts_for_TODOS_v68.txt line 17
**Risk:** LOW → Documentation only

**Description:** Document system-map.js architecture for future development.

**Deliverables:**
1. How canvas rendering works
2. Data structures (celestialObjects, locations, ship position)
3. Animation/movement system
4. Event handling (click, pan, zoom)
5. Integration points with app.js

**Scope:** 1hr

---

## Risk Mitigations

### AR-67: hailContact Bug (LOW → LOW)
**Tests:**
- [ ] `tests/operations/captain-hail.test.js` - Unit test hailContact calls
- [ ] `tests/e2e/smoke/captain-panel.smoke.js` - Click Hail button, no JS error

### AR-68: Verify Position (LOW → LOW)
**Tests:**
- [ ] `tests/operations/astrogation.test.js` - Add `positionVerified` state after jump exit
- [ ] `tests/operations/pilot-travel.test.js` - Block travel when `positionVerified: false`
- [ ] Puppeteer: Click "Verify Position", LED turns green

### AR-69: Von Sydo Data (LOW → LOW)
**Tests:**
- [ ] `tests/operations/character-validation.test.js` - Validate PC JSON structure
- [ ] `tests/e2e/smoke/player-join.smoke.js` - All PCs appear in slot list

**UQ:** What is Observer Role's panel content? Blank? Basic ship stats only?

### AR-70: Sensor Scans (MED → LOW)
**Tests:**
- [ ] `tests/operations/sensors-scan.test.js` - Passive/Active/Deep rolls
- [ ] Test skill modifiers: Passive -2, Active 0, Deep +2
- [ ] Test info reveal based on Effect
- [ ] Puppeteer: Click scan button, LED changes color

**UQ:** Do you have access to Mongoose Traveller sensor rules, or should I use standard +2/-2 modifiers?

### AR-71: Objects on Map (HIGH → LOW) ✓ PLAN COMPLETE
**Tests:**
- [ ] `tests/operations/contact-map.test.js` - Unit test `contactToMapObject()` conversion
- [ ] `tests/e2e/smoke/system-map-contacts.smoke.js` - Contacts visible on canvas

**UQ Resolution:** Hybrid animation - contacts can orbit bodies using existing orbital math. Stateless relative positions converted to absolute AU coordinates. Zero changes to existing code.

### AR-72: Fuel Sources (LOW → LOW)
**Tests:**
- [ ] `tests/operations/fuel-sources.test.js` - Gas giant, wilderness, starport sources
- [ ] Validate schema: `fuelSource.type`, `fuelSource.fuelType`
- [ ] Test hydrographics > 0 requirement for wilderness

### AR-73: Full Journey (MED → LOW)
**Tests:**
- [ ] Extend existing `tests/e2e/journey-test.js`
- [ ] Screenshot assertions at each step
- [ ] Run only after AR-68/70/71/72 complete

### AR-74: Sensor Scan Use Case (LOW → LOW)
**Tests:**
- [ ] Reuse AR-70 infrastructure
- [ ] Puppeteer test with Pilot + Sensor browsers

### AR-75: Shooting (MED → LOW)
**Tests:**
- [ ] `tests/operations/combat-objects.test.js` - Verify combat can target non-ship objects
- [ ] Test object HP deduction
- [ ] Test object destruction at HP=0

**UQ:** Can existing combat system target objects, or is it ship-only?

### AR-76: Docs (LOW → LOW)
No tests needed - documentation only.

---

## Risk Summary (Post-Mitigation)

| AR | Title | Before | After | Key Mitigation |
|----|-------|--------|-------|----------------|
| AR-67 | hailContact | LOW | LOW | 2 tests |
| AR-68 | Verify Position | LOW | LOW | 3 tests |
| AR-69 | Von Sydo | LOW | LOW | 2 tests + UQ |
| AR-70 | Sensor Scans | MED | LOW | 4 tests + UQ |
| AR-71 | Objects on Map | HIGH | **LOW** | Plan complete, 2 tests |
| AR-72 | Fuel Sources | LOW | LOW | 3 tests |
| AR-73 | Full Journey | MED | LOW | Extend existing test |
| AR-74 | Scan Use Case | LOW | LOW | Reuse AR-70 |
| AR-75 | Shooting | MED | LOW | 3 tests + UQ |
| AR-76 | Docs | LOW | LOW | None |

---

## User Answers (Resolved)

1. **AR-69:** Observer Role = **Full view mode** (see everything, no action buttons)
2. **AR-70:** Check `reference/rules/MgT 2E - Core Rulebook.pdf` first. If silent, use +2/-2 defaults with tooltip disclaimer.
3. **AR-71:** **Hybrid animation** - Objects move relative to fixed reference points (e.g., Jump Space Exit). Requires plan mode analysis for best long-term approach.
4. **AR-75:** Ships can **target anything** with HP. Investigate which object types are valid/meaningful targets (asteroid=yes, star=no).

---

## Recommended Execution Order

1. **AR-67** (30min) - Fix JS error, unblocks hail
2. **AR-68** (2hr) - Verify Position, adds gameplay depth
3. **AR-72** (2hr) - Fuel sources, enables wilderness refuel
4. **AR-70** (4hr) - Sensor scans, core gameplay
5. **AR-71** (6hr) - Objects on map, HIGH risk - do carefully
6. **AR-73** (6hr) - Full journey test, proves everything works
7. **AR-74** (3hr) - Scan use case
8. **AR-75** (4hr) - Shooting, optional
9. **AR-69** (2hr) - Von Sydo fix, low priority
10. **AR-76** (1hr) - Docs, whenever convenient

**Total:** ~32hr of work
