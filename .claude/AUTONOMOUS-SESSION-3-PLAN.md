# Autonomous Session 3 - Expanded Scope Plan

**Created:** 2025-11-13
**Status:** PLANNING
**Approach:** Maximum safe work per autonomous push
**Estimated Duration:** 12-15 hours total

---

## 🎯 SESSION GOALS

**Primary:** Complete as much SAFE work as possible in single autonomous session
**Secondary:** Identify issues, document for later phases
**Philosophy:** High confidence in Claude's implementation quality = larger autonomous pushes

---

## 📋 WORK STREAMS

### 1. SMALL CRAFT TEMPLATES (Priority: HIGH, Safe: YES)

**Goal:** Add 3 small craft templates to V2 system

**Templates to Create:**
1. **Pinnace** (40t, multipurpose shuttle)
2. **Gig** (20t, light shuttle)
3. **Tlatl Missile Fighter** (10t, military fighter)

**Tasks:**
- [ ] Research specifications from High Guard 2022
- [ ] Create JSON templates (data/ships/v2/small_craft/)
- [ ] Validate against ship-*.js modules
- [ ] Add to ship-templates.html viewer
- [ ] Update validation script to include small craft
- [ ] Document in EXTRACTED-SHIP-DATA.md

**Justification:** Tuesday group uses Sub Liner as base ship (carries small craft). These will get playtesting.

**Estimated Time:** 3-4 hours

**Success Criteria:**
- ✅ 3 new small craft JSON files
- ✅ All validate with validateCompleteShip()
- ✅ Display correctly in ship-templates.html
- ✅ Documentation updated
- ✅ Zero test regressions

---

### 2. RULES VERIFICATION SWEEP (Priority: HIGH, Safe: MIXED)

**Goal:** Verify Mongoose Traveller 2E High Guard 2022 rules implementation

**Focus Areas:**

#### A. Initiative & Phase Rules (User suspects issues)
- [ ] Review High Guard initiative rules (p. XX)
- [ ] Check current implementation in space-initiative.js
- [ ] Identify discrepancies
- [ ] **FIX EASY:** Safe, obvious corrections
- [ ] **DEFER MEDIUM/HARD:** Document for later

**Specific checks:**
- 2D6 + Pilot skill + Thrust rating (correct?)
- Tactics roll for captain bonus (correct?)
- Turn order sorting (correct?)
- Initiative ties (how handled?)

#### B. Ship Combat Rules
- [ ] Attack resolution (to-hit calculation)
- [ ] Damage application (armor, hull)
- [ ] Range band modifiers (DMs correct?)
- [ ] Weapon characteristics (damage dice, range limits)
- [ ] Critical hit thresholds (25%, 50%, 75% correct?)

#### C. Component Validation Rules
- [ ] Drive tonnage formulas (jump, maneuver)
- [ ] Power plant calculations
- [ ] Fuel requirements (jump + power plant)
- [ ] Armor tonnage (Crystaliron, Titanium Steel formulas)
- [ ] Bridge requirements (by tonnage)
- [ ] Cost calculations (all components)

**Approach:**
1. **Quick pass:** Identify obvious issues (1-2 hours)
2. **Easy fixes:** Safe corrections only (2-3 hours)
3. **Medium fixes:** Safe, low-risk improvements (2-3 hours)
4. **Defer hard fixes:** Document for later sprint

**Estimated Time:** 5-8 hours (depending on findings)

**Success Criteria:**
- ✅ Rules verification report created
- ✅ Easy fixes implemented (zero risk)
- ✅ Medium fixes implemented (low risk, safe)
- ✅ Hard fixes documented for later
- ✅ All tests still passing
- ✅ No regressions

---

### 3. TEST COVERAGE EXPANSION (Priority: MEDIUM, Safe: YES)

**Goal:** Add comprehensive test coverage for new ship templates code

#### A. Unit Tests for ship-templates.js
- [ ] Test loadTemplates() function
  - Success case (all templates load)
  - Partial failure (some templates fail)
  - Complete failure (no templates load)
  - Network error handling
