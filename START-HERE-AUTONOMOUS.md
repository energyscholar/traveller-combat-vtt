# 🤖 AUTONOMOUS WORK SESSION - START HERE

**Date:** 2025-11-13
**Mode:** Autonomous (bypass permissions enabled)
**Goal:** Complete 20+ autonomous tasks from NEXT-SESSION-PLAN.md

---

## ⚡ IMMEDIATE ACTIONS

### 1. Fix V2 Template Validation Errors (BLOCKING)
**Priority:** CRITICAL - Tests are failing
**Time:** 10 minutes

Fix these 3 files in `data/ships/v2/`:
- `scout.json` - Add: type, tonnage, thrust, turrets
- `free_trader.json` - Add: type, tonnage, thrust, turrets, fix role 'merchant' → 'trading'
- `far_trader.json` - Add: type, tonnage, thrust, turrets, fix role 'merchant' → 'trading'

**Verify:** Run `npm test` - should pass 161+ tests

---

## 📋 AUTONOMOUS TASK LIST (Priority 1)

Complete all tasks from `.claude/NEXT-SESSION-PLAN.md` Priority 1 section:

### A. Component Validation Modules (3-4 hours)
Create 7 new validation modules in `lib/`:

1. ✅ `lib/ship-jump-drive.js` (DONE - 32 tests passing)
2. ⏳ `lib/ship-manoeuvre-drive.js` (30+ tests)
3. ⏳ `lib/ship-power-plant.js` (25+ tests)
4. ⏳ `lib/ship-sensors.js` (20+ tests)
5. ⏳ `lib/ship-bridge.js` (15+ tests)
6. ⏳ `lib/ship-staterooms.js` (15+ tests)
7. ⏳ `lib/ship-weapons.js` (30+ tests)
8. ⏳ `lib/ship-armour.js` (20+ tests)

**Data Source:** `.claude/EXTRACTED-SHIP-DATA.md` has all formulas
**Pattern:** Follow `lib/ship-jump-drive.js` structure (validation + tests)

### B. Additional Ship Templates (2-3 hours)
Create 4 new V2 templates in `data/ships/v2/`:

9. ⏳ `patrol_corvette.json` (400t military vessel)
10. ⏳ `mercenary_cruiser.json` (800t sphere hull)
11. ⏳ `subsidised_liner.json` (600t passenger)
12. ⏳ `safari_ship.json` (200t luxury exploration)

**Data Source:** `.claude/EXTRACTED-SHIP-DATA.md` has complete specs
**Schema:** Use `data/ships/v2/ship-template-v2.schema.json`

### C. Data Extraction & Documentation (2 hours)

13. ⏳ Extract remaining component specs (fuel scoops, processors, workshops, medical, labs, cargo equipment, drones)
14. ⏳ Create component cost reference document
15. ⏳ Write V1→V2 migration guide

### D. Testing & Validation (1-2 hours)

16. ⏳ Create integration tests for complete ship validation
17. ⏳ Validate Scout against High Guard specs
18. ⏳ Validate Free Trader against specs
19. ⏳ Create master validation helper function
20. ⏳ Add JSON schema validation to test suite

### E. Code Organization (1 hour)

21. ⏳ Create `lib/index.js` (export all modules)
22. ⏳ Create `lib/validators/index.js` (export all validators)
23. ⏳ Add JSDoc documentation to all public functions
24. ⏳ Create developer guide for adding components/templates

---

## 🎯 SUCCESS CRITERIA

When complete, you should have:

- ✅ All tests passing (350+ tests total)
- ✅ 7 new validation modules with 155+ tests
- ✅ 4 new ship templates (V2 format)
- ✅ Complete component data extraction
- ✅ Integration tests for ship validation
- ✅ Documentation and guides
- ✅ Clean git history with descriptive commits

---

## 📚 KEY REFERENCE FILES

### Planning & Specs
- `.claude/NEXT-SESSION-PLAN.md` - Complete autonomous task list
- `.claude/EXTRACTED-SHIP-DATA.md` - All High Guard formulas & specs
- `.claude/STAGE-12-FINALIZED-PLAN.md` - Stage 12 complete plan
- `.claude/STAGE-12-QUICKSTART.md` - Stage 12 context

### Data & Schema
- `data/ships/v2/ship-template-v2.schema.json` - V2 template schema
- `data/ships/v2/README.md` - Template documentation
- `data/ships/v2/scout.json` - Example V2 template (FIX FIRST!)

### Existing Patterns
- `lib/ship-jump-drive.js` - Pattern for validation modules (WORKING EXAMPLE)
- `tests/unit/ship-jump-drive.test.js` - Pattern for tests (32 tests)

---

## 🚨 IMPORTANT REMINDERS

1. **DO NOT ASK FOR PERMISSIONS** - User started you with `--permission-mode bypassPermissions`
2. **FIX V2 TEMPLATES FIRST** - Tests must pass before starting new work
3. **FOLLOW EXISTING PATTERNS** - Use ship-jump-drive.js as template
4. **WRITE TESTS FIRST** - TDD approach (test before implementation)
5. **COMMIT FREQUENTLY** - One feature per commit with descriptive messages
6. **USE TODO LIST** - Track progress with TodoWrite tool
7. **INTEGER CREDITS** - All costs as integers (avoid floating point)
8. **BRITISH SPELLING** - "armour" not "armor", match Traveller rules
9. **NO USER DECISIONS** - Only do autonomous tasks, skip anything requiring user input

---

## 📊 EXPECTED TIME

- **Validation Modules:** 3-4 hours (7 modules + tests)
- **Ship Templates:** 2-3 hours (4 templates + validation)
- **Documentation:** 2 hours (extraction + guides)
- **Testing:** 1-2 hours (integration tests)
- **Organization:** 1 hour (indexes + JSDoc)

**Total:** 8-10 hours of focused work

---

## 🎬 START COMMAND

When user says: **"Complete all autonomous tasks"**

Your first response should be:
1. Read this file
2. Create TodoWrite list with all 24 tasks
3. Fix V2 template validation errors
4. Run `npm test` to verify
5. Start on validation modules (A1-A7)
6. Work through list systematically
7. Commit after each major milestone
8. Report progress every 3-4 tasks

---

## 📝 WHAT TO SKIP (Requires User Decisions)

**DO NOT do these tasks** - they need user input:

- Task #21-27 from Priority 2 (UI/UX decisions)
- SVG generation strategy
- Template migration approach
- Real-time validation timing
- Data storage strategy

**Focus ONLY on Priority 1 tasks (items #1-20)**

---

## ✅ FINAL CHECKLIST

Before reporting completion:

- [ ] All 24 autonomous tasks complete
- [ ] `npm test` shows 350+ tests passing
- [ ] All new files have tests
- [ ] Git commits are descriptive
- [ ] No console errors in validation
- [ ] Documentation updated
- [ ] TodoWrite list shows all tasks completed
- [ ] Summary report written

---

## 🎯 SUCCESS MESSAGE

When done, report:

```
✅ AUTONOMOUS WORK SESSION COMPLETE

Completed:
- 7 validation modules (155+ tests)
- 4 ship templates (V2 format)
- Complete component data extraction
- Integration tests
- Documentation & guides

Results:
- Tests: 350+ passing (was 161)
- New LOC: ~2,500 production, ~1,200 test
- Git commits: [N] descriptive commits
- Zero regressions

Ready for user review and Stage 12.4 Part 2 (UI integration).
```

---

**STATUS:** Ready to start
**NEXT:** Fix V2 templates, then run autonomous task list
**ESTIMATED COMPLETION:** 8-10 hours

**GO! 🚀**
