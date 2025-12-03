# AR-15: Role Polish & UX

**Created:** 2025-12-03 | **Revised:** 2025-12-03
**Status:** MOSTLY COMPLETE (9/10 stages done)
**Est:** 14-18h | **Actual:** ~4h (much pre-existing code)
**Risk:** LOW | **Value:** HIGH | **Priority:** P1

## Overview
Consolidates all manual testing TODOs from 2025-12-03 session.
Focus: Tooltips, role enhancements, UI polish, bug fixes.

---

## Stage 15.1: Tooltip Infrastructure ✅ COMPLETE (PRE-EXISTING)

Already implemented in `public/operations/modules/tooltips-strategy.js`:
- `simple(el, text)` - native title
- `rich(el, content)` - custom div
- `choose(complexity)` - auto-select
- Performance tracking with 16ms threshold

---

## Stage 15.2: Native Tooltips ✅ COMPLETE

Added title attributes to:
- All bridge header buttons
- Campaign creation buttons
- Player slot buttons
- Session start button
- Role panel buttons
- Map controls (size, style, range selectors)

---

## Stage 15.3: Custom Rich Tooltips - PENDING

| Task | Est | Deliverable |
|------|-----|-------------|
| Ship card tooltip template | 30m | Mini ship stats |
| Character sheet tooltip template | 20m | PC/NPC info |
| CSS for tooltip styling | 10m | Match UI theme |
| Weapon tooltip with stats | 15m | Damage, range |
| System tooltip with status | 15m | Health, power |

---

## Stage 15.4: Gunner Weapon Selector ✅ COMPLETE (PRE-EXISTING)

Already implemented in role-panels.js:
- Weapon type dropdown in Gunner panel (lines 429-444)
- Populated from ship.weapons array
- Active weapon indicator

---

## Stage 15.5: Gunner Fire Control ✅ COMPLETE (PRE-EXISTING)

Already implemented:
- Multiple weapon types including missiles
- Ammo tracking display
- Fire socket events
- Authorization status (Weapon Free/Hold Fire)

---

## Stage 15.6: Gunner Hit Probability ✅ COMPLETE (PRE-EXISTING)

Already implemented in role-panels.js (lines 355-376):
- Hit probability calculation via combat engine
- Displayed on FIRE button
- Modifier breakdown (range, skill, etc.)

---

## Stage 15.7: Astrogator Map Controls ✅ COMPLETE

Implemented in app.js (lines 2823-2911):
- `setMapSize()` - size control with 4 options
- Mouse drag to pan
- Keyboard arrows to pan (when container focused)
- Size dropdown (small/med/large/full)
- LocalStorage persistence (`ops-map-size`)

CSS already had overflow:auto and size variants.

---

## Stage 15.8: Astrogator Jump Validation ✅ COMPLETE (PRE-EXISTING)

Already implemented in role-panels.js (lines 738, 868):
- Jump distance vs ship capability check
- Green/red indicator based on fuel availability
- JUMP blocked if invalid (disabled button)

---

## Stage 15.9: UI Polish Items ✅ COMPLETE

Implemented:
- POWER color gradient (green→yellow→red) - dynamic backgroundPosition
- HULL color gradient (same treatment)
- Fullscreen toggle button (⛶ in header)
- Fullscreen API integration (toggleBrowserFullscreen)
- Panel expand/collapse already existed

---

## Stage 15.10: Role System Bug Fixes ✅ MOSTLY COMPLETE

Implemented:
- Descriptive tooltip "Relieve [NAME] from [ROLE]"
- State sync after relieve verified working
- Relieve/assign buttons working correctly

Not implemented (lower priority):
- `ops:requestRole` socket event (polite role request)
- E2E tests for role bugs (existing tests cover basics)

---

## Files Modified

- `public/operations/app.js`
  - Added setMapSize(), restoreMapSize(), initMapInteractions()
  - Added toggleBrowserFullscreen()
  - Updated renderShipStatus() with dynamic gradient positions
  - Updated relieve button tooltip
- `public/operations/index.html`
  - Added fullscreen toggle button
  - Added tooltips to buttons
- CSS already had required styles

---

## Dependencies
- AR-14.7 complete ✅

## Acceptance Criteria
- [x] All tooltips functional with < 16ms render
- [x] Gunner can switch weapons and fire missiles
- [x] Astrogator map scales and validates jumps
- [x] UI polish items complete (power gradient, fullscreen)
- [x] Role bugs fixed (descriptive relieve tooltip)
- [ ] Custom rich tooltips (Stage 15.3) - deferred

## Notes
- Much of AR-15 was already implemented in previous ARs
- Actual time: ~4 hours due to pre-existing code
- Stage 15.3 (rich tooltips) deferred - native tooltips sufficient for MVP
