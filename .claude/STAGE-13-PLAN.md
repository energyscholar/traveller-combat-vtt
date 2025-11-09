# Stage 13: Performance, Scale & REFACTORING

**Est. 15,000 tokens | ~40 hours | ~1,500 LOC**

**CRITICAL STAGE:** This is the major refactoring milestone. All features complete (Stages 8-12), requirements stable, architecture known. Time to pay down technical debt and prepare for production.

---

## Why Stage 13 for Refactoring?

### Perfect Timing ✅
1. **All features implemented** (Stages 8-12 complete)
2. **Requirements stable** (UI redesign done, features locked)
3. **Architecture known** (no more guessing at structure)
4. **Natural breaking point** before production deployment (Stages 14-15)
5. **Performance work** naturally requires modularization
6. **Can test old vs new** implementations side-by-side

### Why NOT Earlier?
- ❌ Requirements still evolving (UI changes, new features)
- ❌ Don't know final architecture shape yet
- ❌ Premature abstraction is costly
- ❌ Would lose 2-3 weeks of velocity
- ❌ Risk breaking working, tested code

### Current Pain Points
- `combat.js`: **1,605 LOC, 62 functions** - God Object antipattern
- `server.js`: **1,364 LOC, 36 socket handlers** - Mixed concerns
- `app.js`: **1,504 LOC** - Client monolith
- Total: ~11,750 LOC system, 5.6% debt ratio (excellent but growing)

---

## Scope

### Performance Targets
- 10 concurrent battles
- 5 players + GM per battle
- 10 ships per battle (GM-controlled)
- Total: 60 players, 110 ships concurrent
- Latency: <200ms average
- Combat resolution: <100ms per attack

### Features
- Load testing infrastructure
- Network resilience (reconnection, state sync)
- Performance monitoring
- Optimization: broadcasts, state sync, writes
- Horizontal scaling architecture

### Tests
- Performance tests: ~300 LOC
- Load tests: ~200 LOC
- Network simulation: ~150 LOC

## Sub-Stages

### 13.0: COMPREHENSIVE REFACTORING (6k tokens, ~600 LOC)

**Goal:** Modularize monolithic files, apply design patterns, prepare for production scale

#### 13.0A: Refactor `lib/combat.js` (2k tokens, ~250 LOC)

**Current Issues:**
- 1,605 LOC God Object
- 62 exported functions (too many responsibilities)
- Mixes data, logic, utilities, validation

**New Structure:**
```
lib/
  combat/
    index.js              - Main exports, orchestration
    core.js               - Attack resolution, damage calculation
    movement.js           - Hex grid utilities, movement validation
    validation.js         - Input validation functions
    formatting.js         - Attack result formatting
    data/
      ships.js            - SHIPS constant (deprecated, migrate to ship-registry)
      crew.js             - CREW constant (deprecated)
```

**Actions:**
- Extract movement functions → `combat/movement.js`
- Extract validation functions → `combat/validation.js`
- Extract formatting → `combat/formatting.js`
- Core combat logic stays in `combat/core.js`
- `combat/index.js` re-exports for backward compatibility
- Update all imports incrementally
- **Keep tests passing throughout** (critical!)

**Design Patterns Applied:**
- **Single Responsibility Principle** - Each module has one job
- **Facade Pattern** - `index.js` provides simple interface
- **Module Pattern** - Clear encapsulation

#### 13.0B: Refactor `server.js` (2k tokens, ~250 LOC)

**Current Issues:**
- 1,364 LOC with mixed concerns
- 36 socket event handlers in one file
- HTTP setup + game state + socket handlers all mixed

**New Structure:**
```
server/
  index.js                    - HTTP/Express setup, main entry
  socket-handlers/
    connection.js             - Player connection lifecycle
    combat.js                 - Combat event handlers
    movement.js               - Movement event handlers
    space.js                  - Space combat session management
  game-state/
    manager.js                - Centralized game state management
    sessions.js               - Combat session tracking
  middleware/
    auth.js                   - Future: authentication
    logging.js                - Request logging
```

**Actions:**
- Extract socket handlers by domain (combat, movement, space, connection)
- Create GameStateManager class (State Pattern)
- Create CombatSessionManager for active battles
- `server/index.js` stays thin (HTTP + initialization only)
- Socket handlers register with central dispatcher
- All handlers testable in isolation

**Design Patterns Applied:**
- **Command Pattern** - Socket events as commands
- **State Pattern** - Game state management
- **Observer Pattern** - State change notifications
- **Dependency Injection** - Pass io, gameState to handlers

#### 13.0C: Refactor `public/app.js` (2k tokens, ~250 LOC)

**Current Issues:**
- 1,504 LOC client monolith
- UI + networking + state all mixed
- Hard to test, hard to extend

**New Structure:**
```
public/
  js/
    app.js                    - Main initialization, wiring
    ui/
      combat-log.js           - Combat log rendering
      hex-grid.js             - Hex grid rendering & interaction
      controls.js             - Buttons, forms, user input
      status.js               - Connection status, player info
    networking/
      socket.js               - Socket.io wrapper/abstraction
      logger.js               - Client logger (already exists inline)
      events.js               - Event handler registration
    state/
      game-state.js           - Client-side game state management
      ship-state.js           - Ship positions, stats tracking
```

