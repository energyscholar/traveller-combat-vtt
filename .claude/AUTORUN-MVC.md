# AUTORUN-MVC: Server.js Refactor

## Objective
Refactor server.js from 2,480 LOC → ~200 LOC using MVC pattern.

## Pre-Conditions
- [ ] All 333 tests passing
- [ ] Manual smoke test: Operations VTT works
- [ ] Git clean state

---

## Phase 1: State Objects (~300 LOC)

### 1.1 Write state tests (5 tests)
```
tests/unit/state.test.js
- State modules initialize correctly
- connections Map stores socket data
- gameState reset clears all fields
- shipState reset restores defaults
- activeCombats tracks combat sessions
```

### 1.2 Create lib/state/connections.js
Extract from server.js:
- `connectionCount` variable
- `connections` Map
- `actionTimestamps` Map

### 1.3 Create lib/state/game-state.js
Extract from server.js:
- `shipState` object (lines 601-631)
- `gameState` object (lines 633-644)
- `resetShipStates()` function
- `resetGameState()` function
- `getAvailableShip()` function
- `getShipAssignments()` function

### 1.4 Create lib/state/combat-state.js
Extract from server.js:
- `activeCombats` Map
- `updateCombatActivity()` function
- `trimCombatHistory()` function

### 1.5 Create lib/state/index.js
Re-export all state modules.

### 1.6 Update server.js imports
Replace inline state with imports from lib/state.

### 1.7 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 2: Utility Services (~200 LOC)

### 2.1 Write service tests (10 tests)
```
tests/unit/services.test.js
- Rate limiter allows first request
- Rate limiter blocks after limit
- Rate limiter resets after window
- Performance metrics initialize to zero
- Performance metrics update correctly
- Connection activity timestamp updates
- Idle connections detected after timeout
- Active connections not pruned
```

### 2.2 Create lib/services/rate-limiter.js
Extract from server.js:
- `RATE_LIMIT_WINDOW_MS` constant
- `RATE_LIMIT_MAX_ACTIONS` constant
- `checkRateLimit(socketId)` function

### 2.3 Create lib/services/performance.js
Extract from server.js:
- `performanceMetrics` object
- `updateMetrics()` function
- Performance logging interval

### 2.4 Create lib/services/connection-manager.js
Extract from server.js:
- `IDLE_TIMEOUT_MS` constant
- `CONNECTION_CHECK_INTERVAL` constant
- `updateConnectionActivity(socketId)` function
- Idle connection pruning interval

### 2.5 Update server.js imports
Replace inline services with imports.

### 2.6 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 3a: AI Helper Functions (~50 LOC)

### 3a.1 Write AI helper tests (3 tests)
```
tests/unit/ai-helpers.test.js
- createDummyPlayer returns valid structure with ship/crew
- isDummyAI returns true for AI_OPPONENT_*, false otherwise
- emitToPlayer skips emission for AI players
```

### 3a.2 Create lib/combat/ai.js (initial)
Extract from server.js:
- `createDummyPlayer(player1)` (lines 214-226)
- `isDummyAI(playerId)` (lines 229-231)
- `emitToPlayer(io, playerId, eventName, data)` (lines 234-246)

### 3a.3 Update server.js imports
Import helpers from lib/combat/ai.js.

### 3a.4 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 3b: AI Decision Logic (~100 LOC)

### 3b.1 Write AI decision tests (8 tests)
```
tests/unit/ai-decisions.test.js
- AI moves toward enemy when out of range
- AI fires when in weapon range
- AI launches missiles when available and in range
- AI uses point defense against incoming missiles
- AI ends turn when no actions available
- AI prioritizes point defense over firing
- AI doesn't fire when out of ammo
- AI handles edge case: no enemy ship
```

### 3b.2 Add to lib/combat/ai.js
Extract from server.js:
- `makeAIDecision(combat, aiPlayer)` (lines 270-373)

### 3b.3 Update server.js imports
Import makeAIDecision from lib/combat/ai.js.

### 3b.4 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 3c: AI Execution (~150 LOC)

### 3c.1 Write AI execution tests (4 tests)
```
tests/unit/ai-execution.test.js
- executeAITurn calls makeAIDecision
- executeAITurn emits movement events
- executeAITurn emits fire events
- executeAITurn advances turn after actions
```

### 3c.2 Add to lib/combat/ai.js
Extract from server.js:
- `executeAITurn(combat, io)` (lines 375-532)

### 3c.3 Update server.js imports
Import executeAITurn from lib/combat/ai.js.

### 3c.4 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 4a: Utility Socket Handlers (~50 LOC)

### 4a.1 Write utility handler tests (3 tests)
```
tests/unit/socket-utility.test.js
- client:log handler logs message
- ping handler responds with timestamp
- player:feedback handler stores feedback
```

### 4a.2 Update lib/socket-handlers/combat.handlers.js
Extract from server.js:
- `client:log` handler (lines 857-879)
- `ping` handler (lines 1247-1253)
- `player:feedback` handler (lines 881-935)

### 4a.3 Update handler registration
Call combat handlers from socket-handlers/index.js.

### 4a.4 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 4b: Legacy Ground Combat Handlers (~400 LOC)

