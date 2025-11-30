# AUTORUN-OPS-4: Login Polish + Refueling

**Created:** 2025-11-30
**Status:** PLANNED
**Risk:** LOW

---

## Overview

Two complementary stages:
- **Stage 3.5** - Polish login/join flow gaps discovered in audit
- **Stage 8** - Refueling system (new feature per user TODO)

---

## Stage 3.5: Login/Join Polish

### 3.5.1 Campaign Code Display
**Files:** `public/operations/app.js`, `public/operations/index.html`

- Display campaign ID prominently on GM setup screen
- Add "Copy Code" button next to campaign name
- Show short instruction: "Share this code with players"
- Format: Show first 8 chars of UUID or full ID

### 3.5.2 Add Ship Modal
**Files:** `public/operations/app.js`, `public/operations/index.html`, `lib/socket-handlers/operations.handlers.js`

- Create `template-add-ship` modal
- List available ship templates from seed data
- Ship template options: Scout, Free Trader, Far Trader, Patrol Corvette, etc.
- Fields: Ship name (custom), Template selection, Party ship checkbox
- Wire up `btn-add-ship` to show modal
- `ops:addShip` handler already exists, just needs template_id

### 3.5.3 Live Slot Status
**Files:** `lib/socket-handlers/operations.handlers.js`, `public/operations/app.js`

- Track connected sockets per campaign in memory (Map)
- On `ops:selectPlayerSlot` - mark slot as "in-use"
- On disconnect - release slot
- Emit `ops:slotStatusUpdate` to campaign room
- Show "In Use" badge on slot if another player has it

### 3.5.4 Real-time Role Updates
**Files:** `lib/socket-handlers/operations.handlers.js`

- In `ops:assignRole` handler, emit `ops:crewUpdate` to ship room
- Include: playerId, role, roleInstance, slotName
- Client already listens for `ops:crewUpdate` and re-renders

### 3.5.5 Session Reconnect
**Files:** `lib/socket-handlers/operations.handlers.js`, `public/operations/app.js`

- Store session state in localStorage: campaignId, playerId, shipId, role
- On socket connect, emit `ops:reconnect` with stored data
- Server validates and restores context
- Navigate directly to bridge if session valid

### 3.5.6 Slot Reservation
**Files:** `lib/socket-handlers/operations.handlers.js`

- In `ops:selectPlayerSlot`, check if slot already claimed by another socket
- Return error if slot in use
- Release reservation on disconnect or logout

---

## Stage 8: Refueling System

### 8.1 Fuel Types
**Files:** `lib/operations/refueling.js` (NEW)

Fuel quality types:
- **Refined** - Full efficiency, no penalties
- **Unrefined** - Works but -2 DM on jump checks, risk of misjump
- **Processed** - Unrefined that's been processed (takes time)

```javascript
const FUEL_TYPES = {
  refined: { name: 'Refined', dmModifier: 0, misjumpRisk: 0 },
  unrefined: { name: 'Unrefined', dmModifier: -2, misjumpRisk: 0.05 },
  processed: { name: 'Processed', dmModifier: 0, misjumpRisk: 0 }
};
```

### 8.2 Refueling Sources
**Files:** `lib/operations/refueling.js`

Sources and their outputs:
- **Starport (A-B)** - Refined fuel, costs Cr500/ton
- **Starport (C-D)** - Unrefined fuel, costs Cr100/ton
- **Gas Giant Skimming** - Unrefined fuel, free, requires Pilot check
- **Wilderness (water)** - Unrefined fuel, free, requires time

```javascript
const FUEL_SOURCES = {
  starportRefined: { type: 'refined', cost: 500, time: 0 },
  starportUnrefined: { type: 'unrefined', cost: 100, time: 0 },
  gasGiant: { type: 'unrefined', cost: 0, time: 4, skillCheck: 'pilot' },
  wilderness: { type: 'unrefined', cost: 0, time: 8, skillCheck: null }
};
```

### 8.3 Fuel Processing
**Files:** `lib/operations/refueling.js`

- Ships with fuel processors can convert unrefined → processed
- Processing time: 1 hour per 10 tons
- Requires operational power plant
- Track fuel quality in `ship.current_state.fuelQuality`

```javascript
function processFuel(shipId, tons) {
  // Convert unrefined to processed
  // Returns processing time in hours
}
```

### 8.4 Refueling Functions
**Files:** `lib/operations/refueling.js`

```javascript
function canRefuel(shipId, source) {
  // Check: location appropriate, capacity available
}

function refuel(shipId, campaignId, source, tons) {
  // Add fuel, deduct credits if applicable
  // Set fuel quality
  // Return time taken
}

function getFuelStatus(shipId) {
  // Current fuel, quality breakdown, processing status
}
```

### 8.5 Socket Handlers
**Files:** `lib/socket-handlers/operations.handlers.js`

New handlers:
- `ops:getRefuelOptions` - Available sources at current location
- `ops:refuel` - Execute refueling from source
- `ops:processFuel` - Start fuel processing
- `ops:getFuelStatus` - Current fuel state

### 8.6 Engineer Panel - Fuel UI
**Files:** `public/operations/app.js`

Update Engineer role detail panel:
- Show fuel quality breakdown (refined/unrefined/processed)
- Refuel button (opens modal)
- Process fuel button (if unrefined available)
- Processing progress indicator

### 8.7 Refuel Modal
**Files:** `public/operations/index.html`, `public/operations/app.js`

- `template-refuel` modal
- Show available sources based on location
- Display cost, time, fuel quality
- Quantity slider/input
- Confirm button

### 8.8 Tests
**Files:** `tests/refueling.test.js` (NEW)

- Fuel type definitions
- canRefuel validation
- refuel execution (starport, gas giant, wilderness)
- Fuel processing time calculation
- Fuel quality tracking
- Credit deduction

---

## Execution Order

1. **Stage 3.5.1** - Campaign code display
2. **Stage 3.5.2** - Add ship modal
3. **Stage 3.5.3** - Live slot status
4. **Stage 3.5.4** - Real-time role updates
5. **Stage 3.5.5** - Session reconnect
6. **Stage 3.5.6** - Slot reservation
7. **Stage 8.1-8.4** - Create refueling.js module
8. **Stage 8.5** - Socket handlers
9. **Stage 8.6-8.7** - Engineer panel + refuel modal
10. **Stage 8.8** - Refueling tests

---

## Success Criteria

- [ ] GM can see and copy campaign code
- [ ] GM can add ships from template list
- [ ] Players see real-time slot availability
- [ ] Role changes broadcast to other players
- [ ] Page refresh restores session
- [ ] Two players can't claim same slot
- [ ] Ships can refuel from starport, gas giant, wilderness
- [ ] Unrefined fuel applies jump penalties
- [ ] Fuel can be processed to remove penalties
- [ ] All new tests pass
- [ ] All 349 existing tests pass

---

## Files to Create
- `lib/operations/refueling.js`
- `tests/refueling.test.js`

## Files to Modify
- `lib/operations/index.js` (add refueling exports)
- `lib/socket-handlers/operations.handlers.js` (add refuel handlers)
- `public/operations/index.html` (add ship modal, refuel modal)
- `public/operations/app.js` (campaign code, ship modal, fuel UI, reconnect)
- `public/operations/styles.css` (fuel quality indicators)
- `tests/run-all-tests.js` (add refueling.test.js)
