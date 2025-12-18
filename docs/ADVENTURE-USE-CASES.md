# Adventure Use Cases Research

## Session Summary - AR Chain Research Task

This document captures adventure/scenario use cases identified for Operations VTT.

---

## Identified Scenarios

### 1. AR-125: Pirate Ambush Scenario (HIGH PRIORITY)
**Status:** Partially implemented (AR-125.1 log tooltips done)

Sub-tasks:
- AR-125.1 Log entry tooltips - DONE
- AR-125.2 Ship-to-ship comms in log
- AR-125.3 Cargo manifest CRUD
- AR-125.4 Crew roster with named NPCs
- AR-125.8 Pirate encounter generator

**Use Cases:**
- Pirates intercept merchant ship
- Demand cargo/surrender
- Ship-to-ship communications
- Cargo inspection/theft

### 2. Kobayashi Maru Scenario (v81.7)
**Status:** Deferred (requires asteroid HP system)

**Use Case:**
- PCs attack System Defense Boat at Dorannia 7
- SDB triggers nuclear response
- "GAME OVER" arcade-style screen
- Teaches consequences of aggression

### 3. Rescue Operations
**Status:** Implemented in Captain panel (rescueTargets array)

**Use Cases:**
- Disabled ship sends distress signal
- Multiple rescue priorities with ETAs
- Triage decisions (souls at risk)
- Time-pressure scenarios

### 4. Patrol Encounters
**Status:** Ships available (patrol_corvette, SDB)

**Use Cases:**
- Imperial Navy patrol interdiction
- Customs inspection
- Documentation check
- Cargo manifest review

---

## VTT Features Supporting Scenarios

| Feature | Status | Use Case |
|---------|--------|----------|
| Ship-to-ship hailing | Done | Negotiations, demands |
| Contact marking | Done | IFF identification |
| Weapons authorization | Done | ROE management |
| Captain orders | Done | Crew coordination |
| ECM/ECCM | Done | Electronic warfare |
| Sensor scans | Done | Target identification |
| Log tooltips | Done | Long message display |
| Jump navigation | Done | Pursuit/escape |
| Alert status | Done | Battle stations |

---

## Recommended Next Scenarios

### Near-term (Low Complexity)
1. **Customs Inspection** - Patrol ship demands cargo manifest
2. **Distress Response** - Rescue time-pressure scenario
3. **Silent Running** - Evade hostile detection

### Medium-term (Medium Complexity)
1. **Pirate Negotiation** - Full AR-125 implementation
2. **System Defense Engagement** - Combat with SDB
3. **Multi-ship Convoy** - Escort mission

### Long-term (High Complexity)
1. **Boarding Actions** - AR-196
2. **AI Email System** - NPC communications
3. **Kobayashi Maru** - Nuclear consequence scenario

---

## Adventure Content Sources

- Mongoose Traveller adventure modules (paid, requires gating)
- Classic Traveller adventures (reference library)
- GURPS Space Adventures (reference PDF)

**Note:** AR-140 defines gating architecture for paid content integration.

---

*Generated during AR chain session*
