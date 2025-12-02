# Technical Debt Registry

**Created:** 2025-12-01
**Last Updated:** 2025-12-01

## Purpose
Track technical debt discovered during development. Prioritized for future cleanup autoruns.

---

## HIGH Priority (Blocks Features)

*None currently identified*

---

## MEDIUM Priority (Code Health)

### TD-001: lib/combat.js is 1670 LOC
**Location:** `lib/combat.js`
**Impact:** Hard to navigate, test, and maintain
**Recommendation:** Split into focused modules:
- `lib/combat/resolution.js` - Attack resolution, damage calculation
- `lib/combat/grid.js` - Hex grid, distance, line of sight
- `lib/combat/ships.js` - Ship data, crew management
- `lib/combat/initiative.js` - Turn order, initiative rolls
- `lib/combat/maneuvers.js` - Pilot actions (aid gunners, evasive)
- `lib/combat/jump.js` - Jump mechanics
**Effort:** ~4 hours (straightforward extraction)
**Blocked By:** Nothing
**Defer To:** Post AR-12 (after combat integration stable)

### TD-002: Duplicate range band definitions
**Location:**
- `lib/combat.js` lines 1481-1489 (RANGE_BANDS)
- `lib/operations/contacts.js` lines 12-20 (RANGE_BANDS)
**Impact:** Risk of drift, confusing
**Recommendation:** Single source of truth in `lib/shared/constants.js`
**Effort:** ~1 hour
**Blocked By:** Nothing
**Defer To:** AR-10 Stage 10.5

---

## LOW Priority (Nice to Have)

### TD-003: SHIPS constant in lib/combat.js
**Location:** `lib/combat.js` lines 39-88
**Impact:** Hardcoded ship data, should come from ship registry
**Recommendation:** Migrate to use `getRegistry()` from `lib/ship-registry.js`
**Effort:** ~2 hours
**Blocked By:** Ship registry completeness
**Defer To:** Post AR-12

### TD-004: Magic numbers in combat code
**Location:** Various in `lib/combat.js`
**Impact:** Hard to understand attack target (8), range penalties, etc.
**Recommendation:** Extract to `data/rules/combat-rules.json` (some already there)
**Effort:** ~2 hours
**Blocked By:** Nothing
**Defer To:** Future cleanup pass

### TD-005: Client TypeScript in React, server in vanilla JS
**Location:** `client/src/` vs `lib/`
**Impact:** Context switching, no shared types
**Recommendation:** Consider shared types package or JSDoc annotations
**Effort:** ~8 hours (optional)
**Blocked By:** Decision on TypeScript migration
**Defer To:** Post v1.0

---

## DOCUMENTATION Debt

### TD-006: Rules extracted from Mongoose Traveller
**Location:** `data/rules/combat-rules.json` and inline comments
**Impact:** Rules are summarized; full PDFs available on request
**Note:** Original Mongoose Traveller rulebooks available if deeper rule integration needed
**Action:** No action needed - documented for reference

---

## Resolved

*Items moved here after cleanup*

---

## Priority Matrix

| Priority | Count | Est. Total Hours |
|----------|-------|------------------|
| HIGH | 0 | 0 |
| MEDIUM | 2 | 5 |
| LOW | 3 | 12 |
| DOC | 1 | 0 |

**Total Debt:** ~17 hours (non-blocking)
