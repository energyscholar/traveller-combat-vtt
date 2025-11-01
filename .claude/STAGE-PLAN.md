# TRAVELLER COMBAT VTT - STAGE PLAN
# Token-Optimized Development Roadmap
# Target: 90,000 tokens per stage
# Created: 2025-11-01

## Planning Methodology

**Token Budget per Stage: 90,000 tokens**
- Implementation: ~50,000 tokens (55%)
- Testing: ~20,000 tokens (22%)
- Documentation: ~12,000 tokens (13%)
- Git/verification: ~8,000 tokens (9%)

**Why 90k?**
- Uses ~45% of 200k budget
- Leaves 55% buffer for iteration/debugging
- Proven successful in Stage 3 (used 118k, could trim to 90k)
- Avoids rushing or corner-cutting

---

## Completed Stages

### ✅ Stage 0.5: Socket.io Spike Test
**Status:** Complete
**Purpose:** Validate Socket.io works in dev environment
**Time:** 1 hour
**Deliverables:**
- Socket.io connectivity test
- Latency measurement
- Multi-tab communication verified

### ✅ Stage 1: Hello World
**Status:** Complete
**Purpose:** Basic real-time sync between tabs
**Time:** 1 hour
**Deliverables:**
- Two tabs communicate
- Message broadcast working
- Foundation for multiplayer

### ✅ Stage 2: Combat Math
**Status:** Complete
**Purpose:** Mongoose Traveller 2e combat rules
**Time:** 1 hour
**Deliverables:**
- Attack resolution (2d6 + mods >= 8)
- Damage calculation (2d6 - armor)
- Scout vs Corsair test ships
- 7 unit tests

### ✅ Stage 3: Multiplayer Sync
**Status:** Complete
**Purpose:** True multiplayer with ship ownership
**Time:** 3 hours
**Tokens:** ~118,000 (would be ~90k if optimized)
**Deliverables:**
- Ship assignment (Scout/Corsair/Spectator)
- Control restrictions (your ship only)
- Visual ownership indicators
- Persistent hull tracking
- Real-time state sync
- Game reset
- 28 tests (7 combat + 17 multiplayer + 4 integration)

---

## Upcoming Stages (Token-Optimized)

### Stage 4: Combat Rounds & Turn System
**Target Tokens:** 90,000
**Estimated Time:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 3 complete

**Features:**
- Round counter (Round 1, 2, 3...)
- Turn order enforcement (Scout → Corsair → repeat)
- "End Turn" button (disabled until your turn)
- Initiative system (roll 2d6 + pilot skill, high goes first)
- Turn indicator: "Your Turn" / "Opponent's Turn"
- Round history log

**Technical Changes:**
- Server: Track current round, current player turn
- Server: Validate combat only on your turn
- Client: Enable/disable attack based on turn
- Client: Visual turn indicator
- Event: `turnChange` broadcast to all players

**Tests:**
- Turn order enforcement (10 tests)
- Initiative calculation (5 tests)
- Round progression (5 tests)
- Total: 20 new tests

**Success Criteria:**
- Players alternate turns
- Cannot attack out of turn
- Initiative determines first player
- Round counter increments correctly
- All tests passing

---

### Stage 5: Weapon Selection & Ammo
**Target Tokens:** 90,000
**Estimated Time:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 4 complete

**Features:**
- Multiple weapons per ship (Pulse Laser, Beam Laser, Missiles)
- Weapon dropdown in combat UI
- Different damage profiles (2d6, 3d6, 4d6)
- Ammo tracking for missiles (limited shots)
- Weapon range restrictions
- Weapon stats display

**Technical Changes:**
- Data: Expand SHIPS with weapons array
- Server: Combat resolution uses selected weapon
- Client: Weapon selector dropdown
- Client: Ammo display (e.g., "Missiles: 4/6")
- Event: `ammoUpdate` after firing

**New Weapons:**
- Pulse Laser: 2d6, unlimited ammo, all ranges
- Beam Laser: 3d6, unlimited ammo, close-medium only
- Missiles: 4d6, 6 shots, long range bonus +2

**Tests:**
- Weapon selection (8 tests)
- Ammo tracking (6 tests)
- Damage calculation per weapon (6 tests)
- Total: 20 new tests

**Success Criteria:**
- Can select weapon before attack
- Different weapons deal different damage
- Missiles deplete ammo
- Cannot fire weapon without ammo
- All tests passing

---

### Stage 6: Character/Crew System
**Target Tokens:** 90,000
**Estimated Time:** 3-4 hours
**Difficulty:** Hard
**Dependencies:** Stage 5 complete

**Features:**
- Crew roster (Pilot, Gunner, Engineer)
- Character sheets (Name, Skills, Stats)
- Role assignment (assign crew to stations)
- Skill bonuses (Pilot +2, Gunner +1, etc.)
- Crew damage/injuries (reduced effectiveness)
- Crew healing between rounds

**Technical Changes:**
- Data: Crew objects with skills
- Server: Combat uses crew skills instead of ship skills
- Client: Crew roster UI
- Client: Drag-drop crew assignment
- Event: `crewUpdate` when crew changes

**Crew Roles:**
- **Pilot:** +skill to dodge/initiative
- **Gunner:** +skill to attack rolls
- **Engineer:** Can repair hull (1d6 per round)

**Tests:**
- Crew skill application (10 tests)
- Role assignment (6 tests)
- Crew damage (4 tests)
- Total: 20 new tests

**Success Criteria:**
- Crew skills affect combat
- Can assign crew to roles
- Crew damage impacts performance
- Engineer can repair
- All tests passing

---

