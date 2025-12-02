# AUTORUN 10: Adventure Packages + Combat Verification

**Created:** 2025-12-01
**Status:** READY
**Risk Level:** VERY LOW
**Prerequisite:** AUTORUN-9 completed (JSON Schema validation)

## Execution Protocol
**Token Efficiency Mode:** Auto-adjust effort to minimize token use.
- `[65%]` BURST: Exploration, planning, debugging
- `[40%]` CRUISE: Sequential implementation, clear path
- Signal mode changes inline. Override with user instruction.

## Summary
Adventure package format (.tvadv) for distribution. Combat extraction is **ALREADY COMPLETE**:
- `server.js` = 414 LOC (target was <500)
- `lib/combat/ai/` has Strategy Pattern (4 strategies)
- `lib/combat/commands/` has Command Pattern (6 commands)

Stages 10.3-10.5 repurposed from "extraction" to "verification & documentation".

---

## Stage 10.1: .tvadv Zip Format
**Risk:** LOW | **LOC:** ~200 | **Commit after**

Adventure packages as distributable archives.

| Task | Description | Est. LOC |
|------|-------------|----------|
| 10.1.1 | Define .tvadv structure (manifest + JSON + assets) | ~20 |
| 10.1.2 | Pack function (campaign → .tvadv zip) | ~80 |
| 10.1.3 | Unpack function (.tvadv → temp dir) | ~60 |
| 10.1.4 | Asset reference handling (handout files) | ~40 |

**Deliverable:** Export campaign as downloadable .tvadv file.

---

## Stage 10.2: Adventure File Utilities
**Risk:** LOW | **LOC:** ~150 | **Commit after**

Tools for working with adventure packages.

| Task | Description | Est. LOC |
|------|-------------|----------|
| 10.2.1 | CLI validate command (`npm run validate-adventure`) | ~40 |
| 10.2.2 | Adventure preview (list contents without importing) | ~50 |
| 10.2.3 | Selective import (choose which entities to import) | ~60 |

**Deliverable:** Adventure files are first-class citizens with tooling.

---

## Stage 10.3: Combat AI Verification (REDUCED SCOPE)
**Risk:** VERY LOW | **LOC:** ~80 | **Commit after**

**STATUS:** AI extraction already complete. Verify and document.

| Task | Description | Est. LOC |
|------|-------------|----------|
| 10.3.1 | Verify AI test coverage (target 90%+) | ~20 |
| 10.3.2 | Document existing Strategy Pattern | ~30 |
| 10.3.3 | Add any missing behavior tests | ~30 |

**Existing Structure:**
```
lib/combat/ai/
├── decisions.js          # Main entry point
├── execution.js          # Action execution
├── helpers.js            # Utility functions
├── index.js              # Module exports
└── strategies/
    ├── AIContext.js      # Strategy Pattern context
    ├── BaseStrategy.js   # Abstract base
    ├── BalancedStrategy.js
    ├── AggressiveStrategy.js
    ├── DefensiveStrategy.js
    └── CautiousStrategy.js
```

**Deliverable:** Confirm AI is well-tested, add docs.

---

## Stage 10.4: Combat State Verification (REDUCED SCOPE)
**Risk:** VERY LOW | **LOC:** ~80 | **Commit after**

**STATUS:** Command Pattern already implemented. Verify and document.

| Task | Description | Est. LOC |
|------|-------------|----------|
| 10.4.1 | Verify command test coverage | ~20 |
| 10.4.2 | Document existing Command Pattern | ~30 |
| 10.4.3 | Add any missing state transition tests | ~30 |

**Existing Structure:**
```
lib/combat/commands/
├── BaseCommand.js
├── CommandInvoker.js
├── FireCommand.js
├── MissileCommand.js
├── PointDefenseCommand.js
├── SandcasterCommand.js
├── EndTurnCommand.js
└── index.js
```

**Deliverable:** Confirm commands are well-tested, add docs.

---

## Stage 10.5: Technical Debt Assessment
**Risk:** VERY LOW | **LOC:** ~50 | **Commit after**

Document technical debt for future autoruns.

| Task | Description | Est. LOC |
|------|-------------|----------|
| 10.5.1 | Create TECH-DEBT.md with findings | ~40 |
| 10.5.2 | Prioritize debt items | ~10 |
| 10.5.3 | All tests pass verification | ~0 |

**Known Debt (from exploration):**
- `lib/combat.js` = 1670 LOC (large, could split)
- Rules extracted from Mongoose Traveller PDFs on file
- Full PDFs available on request for deeper rule integration

**Deliverable:** Technical debt documented for prioritization.

---

## Total: ~560 LOC (reduced from ~710 due to existing extraction)

---

## Risk Mitigations

| Stage | Original | Mitigation | Final |
|-------|----------|------------|-------|
| 10.1 | LOW | Build on AR-9 JSON Schema | **VERY LOW** |
| 10.2 | LOW | Read-only operations | **VERY LOW** |
| 10.3 | ~~MED~~ | Combat AI already extracted! Just verify. | **VERY LOW** |
| 10.4 | ~~MED~~ | Commands already extracted! Just verify. | **VERY LOW** |
| 10.5 | LOW | Document existing debt | **VERY LOW** |

**All stages VERY LOW risk. Combat extraction already done.**

---

## Stage Dependencies

```
10.1 (.tvadv format)
  ↓
10.2 (Utilities) ← needs pack/unpack

10.3 (AI Extraction)      ← independent track
  ↓
10.4 (State Extraction)   ← builds on 10.3
  ↓
10.5 (Cleanup)            ← requires 10.3 + 10.4
```

**Tracks can run in parallel:** 10.1-10.2 independent from 10.3-10.5

---

## File Structure

```
lib/combat/
├── ai.js           # NEW - AI decision logic
├── state.js        # NEW - Combat state management
└── index.js        # NEW - Module exports

schemas/
├── adventure.schema.json   # From AR-9
├── character.schema.json   # From AR-9
└── tvadv-manifest.json     # NEW - Package manifest schema
```

---

## .tvadv File Format

```
my-adventure.tvadv (zip archive)
├── manifest.json           # Version, metadata, checksums
├── adventure.json          # All prep content (validates against schema)
├── assets/
│   ├── handouts/
│   │   ├── map-001.png
│   │   └── briefing.pdf
│   └── portraits/
│       └── npc-webb.jpg
└── README.md               # Human-readable description
```

---

## Success Criteria

| Stage | Criterion |
|-------|-----------|
| 10.1 | Export → .tvadv → Import round-trip works |
| 10.2 | `npm run validate-adventure foo.tvadv` exits 0/1 correctly |
| 10.3 | AI module has 90%+ test coverage |
| 10.4 | State module has 90%+ test coverage |
| 10.5 | server.js < 500 LOC, all tests pass |

---

## Deferred to AUTORUN-11+

- Combat integration with bridge (Stage 5)
- Ship systems & damage (Stage 6)
- Full mail compose
- Adventure marketplace / DRM
- NPC crew automation
