# TRAVELLER COMBAT VTT - STAGE PLAN
# Token-Optimized TDD Roadmap
**Target:** 70k tokens/stage | **Updated:** 2025-11-02

## TOKEN OPTIMIZATION STRATEGY

**Budget per Stage: 70,000 tokens** (new target, down from 90k)
- Write tests FIRST: ~15k tokens (21%) - TDD approach
- Implementation: ~35k tokens (50%)
- Testing/fixes: ~10k tokens (14%)
- Git/handoff: ~10k tokens (14%)

**Why 70k?**
- Stages 4-5 averaged 75k tokens (can optimize to 70k)
- Uses 35% of 200k budget, leaves 65% buffer
- TDD reduces debugging cycles → saves tokens
- Focused file reads → no exploration

**Test-Driven Development (TDD) Approach:**
1. Write all 20 tests FIRST (before any implementation)
2. Tests define requirements precisely
3. Implement to make tests pass
4. Reduces debugging/iteration cycles
5. No "exploring" or "planning" - tests ARE the plan

---

## COMPLETED STAGES ✅

| Stage | Purpose | Tokens | Tests | Status |
|-------|---------|--------|-------|--------|
| 0.5 | Socket.io spike | ~5k | 0 | ✅ |
| 1 | Hello world sync | ~10k | 0 | ✅ |
| 2 | Combat math | ~15k | 7 | ✅ |
| 3 | Multiplayer | ~118k | 28 | ✅ |
| 4 | Turn system | ~78k | 44 | ✅ |
| 5 | Weapons/ammo | ~72k | 64 | ✅ |

**Current Test Count:** 64/64 passing
**Next Stage:** 6 (Crew System)

---

## STAGE 6: CREW SYSTEM 🎯 NEXT
**Target:** 70k tokens | **Time:** 3-4 hours | **Difficulty:** Hard

### QUICK START COMMAND
```
"Implement Stage 6: Crew System. See STAGE-PLAN.md lines 60-95.
Read only: lib/combat.js, .claude/handoffs/HANDOFF-STAGE-5-COMPLETE.md
Target: 70k tokens. TDD: Write 20 crew tests FIRST, then implement."
```

### Features
- Crew roster (Pilot, Gunner, Engineer per ship)
- Character sheets (Name, Skills: Pilot/Gunner/Engineering)
- Role assignment to stations
- Skill bonuses: Pilot +init, Gunner +attack, Engineer repairs
- Crew damage/injuries (reduced effectiveness)

### Crew Roles
- **Pilot:** +skill to initiative rolls (dodge in future)
- **Gunner:** +skill to attack rolls
- **Engineer:** Can repair hull (1d6 HP per action)

### Technical Scope
- **lib/combat.js:** Add CREW data structure, skill modifiers to resolveAttack()
- **server.js:** Crew assignment, damage tracking, repair actions
- **public/index.html:** Crew roster UI, role assignment
- **tests/unit/crew-system.test.js:** NEW - 20 tests (write FIRST)

### TDD Test Breakdown (20 tests)
1. Crew skill application (8 tests): gunner +attack, pilot +init, engineer repair
2. Role assignment (6 tests): assign/unassign crew, invalid roles
3. Crew damage (6 tests): damage reduces skills, death, healing

### Success Criteria
- Gunner skill adds to attack rolls
- Pilot skill adds to initiative
- Engineer can repair hull (1d6 per turn)
- Crew damage reduces skill effectiveness
- 84/84 tests passing (64 + 20 new)

---

## STAGE 7: MOVEMENT & POSITIONING
**Target:** 70k tokens | **Time:** 3-4 hours | **Difficulty:** Hard

### QUICK START COMMAND
```
"Implement Stage 7: Movement. See STAGE-PLAN.md lines 97-125.
Read only: lib/combat.js, server.js (gameState), latest handoff.
Target: 70k tokens. TDD: Write 20 grid tests FIRST, then implement."
```

### Features
- 10x10 hex grid (SVG rendering)
- Ship positioning, movement points (Scout: 3, Corsair: 2)
- Range auto-calculated from hex distance
- Line of sight checks
- Movement phase before combat

### Grid Mechanics
- 1 hex = 1 range band
- Range bands: Adjacent (0-1), Close (2-3), Medium (4-5), Long (6-7), Very Long (8+)

### Technical Scope
- **lib/combat.js:** Add hex distance calculation, LOS checks
- **server.js:** Position tracking, movement validation, range calculation
- **public/index.html:** SVG hex grid, click-to-move
- **tests/unit/grid-system.test.js:** NEW - 20 tests (movement, range, LOS)

### TDD Test Breakdown (20 tests)
1. Movement validation (8 tests): within movement points, invalid moves
2. Range calculation (6 tests): hex distance → range bands
3. Line of sight (6 tests): blocked/clear paths

### Success Criteria
- Ships visible on grid, can move
- Range auto-calculated correctly
- LOS blocks attacks
- 104/104 tests passing

---

## STAGE 8: MORE SHIPS & ADVANCED COMBAT
**Target:** 70k tokens | **Time:** 2-3 hours | **Difficulty:** Medium

### QUICK START COMMAND
```
"Implement Stage 8: More Ships. See STAGE-PLAN.md lines 127-150.
Read only: lib/combat.js (SHIPS), latest handoff.
Target: 70k tokens. TDD: Write 20 ship tests FIRST, then implement."
```