- [ ] Test getStatusClass() power validation logic
  - Ships with jump deficit
  - Ships with normal power management
  - Ships with power surplus
- [ ] Test calculateTonnageUsed()
  - All component types included
  - Missing components handled
  - Edge cases (null, undefined)
- [ ] Test renderTable()
  - Safe property access
  - Empty template array
  - Malformed template data
- [ ] Test renderTemplateDetails()
  - Complete template
  - Incomplete template (missing sections)
  - Null/undefined handling

#### B. Integration Tests
- [ ] Template loading from server
- [ ] Table rendering with real data
- [ ] Click interactions (row selection)
- [ ] Detail view expansion
- [ ] Error state display
- [ ] Loading state display

**File:** Create `tests/ship-templates.test.js`

**Estimated Time:** 2-3 hours

**Success Criteria:**
- ✅ 20+ new tests added
- ✅ All tests passing
- ✅ Code coverage >80% for ship-templates.js
- ✅ Edge cases covered

---

### 4. EDGE CASE IDENTIFICATION (Priority: MEDIUM, Safe: YES)

**Goal:** Sweep for missing edge cases, add defensive code

**Areas to Check:**
- [ ] Template loading: What if JSON is malformed?
- [ ] Template loading: What if server returns 404?
- [ ] Template loading: What if server returns 500?
- [ ] Rendering: What if template missing required fields?
- [ ] Rendering: What if nested properties are null?
- [ ] Rendering: What if arrays are empty?
- [ ] Rendering: What if numeric values are strings?
- [ ] Power validation: What if powerRequirements is missing?
- [ ] Power validation: What if individual fields are missing?
- [ ] Tonnage calculation: What if components have no tonnage field?

**For Each Edge Case:**
1. Document the scenario
2. Add defensive code (try/catch, null checks, fallbacks)
3. Add test case
4. Verify no regression

**File:** Update `.claude/EDGE-CASES-SHIP-TEMPLATES.md`

**Estimated Time:** 1-2 hours

**Success Criteria:**
- ✅ Edge cases document created
- ✅ Defensive code added for all identified cases
- ✅ Tests added for edge cases
- ✅ All tests passing

---

### 5. REFACTORING OPPORTUNITIES (Priority: LOW, Safe: DOCUMENT ONLY)

**Goal:** Identify refactoring needs, document for later

**Areas to Review:**
- [ ] Code duplication in renderHullGroup, renderAccommodations, etc.
- [ ] Magic numbers (power calculations, tonnage formulas)
- [ ] Repeated null checks (could use helper functions)
- [ ] Component rendering pattern (DRY violation?)
- [ ] Validation logic (split into separate module?)

**Approach:**
- **DO:** Document opportunities
- **DO:** Estimate effort/risk
- **DO:** Prioritize by impact
- **DON'T:** Execute refactoring (defer to later sprint)

**File:** Create `.claude/REFACTORING-OPPORTUNITIES.md`

**Estimated Time:** 1 hour

**Success Criteria:**
- ✅ Refactoring opportunities documented
- ✅ Effort/risk estimates added
- ✅ Prioritization complete
- ✅ No code changes (document only)

---

## ⏱️ TIME BREAKDOWN

| Work Stream | Min Time | Max Time |
|-------------|----------|----------|
| 1. Small craft templates | 3h | 4h |
| 2. Rules verification | 5h | 8h |
| 3. Test coverage | 2h | 3h |
| 4. Edge cases | 1h | 2h |
| 5. Refactoring docs | 1h | 1h |
| **TOTAL** | **12h** | **18h** |

**Target:** 12-15 hours (realistic autonomous session)

---

## 🎯 SUCCESS CRITERIA

**Must Have:**
- ✅ All 3 small craft templates created and validated
- ✅ Rules verification report completed
- ✅ Easy + medium rule fixes implemented
- ✅ 20+ new tests added
- ✅ All 161+ existing tests passing
- ✅ Edge cases identified and addressed
- ✅ Refactoring opportunities documented