**Actions:**
- Extract UI components into separate modules
- Create SocketManager wrapper (easier to mock for testing)
- Create ClientGameState class
- `app.js` becomes orchestration layer only
- Load modules with ES6 modules or simple script tags
- Each module independently testable

**Design Patterns Applied:**
- **MVC/MVP Pattern** - Separate UI from state
- **Observer Pattern** - UI updates from state changes
- **Facade Pattern** - SocketManager abstracts Socket.io
- **Module Pattern** - Clean separation of concerns

---

### 13.1: Performance Testing Infrastructure (2k tokens, ~200 LOC)
- Load testing framework (100+ connections)
- Latency simulation (500ms delays)
- Packet loss simulation (5% loss)
- Performance metrics collection
- Dev mode performance dashboard
- Automated regression tests

### 13.2: Network Resilience (2k tokens, ~250 LOC)
- Auto-reconnect on disconnect
- Auto-rejoin battle (restore state)
- Disconnected state indicators (UI)
- State sync recovery (full re-send)
- Action timeout (defaults after 30sec)
- Heartbeat monitoring

### 13.3: Optimization - Broadcasts (2k tokens, ~150 LOC)
- Combat log batching (group updates)
- Debounce rapid updates
- Room-based isolation (Socket.io)
- Selective broadcasts (only relevant players)

### 13.4: Optimization - State Sync (2k tokens, ~150 LOC)
- Delta updates (only changes)
- State compression
- Lazy loading (don't send hidden data)
- State size monitoring (warn >100KB)

### 13.5: Security Hardening (OWASP Top 10) (2k tokens, ~150 LOC)
- **A01: Broken Access Control**
  - Battle room authentication
  - GM vs Player roles
  - Permission system
- **A03: Injection**
  - Input validation all socket events
  - Sanitize user input (ship names, chat)
  - Parameterized queries (when DB added)
- **A05: Security Misconfiguration**
  - helmet.js middleware (security headers)
  - Rate limiting (express-rate-limit)
  - CORS policy
  - Remove server version headers
- **A07: XSS**
  - DOMPurify for user-generated content
  - Content Security Policy headers
  - Escape all output
- **A09: Security Logging**
  - winston logging framework
  - Audit trail (who did what)
  - Intrusion detection basics
- **Security Testing**
  - OWASP ZAP automated scan
  - Penetration testing checklist
  - Security regression tests

### 13.6: Scalability Architecture (1k tokens, ~50 LOC)
- Stateless server design (complete)
- Session state externalization
- Health check endpoints
- Load balancer readiness
- Horizontal scaling prep (documentation)

---

## Incremental Refactoring (Stages 10-12)

**Strategy:** Extract small modules as features are added. Don't wait for Stage 13 to start improving structure.

### Stage 10: Critical Hit Effects
- Extract `lib/critical-hits.js` - Critical hit resolution logic
- Extract `lib/damage-effects.js` - System damage effects (M-Drive, PP, etc.)
- Keep focused, single-purpose modules

### Stage 11: Missiles & Sandcasters
- Extract `lib/weapons/missiles.js` - Missile launch, tracking, resolution
- Extract `lib/weapons/sandcasters.js` - Countermeasure logic
- Consider `lib/weapons/index.js` - Weapon type registry

### Stage 12: Boarding Actions
- Extract `lib/boarding.js` - Boarding action resolution
- Extract `lib/crew-combat.js` - Crew-to-crew combat (if different from ship combat)

**Benefits:**
- Each stage adds ~100-200 LOC in focused modules
- Reduces `combat.js` bloat incrementally
- Easier to test in isolation
- Sets pattern for Stage 13 major refactor
- **Maintains velocity** while improving structure

---

## Acceptance Criteria

### Refactoring (13.0)
- [ ] `combat.js` split into 5+ focused modules
- [ ] `server.js` split into handlers + game state
- [ ] `app.js` split into UI + networking + state
- [ ] All existing tests still pass (zero regressions)
- [ ] No breaking changes to external API
- [ ] Code complexity reduced (measurable via linting)
- [ ] Module count increased, file sizes decreased

### Performance (13.1-13.4)
- [ ] 100+ concurrent connections supported
- [ ] Load tests pass (10 battles, 60 players)
- [ ] Latency <200ms under load
- [ ] Reconnection works seamlessly
- [ ] State sync recovers all data
- [ ] Performance metrics visible (dev mode)
- [ ] No memory leaks under sustained load

### Security (13.5)
- [ ] OWASP Top 10 security tests pass
- [ ] Input validation on all socket events
- [ ] XSS protection (sanitized inputs)
- [ ] Rate limiting prevents DOS
- [ ] Security headers configured (helmet.js)
- [ ] Audit logging functional

### Scalability (13.6)
- [ ] Stateless server confirmed (can run multiple instances)
- [ ] Health check endpoint implemented
- [ ] Load balancer documentation written
- [ ] Horizontal scaling tested (2+ server instances)