### 4b.1 Write legacy handler tests (7 tests)
```
tests/unit/socket-legacy.test.js
- hello handler registers player
- combat handler resolves attack
- engineerRepair handler applies repair
- moveShip handler validates movement
- resetGame handler clears state
- startGame handler initializes game
- endTurn handler advances turn
```

### 4b.2 Add to lib/socket-handlers/combat.handlers.js
Extract from server.js:
- `hello` handler (lines 937-948)
- `combat` handler (lines 950-1090)
- `engineerRepair` handler (lines 1092-1149)
- `moveShip` handler (lines 1151-1225)
- `resetGame` handler (lines 1227-1245)
- `startGame` handler (lines 1255-1279)
- `endTurn` handler (lines 1281-1319)

### 4b.3 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 4c: Space Selection Handlers (~200 LOC)

### 4c.1 Write selection handler tests (5 tests)
```
tests/unit/socket-selection.test.js
- space:shipSelected stores ship choice
- space:rangeSelected stores range choice
- space:playerReady starts combat when both ready
- space:playerReady creates AI in solo mode
- Selection broadcasts to opponent
```

### 4c.2 Add to lib/socket-handlers/combat.handlers.js
Extract from server.js:
- `space:shipSelected` handler (lines 1321-1325)
- `space:rangeSelected` handler (lines 1327-1331)
- `space:playerReady` handler (lines 1333-1450)

### 4c.3 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 4d: Space Combat Handlers (~500 LOC)

### 4d.1 Write combat handler tests (8 tests)
```
tests/unit/socket-space-combat.test.js
- space:fire resolves attack
- space:fire broadcasts result to both players
- space:launchMissile creates missile tracker
- space:launchMissile decrements ammo
- space:pointDefense intercepts on success
- space:pointDefense missile continues on fail
- space:useSandcaster adds temporary armor
- space:useSandcaster decrements ammo
```

### 4d.2 Add to lib/socket-handlers/combat.handlers.js
Extract from server.js:
- `space:fire` handler (lines 1452-1784)
- `space:launchMissile` handler (lines 1786-2027)
- `space:pointDefense` handler (lines 2029-2095)
- `space:useSandcaster` handler (lines 2097-2170)

### 4d.3 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 4e: Space Flow Handlers (~250 LOC)

### 4e.1 Write flow handler tests (5 tests)
```
tests/unit/socket-space-flow.test.js
- space:endTurn advances to next player
- space:endTurn triggers AI in solo mode
- space:endTurn starts new round when both done
- space:abandonBattle removes combat
- disconnect cleans up player state
```

### 4e.2 Add to lib/socket-handlers/combat.handlers.js
Extract from server.js:
- `space:endTurn` handler (lines 2172-2281)
- `space:abandonBattle` handler (lines 2283-2311)
- `disconnect` handler (lines 2313-2371)

### 4e.3 Verify
```bash
npm test && curl localhost:3000/health
```

---

## Phase 5: Express Routes (~100 LOC)

### 5.1 Write route tests (5 tests)
```
tests/unit/api-routes.test.js
- GET /health returns 200
- GET /ready returns readiness state
- GET /status returns version info
- POST /api/combat validates input
- POST /api/combat returns attack result
```

### 5.2 Create lib/routes/api.routes.js
Extract from server.js:
- `POST /api/combat` route (lines 2373-2392)
- `GET /health` route (lines 2394-2403)
- `GET /ready` route (lines 2405-2420)
- `GET /status` route (lines 2422-2478)

### 5.3 Update server.js
Replace inline routes with router import.

### 5.4 Final verification
```bash
npm test
curl localhost:3000/health
curl localhost:3000/status
# Manual test: Full combat flow
```

---

## Final Cleanup

### 6.1 Clean up server.js
- Remove all extracted code
- Keep only: Express setup, middleware, socket.io setup, server start
- Target: < 250 LOC

### 6.2 Update documentation
- Update README if needed
- Add JSDoc comments to new modules

### 6.3 Final commit
```bash
git add -A
git commit -m "refactor(mvc): Complete MVC extraction - server.js now ~200 LOC"
```

---

## Summary

| Phase | LOC | Risk | Tests | Time Est |
|-------|-----|------|-------|----------|
| 1 | ~300 | LOW | 5 | 15 min |
| 2 | ~200 | LOW | 10 | 15 min |
| 3a | ~50 | LOW | 3 | 10 min |
| 3b | ~100 | LOW | 8 | 15 min |
| 3c | ~150 | LOW | 4 | 15 min |
| 4a | ~50 | LOW | 3 | 10 min |
| 4b | ~400 | LOW | 7 | 20 min |
| 4c | ~200 | LOW | 5 | 15 min |
| 4d | ~500 | LOW | 8 | 25 min |
| 4e | ~250 | LOW | 5 | 15 min |
| 5 | ~100 | LOW | 5 | 10 min |
| **Total** | ~2300 | **ALL LOW** | 63 | ~165 min |

**Estimated Total Time**: ~3 hours (with buffer for issues)

---

## Abort Conditions

Stop and reassess if:
- Any phase fails tests after extraction
- Manual smoke test shows broken functionality
- More than 2 unexpected issues per phase

## Recovery

Each phase is committed separately:
```bash
git log --oneline -5   # Find last good commit
git revert HEAD        # Undo last phase
```
