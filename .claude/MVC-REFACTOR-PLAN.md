# MVC Refactor Plan for server.js

## Current State
- **server.js**: 2,480 lines (should be ~200)
- **Problem**: Monolithic file mixing routing, state, business logic, and socket handlers
- **Existing MVC start**: `lib/socket-handlers/` exists but combat.handlers.js is just a stub

## Goal
Reduce server.js to ~200 LOC (Express setup, middleware, server start only)

## Architecture Overview

```
server.js (200 LOC)           <- Express setup, middleware, start
├── lib/
│   ├── state/
│   │   ├── index.js          <- Central state export
│   │   ├── connections.js    <- Connection tracking (Map)
│   │   ├── game-state.js     <- Legacy ground combat state
│   │   └── combat-state.js   <- Space combat activeCombats Map
│   │
│   ├── services/
│   │   ├── rate-limiter.js   <- Rate limiting logic
│   │   ├── performance.js    <- Performance metrics
│   │   └── connection-manager.js <- Connection lifecycle
│   │
│   ├── combat/
│   │   └── ai.js             <- AI opponent (helpers, decisions, execution)
│   │
│   ├── socket-handlers/
│   │   ├── index.js          <- Handler registration (exists)
│   │   ├── combat.handlers.js <- EXTRACT: 20 socket events (5 sub-phases)
│   │   └── operations.handlers.js (exists, 1306 LOC)
│   │
│   └── routes/
│       └── api.routes.js     <- Express routes (/api/combat, /health, etc.)
```

---

## Extraction Phases

### Phase 1: State Objects (~300 LOC)
**Risk: LOW** - Pure data, no logic dependencies

| File | Contents |
|------|----------|
| `lib/state/connections.js` | `connectionCount`, `connections` Map, `actionTimestamps` Map |
| `lib/state/game-state.js` | `shipState`, `gameState`, `resetShipStates()`, `resetGameState()` |
| `lib/state/combat-state.js` | `activeCombats` Map, `updateCombatActivity()`, `trimCombatHistory()` |
| `lib/state/index.js` | Re-export all state modules |

**Tests first** (5):
- State initialization
- State reset functions
- Combat activity tracking

---

### Phase 2: Utility Services (~200 LOC)
**Risk: LOW** - Self-contained functions

| File | Contents |
|------|----------|
| `lib/services/rate-limiter.js` | `checkRateLimit()`, constants |
| `lib/services/performance.js` | `performanceMetrics`, `updateMetrics()` |
| `lib/services/connection-manager.js` | `updateConnectionActivity()`, idle pruning |

**Tests first** (10):
- Rate limit blocks after N requests
- Rate limit resets after window
- Connection activity updates
- Idle connection detection

---

### Phase 3a: AI Helper Functions (~50 LOC)
**Risk: LOW** - Trivial functions

| Function | Purpose |
|----------|---------|
| `createDummyPlayer(player1)` | Creates AI opponent config |
| `isDummyAI(playerId)` | Checks if player is AI |
| `emitToPlayer(io, playerId, event, data)` | Safe emit (skips AI) |

**Tests first** (3):
- createDummyPlayer returns valid structure
- isDummyAI correctly identifies AI vs human
- emitToPlayer skips AI sockets

---

### Phase 3b: AI Decision Logic (~100 LOC)
**Risk: LOW** - Pure function, no side effects

| Function | Purpose |
|----------|---------|
| `makeAIDecision(combat, aiPlayer)` | Returns decision object |

**Tests first** (8):
- AI decides to move when out of range
- AI decides to fire when in range
- AI launches missiles when available
- AI uses point defense against incoming missiles
- AI ends turn when no actions available
- AI prioritizes threats correctly
- AI doesn't fire when out of ammo
- AI handles edge cases (no enemy, already won)

---

### Phase 3c: AI Execution (~150 LOC)
**Risk: LOW** - After 3a, 3b tested

| Function | Purpose |
|----------|---------|
| `executeAITurn(combat, io)` | Executes decision, emits events |

**Tests first** (4):
- AI turn executes movement correctly
- AI turn executes fire correctly
- AI turn advances to next player
- AI turn handles combat end

---

### Phase 4a: Utility Socket Handlers (~50 LOC)
**Risk: LOW** - Simple, no game logic

| Handler | Purpose |
|---------|---------|
| `client:log` | Client-side logging |
| `ping` | Heartbeat/latency |
| `player:feedback` | Feedback submission |