### Stage 7: Movement & Positioning
**Target Tokens:** 90,000
**Estimated Time:** 3-4 hours
**Difficulty:** Hard
**Dependencies:** Stage 6 complete

**Features:**
- 2D hex grid (10x10)
- Ship positioning on grid
- Movement points per turn (Scout: 3, Corsair: 2)
- Range calculated from hex distance
- Line of sight checks
- Movement phase before combat

**Technical Changes:**
- Data: Add grid positions to shipState
- Server: Track positions, validate moves, calculate range
- Client: Canvas/SVG hex grid rendering
- Client: Click-to-move interface
- Event: `positionUpdate` after moves

**Grid Mechanics:**
- 1 hex = 1 range band
- Adjacent: 0-1 hexes
- Close: 2-3 hexes
- Medium: 4-5 hexes
- Long: 6-7 hexes
- Very Long: 8+ hexes

**Tests:**
- Movement validation (8 tests)
- Range calculation (6 tests)
- Line of sight (6 tests)
- Total: 20 new tests

**Success Criteria:**
- Ships visible on grid
- Can move within movement points
- Range auto-calculated from position
- Cannot shoot through obstacles
- All tests passing

---

### Stage 8: Additional Ships & Advanced Combat
**Target Tokens:** 90,000
**Estimated Time:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 7 complete

**Features:**
- 4 new ship types (Freighter, Fighter, Destroyer, Carrier)
- Ship selection screen (choose before game)
- Asymmetric gameplay (different stats/abilities)
- Critical hits (natural 12 = 2x damage)
- Boarding actions (adjacent ships only)
- Ship abilities (Fighter: Evasive +2 dodge, etc.)

**Technical Changes:**
- Data: Expand SHIPS with 4 new types
- Server: Ship selection phase
- Client: Ship selection UI
- Server: Critical hit detection
- Event: `shipSelected` at game start

**New Ships:**
- **Freighter:** Hull 20, Armor 1, Skill +0, Move 1
- **Fighter:** Hull 5, Armor 0, Skill +3, Move 5, Ability: Evasive
- **Destroyer:** Hull 25, Armor 6, Skill +1, Move 2
- **Carrier:** Hull 30, Armor 3, Skill +0, Move 1, Ability: Launch Fighters

**Tests:**
- Ship selection (6 tests)
- Critical hits (5 tests)
- Boarding actions (5 tests)
- Ship abilities (4 tests)
- Total: 20 new tests

**Success Criteria:**
- Can choose from 6 ship types
- Each ship feels different
- Critical hits occur on natural 12
- Boarding captures ships
- All tests passing

---

### Stage 9: Persistence & Polish
**Target Tokens:** 90,000
**Estimated Time:** 3 hours
**Difficulty:** Medium
**Dependencies:** Stage 8 complete

**Features:**
- Save game state to JSON file
- Load game state from file
- Game history/replay
- Combat log export
- UI/UX polish (animations, sounds, better layout)
- Performance optimization
- Final bug fixes

**Technical Changes:**
- Server: Save/load endpoints
- Server: File system operations
- Client: Save/Load buttons
- Client: CSS animations
- Client: Sound effects (optional)

**Persistence:**
- Auto-save every round
- Manual save/load via buttons
- Export combat log as text
- Game state includes: ships, crew, positions, ammo, hull, round #

**Tests:**
- Save/load (8 tests)
- State integrity (6 tests)
- History/replay (6 tests)
- Total: 20 new tests

**Success Criteria:**
- Can save and resume games
- No data loss on save/load
- Combat history viewable
- Smooth animations
- All tests passing

---

## Summary

**Total Stages:** 9 (0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9)
**Completed:** 4 stages (0.5, 1, 2, 3)
**Remaining:** 5 stages (4, 5, 6, 7, 8, 9)

**Estimated Total Token Usage:**
- Stages 0.5-3: ~150k tokens (actual)
- Stages 4-9: ~540k tokens (6 × 90k target)
- **Total Project: ~690k tokens** (3-4 full sessions)

**Estimated Total Time:**
- Stages 0.5-3: ~6 hours
- Stages 4-9: ~16 hours
- **Total Project: ~22 hours**

**Test Coverage Goal:**
- Current: 28 tests
- After Stage 9: ~148 tests (28 + 6×20)

---

## Risk Assessment

**Low Risk Stages:**
- Stage 4: Combat rounds (straightforward)
- Stage 5: Weapons (data-driven)
- Stage 8: More ships (repetitive)

**Medium Risk Stages:**
- Stage 9: Persistence (file I/O can be tricky)

**High Risk Stages:**
- Stage 6: Crew system (complex interactions)
- Stage 7: Movement grid (UI complexity)

**Mitigation:**
- Budget extra time for Stages 6-7
- Can split Stage 6 into 6a (basic crew) + 6b (damage/healing) if needed
- Can split Stage 7 into 7a (grid) + 7b (movement) if needed

---

## Flexibility

**If a stage goes over 90k tokens:**
- Split into sub-stages (e.g., 6a, 6b)
- Defer lower-priority features to next stage
- Focus on core functionality first

**If a stage uses <90k tokens:**
- Add polish/refinement
- Add extra tests
- Improve documentation
- Start next stage planning

---

## Success Metrics (per stage)

**Technical:**
- All tests passing ✅
- No regressions in existing features ✅
- Code committed and pushed ✅

**Functional:**
- Features work as designed ✅
- Multiplayer sync maintained ✅
- Performance acceptable ✅

**Documentation:**
- Handoff doc created ✅
- Code comments added ✅
- README updated ✅

---

**Last Updated:** 2025-11-01 (after Stage 3 completion)
**Next Stage:** Stage 4 (Combat Rounds & Turn System)
**Current Token Budget:** 90,000 per stage
