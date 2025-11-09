# Stage 12: Boarding Actions

**Est. 6,000 tokens | ~5 hours | ~600 LOC**

## Scope

### Features
- Docking manoeuvres (Pilot check, opposed if unwilling)
- Marine deployment
- Boarding combat (abstract system)
- Repel boarders actions
- Ship capture mechanics
- Casualties and retreat

### Tests
- Unit tests: ~400 LOC
- Integration tests: ~100 LOC
- Test coverage: 90%+

## Sub-Stages

### 12.1: Docking & Deployment (2k tokens, ~200 LOC)
- Docking manoeuvre (Pilot check)
- Adjacent range requirement
- Opposed check (defender has Bane)
- Marine deployment timing

### 12.2: Boarding Combat (Abstract) (2k tokens, ~250 LOC)
- Boarding strength calculation
- Defender strength calculation
- Opposed checks per round
- Modifiers: armour, weapons, numbers, tactics
- Casualties (both sides)

### 12.3: Capture & Repel (2k tokens, ~150 LOC)
- Ship capture conditions
- Surrender mechanics
- Repel boarders success
- Escape pod options
- Crew casualties to personal combat characters

---

## Incremental Refactoring (Stage 12)

**While implementing boarding actions, extract boarding-specific modules:**

- **Create `lib/boarding.js`** - Boarding action resolution, docking, deployment
- **Create `lib/crew-combat.js`** - Crew-to-crew combat (if distinct from ship combat)
- **Consider `lib/maneuvers/docking.js`** - Docking maneuvers and opposed checks
- Final incremental extraction before Stage 13 major refactor
- By now, `combat.js` should be significantly smaller

---

## Acceptance Criteria
- [ ] Ships can dock at Adjacent range
- [ ] Marines can board enemy ships
- [ ] Boarding combat resolves each round
- [ ] Ships can be captured
- [ ] Defenders can repel boarders
- [ ] Casualties affect crew roster