**Tests first** (3):
- client:log stores log entry
- ping responds with pong
- player:feedback saves feedback

---

### Phase 4b: Legacy Ground Combat Handlers (~400 LOC)
**Risk: LOW** - Isolated system, rarely used

| Handler | Purpose |
|---------|---------|
| `hello` | Player registration |
| `combat` | Attack resolution |
| `engineerRepair` | Repair action |
| `moveShip` | Grid movement |
| `resetGame` | State reset |
| `startGame` | Game start |
| `endTurn` | Turn end |

**Tests first** (7):
- hello registers player
- combat resolves attack
- engineerRepair applies repair
- moveShip validates and moves
- resetGame clears state
- startGame initializes
- endTurn advances turn

---

### Phase 4c: Space Selection Handlers (~200 LOC)
**Risk: LOW** - Well-tested flow

| Handler | Purpose |
|---------|---------|
| `space:shipSelected` | Ship selection |
| `space:rangeSelected` | Range selection |
| `space:playerReady` | Ready state (has integration test) |

**Tests first** (5):
- shipSelected stores selection
- rangeSelected stores range
- playerReady with both players starts combat
- playerReady solo mode creates AI
- Selection state broadcasts to opponent

---

### Phase 4d: Space Combat Handlers (~500 LOC)
**Risk: LOW** - Core logic already unit tested

| Handler | Purpose |
|---------|---------|
| `space:fire` | Weapon fire (has integration test) |
| `space:launchMissile` | Missile launch |
| `space:pointDefense` | Point defense |
| `space:useSandcaster` | Sandcaster use |

**Tests first** (8):
- fire resolves damage
- fire broadcasts to both players
- launchMissile creates missile
- launchMissile tracks ammo
- pointDefense intercepts missile
- pointDefense fails on miss
- useSandcaster adds armor
- useSandcaster consumes ammo

---

### Phase 4e: Space Flow Handlers (~250 LOC)
**Risk: LOW** - Clean boundaries

| Handler | Purpose |
|---------|---------|
| `space:endTurn` | Turn/round advancement |
| `space:abandonBattle` | Battle abandon |
| `disconnect` | Cleanup on disconnect |

**Tests first** (5):
- endTurn advances to next player
- endTurn triggers AI turn in solo
- endTurn starts new round when both done
- abandonBattle cleans up combat
- disconnect removes player from combat

---

### Phase 5: Express Routes (~100 LOC)
**Risk: LOW** - Simple extraction

| Route | Purpose |
|-------|---------|
| `POST /api/combat` | Combat API |
| `GET /health` | Health check |
| `GET /ready` | Readiness check |
| `GET /status` | Status info |

**Tests first** (5):
- Health endpoint returns 200
- Ready endpoint returns correct state
- Status endpoint returns version info
- Combat API validates input
- Combat API returns result

---

## Summary

| Phase | Description | LOC | Risk | Tests |
|-------|-------------|-----|------|-------|
| 1 | State Objects | ~300 | LOW | 5 |
| 2 | Utility Services | ~200 | LOW | 10 |
| 3a | AI Helpers | ~50 | LOW | 3 |
| 3b | AI Decisions | ~100 | LOW | 8 |
| 3c | AI Execution | ~150 | LOW | 4 |
| 4a | Utility Handlers | ~50 | LOW | 3 |
| 4b | Legacy Combat | ~400 | LOW | 7 |
| 4c | Space Selection | ~200 | LOW | 5 |
| 4d | Space Combat | ~500 | LOW | 8 |
| 4e | Space Flow | ~250 | LOW | 5 |
| 5 | Express Routes | ~100 | LOW | 5 |
| **Total** | | ~2300 | **ALL LOW** | 63 |

---

## Files to Create

```
lib/state/index.js
lib/state/connections.js
lib/state/game-state.js
lib/state/combat-state.js
lib/services/rate-limiter.js
lib/services/performance.js
lib/services/connection-manager.js
lib/combat/ai.js
lib/routes/api.routes.js
```

Plus update: `lib/socket-handlers/combat.handlers.js`

---

## Success Criteria

- [ ] server.js < 250 LOC
- [ ] All 396+ tests pass (333 existing + 63 new)
- [ ] No functionality regression
- [ ] Each module < 500 LOC
- [ ] Clear separation of concerns

---

## Rollback Plan

Each phase committed separately. Revert with:
```bash
git revert HEAD
```