**Nice to Have:**
- ✅ Additional small craft beyond the 3 required
- ✅ More comprehensive rules verification
- ✅ >90% code coverage on ship-templates.js
- ✅ Automated browser testing (Playwright/Puppeteer)

---

## 🚫 OUT OF SCOPE

**Deferred to Later Sprints:**
- Card grid layout (defer to Phase 2)
- Detail slider (Simple/Standard/Technical modes)
- Editing capabilities (defer to Phase 3)
- localStorage persistence (defer to Phase 3)
- Ship library management (defer to Phase 3)
- JSON export/import (defer to Phase 3)
- Full builder UI (defer to Phase 4)
- Hard/risky refactoring
- Non-safe rule fixes

---

## 📝 DELIVERABLES

**New Files:**
- `data/ships/v2/small_craft/pinnace.json`
- `data/ships/v2/small_craft/gig.json`
- `data/ships/v2/small_craft/tlatl.json`
- `tests/ship-templates.test.js`
- `.claude/RULES-VERIFICATION-REPORT.md`
- `.claude/EDGE-CASES-SHIP-TEMPLATES.md`
- `.claude/REFACTORING-OPPORTUNITIES.md`

**Modified Files:**
- `public/ship-templates.js` (edge case handling, fixes)
- `test-ship-templates.js` (add small craft validation)
- `.claude/EXTRACTED-SHIP-DATA.md` (small craft specs)
- Test suite files (new tests)

**Documentation:**
- Rules verification findings
- Easy/medium fixes implemented
- Hard fixes documented for later
- Edge cases addressed
- Refactoring roadmap

---

## 🔄 ROLLBACK STRATEGY

**If Session Fails:**
1. All new small craft files can be deleted (zero impact)
2. All new test files can be deleted (zero impact)
3. Git revert any modified files
4. Documentation changes are safe (no code impact)

**Git Safety:**
- Commit after each work stream completes
- Tag before starting risky work
- Can rollback to any intermediate commit

---

## ✅ PRE-FLIGHT CHECKLIST

**Before Starting Autonomous Session:**
- [ ] All current tests passing (161/161)
- [ ] Git status clean (committed ship templates work)
- [ ] High Guard 2022 PDF accessible
- [ ] EXTRACTED-SHIP-DATA.md available
- [ ] Validation tools working (test-ship-templates.js)
- [ ] Server running (for integration tests)

---

## 🎯 POST-SESSION DELIVERABLE

**Completion Report:** `.claude/AUTONOMOUS-SESSION-3-COMPLETION-REPORT.md`

**Should Include:**
- Work completed (hours per stream)
- Tests added/passing
- Rules issues found/fixed/deferred
- Small craft created
- Edge cases addressed
- Refactoring opportunities documented
- Recommendations for next session

---

**STATUS:** ✅ PLAN COMPLETE - Ready for approval and execution
**Next Step:** User approval, then GO for autonomous session

---

## 📌 SPECIAL NOTES

### Subsidized Liner Context
- Tuesday group's main ship (converted Sub Liner)
- Will receive heavy playtesting
- Has real jump power deficit (correctly identified)
- Group will likely upgrade power plant before use
- Two-turn jump prep in combat (important mechanic)

### Small Craft Context
- Carried by larger ships (Sub Liner, etc.)
- Pinnace: General purpose shuttle (boarding, cargo, personnel)
- Gig: Light shuttle (ship-to-ship, ship-to-surface)
- Tlatl: Military fighter (missile boat, interceptor)
- These will be used in actual gameplay

### Rules Verification Priority
1. **Initiative** (user suspects issues) - HIGH
2. **Ship combat** (core mechanic) - HIGH
3. **Component validation** (already working) - MEDIUM
4. **Edge cases** (defensive) - MEDIUM

---

**Autonomous Session 3: Maximum Safe Work**
**Confidence Level:** HIGH (based on Session 1 & 2 success)
**Risk Level:** LOW (safe work only, comprehensive testing)
**Expected Value:** HIGH (multiply force, stack work efficiently)