### Features
- 4 new ship types (Freighter, Fighter, Destroyer, Carrier)
- Ship selection screen (choose before game)
- Critical hits (natural 12 = 2x damage)
- Boarding actions (adjacent ships)
- Ship abilities (Fighter: Evasive +2, Carrier: Launch fighters)

### New Ships
- **Freighter:** Hull 20, Armor 1, Skill +0, Move 1 (cargo hauler)
- **Fighter:** Hull 5, Armor 0, Skill +3, Move 5 (Evasive ability)
- **Destroyer:** Hull 25, Armor 6, Skill +1, Move 2 (heavy weapons)
- **Carrier:** Hull 30, Armor 3, Skill +0, Move 1 (Launch fighters ability)

### Technical Scope
- **lib/combat.js:** Add 4 ships to SHIPS, critical hit logic, boarding
- **server.js:** Ship selection phase, ability handling
- **public/index.html:** Ship selection UI
- **tests/unit/advanced-combat.test.js:** NEW - 20 tests

### TDD Test Breakdown (20 tests)
1. Ship selection (6 tests)
2. Critical hits (5 tests)
3. Boarding actions (5 tests)
4. Ship abilities (4 tests)

### Success Criteria
- 6 ships selectable, each unique
- Crits work (natural 12 = 2x damage)
- Boarding captures ships
- 124/124 tests passing

---

## STAGE 9: PERSISTENCE & POLISH
**Target:** 70k tokens | **Time:** 3 hours | **Difficulty:** Medium

### QUICK START COMMAND
```
"Implement Stage 9: Persistence. See STAGE-PLAN.md lines 152-170.
Read only: server.js (gameState), latest handoff.
Target: 70k tokens. TDD: Write 20 persistence tests FIRST, then implement."
```

### Features
- Save/load game state (JSON files)
- Game history/replay
- Combat log export (text file)
- UI/UX polish (animations, better layout)
- Performance optimization

### Technical Scope
- **server.js:** /save, /load endpoints, fs operations
- **public/index.html:** Save/Load buttons, animations (CSS)
- **tests/unit/persistence.test.js:** NEW - 20 tests (save, load, integrity)

### TDD Test Breakdown (20 tests)
1. Save/load (8 tests): save state, load state, file errors
2. State integrity (6 tests): no data loss, version compatibility
3. History/replay (6 tests): log export, replay functionality

### Success Criteria
- Save/resume games without data loss
- Combat log exportable
- Smooth UI animations
- 144/144 tests passing
- **PROJECT COMPLETE** 🎉

---

## TOKEN EFFICIENCY RULES

**DO:**
✅ Upload latest handoff document to new session
✅ Use TDD: write tests FIRST, implement SECOND
✅ Read ONLY files explicitly needed
✅ Trust unit tests (skip manual testing in chat)
✅ Batch file reads in parallel
✅ Use compact handoff format (<300 lines)

**DON'T:**
❌ Explore or search codebase unnecessarily
❌ Ask Claude to "explain what will be done"
❌ Read entire server.js when only need gameState
❌ Manual testing before unit tests pass
❌ Verbose handoff docs (no "How to Resume" sections)
❌ Read files speculatively ("might be useful")

**Example Efficient Workflow:**
1. User: "Implement Stage 6" + uploads handoff
2. Claude reads: lib/combat.js, handoff (2 files, 10k tokens)
3. Claude writes: 20 crew tests (15k tokens)
4. Claude implements: crew system (35k tokens)
5. Claude runs tests, fixes issues (8k tokens)
6. Claude commits + creates handoff (2k tokens)
7. **Total: ~70k tokens**

---

## PROGRESS SUMMARY

**Completed:** 6 stages (0.5, 1, 2, 3, 4, 5)
**Remaining:** 4 stages (6, 7, 8, 9)

**Token Usage to Date:**
- Stages 0.5-3: ~150k tokens
- Stages 4-5: ~150k tokens
- **Total so far: ~300k tokens** (1.5 sessions)

**Projected Remaining:**
- Stages 6-9: ~280k tokens (4 × 70k)
- **Project Total: ~580k tokens** (~3 sessions)

**Test Coverage:**
- Current: 64 tests
- After Stage 9: 144 tests
- Coverage: Combat, multiplayer, turns, weapons, crew, grid, ships, persistence

---

## HANDOFF TEMPLATE (Token-Optimized)

Use this format for all future handoffs (target: <300 lines):

```markdown
# STAGE X COMPLETE → Ready for Stage Y
**Date:** YYYY-MM-DD | **Branch:** main | **Tests:** XX/XX ✅

## QUICK START NEXT SESSION
"[Exact command for next stage from STAGE-PLAN.md]"

## CURRENT STATUS
- Location, stage, tests, git status (5 lines)

## STAGE X CHANGES
- New features (bullets, ~10 items)
- Files changed (list with line counts)
- Key implementation details (code snippets if critical)

## TEST RESULTS
- Test breakdown (XX new, XX total)
- All passing ✅

## TOKEN USAGE
- Used: ~XXk tokens
- Time: X hours

## WHAT WORKS NOW
- Feature checklist (bullets)
- Still TODO (bullets)

## NEXT STAGE PREVIEW
- Target, time, difficulty
- Key features (bullets)
- TDD approach (test count)
- Files to read/modify

**END OF HANDOFF**
```

---

**Last Updated:** 2025-11-02 (after Stage 5 completion)
**Current Stage:** Stage 6 (Crew System) - READY TO START
**Token Budget:** 70k per stage (TDD optimized)
