# AUTORUN-OPS-3: Ship Systems & Jump Travel

**Created:** 2025-11-30
**Risk:** LOW
**Estimated Time:** 2-3 hours
**Branch:** `feature/ops-stage-6-7`

## Overview

Stage 6: Ship system damage display and engineer repairs
Stage 7: Jump drive operations and time advancement

## Prerequisites

- AUTORUN-OPS-2 complete (Stage 3+4) ✅
- All 324 tests passing ✅

---

## Stage 6: Ship Systems & Damage

### 6.1 Ship Crits Data Structure

Store crits in `ship.current_state.crits`:

```javascript
{
  crits: {
    sensors: [{ severity: 2, repaired: false, timestamp: 1234567890 }],
    mDrive: [{ severity: 1, repaired: true, temporary: true, repairedAt: 1234567891 }],
    // ... other locations
  },
  systemStatus: {
    sensors: { maxRange: 'medium', dm: -2 },
    mDrive: { thrustPenalty: 1, controlDM: -1 },
    // computed from crits
  }
}
```

### 6.2 Backend Functions

Create `lib/operations/ship-systems.js`:

```javascript
// Import existing crit functions
const { getTotalSeverity, attemptRepair, applyCriticalHit } = require('../critical-hits');
const { getMDriveEffects, getSensorsEffects, ... } = require('../damage-effects');

// Get all system statuses for a ship
function getSystemStatuses(ship) {
  const crits = ship.current_state?.crits || {};
  return {
    mDrive: getMDriveEffects(getTotalSeverity({ crits }, 'mDrive')),
    sensors: getSensorsEffects(getTotalSeverity({ crits }, 'sensors')),
    powerPlant: getPowerPlantEffects(getTotalSeverity({ crits }, 'powerPlant')),
    // ... all systems
  };
}

// Apply crit to ship (for GM or combat result import)
function applySystemDamage(shipId, location, severity) {
  const ship = getShip(shipId);
  const crits = ship.current_state?.crits || initCrits();
  applyCriticalHit({ crits }, location, severity);
  updateShipState(shipId, { crits });
  return getSystemStatuses({ current_state: { crits } });
}

// Engineer repair action
function repairSystem(shipId, location, engineerSkill) {
  const ship = getShip(shipId);
  const crits = ship.current_state?.crits || {};
  const result = attemptRepair({ crits }, location, engineerSkill);
  if (result.success) {
    updateShipState(shipId, { crits });
  }
  return result;
}
```

### 6.3 Socket Handlers

Add to `operations.handlers.js`:

```javascript
// GM applies damage to ship system
socket.on('ops:applySystemDamage', (data) => {
  // GM only, apply crit, broadcast status update
});

// Engineer attempts repair
socket.on('ops:repairSystem', (data) => {
  // Role check (engineer), skill check, broadcast result
});

// Get current system statuses
socket.on('ops:getSystemStatus', (data) => {
  // Return all system statuses for ship
});
```

### 6.4 Engineer Role Panel

In `app.js`, update `getRoleDetailContent()` for Engineer:

```javascript
case 'engineer':
  return `
    <div class="system-status-grid">
      ${renderSystemStatus('M-Drive', systemStatus.mDrive)}
      ${renderSystemStatus('Power Plant', systemStatus.powerPlant)}
      ${renderSystemStatus('Sensors', systemStatus.sensors)}
      ${renderSystemStatus('J-Drive', systemStatus.jDrive)}
      ${renderSystemStatus('Computer', systemStatus.computer)}
    </div>
    <div class="repair-controls">
      <select id="repair-target">
        ${damagedSystems.map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
      <button onclick="attemptRepair()">Attempt Repair</button>
    </div>
  `;
```

### 6.5 GM Damage Controls

Add to GM controls in bridge view:

```html
<button onclick="showDamageModal()">Apply Damage</button>

<!-- Modal -->
<select id="damage-system">
  <option value="sensors">Sensors</option>
  <option value="mDrive">M-Drive</option>
  <!-- ... -->
</select>
<input type="number" id="damage-severity" min="1" max="6" value="1">
<button onclick="applyDamage()">Apply</button>
```

---

## Stage 7: Jump Travel

### 7.1 Jump State Data Structure

Store in `ship.current_state.jump`:

```javascript
{
  jump: {
    inJump: false,
    jumpStartDate: null,    // When jump started
    jumpEndDate: null,      // When jump ends (start + 168 hours)
    destination: null,      // Target system name
    jumpDistance: 0,        // Parsecs (1-6)
    fuelConsumed: 0         // Tons consumed
  }
}
```

### 7.2 Backend Functions

Create `lib/operations/jump.js`:

```javascript
const { calculateJumpFuel } = require('../ship-jump-drive');

// Initiate jump
function initiateJump(shipId, campaignId, destination, distance) {
  const ship = getShip(shipId);
  const campaign = getCampaign(campaignId);

  // Calculate fuel needed
  const hullTonnage = ship.ship_data?.hull || 100;
  const fuelNeeded = calculateJumpFuel(hullTonnage, distance);
  const currentFuel = ship.current_state?.fuel || 0;

  if (currentFuel < fuelNeeded) {
    return { success: false, error: 'Insufficient fuel' };
  }

  // Calculate jump end date (168 hours = 7 days)
  const jumpEndDate = advanceDate(campaign.current_date, 168, 0);

  updateShipState(shipId, {
    jump: {
      inJump: true,
      jumpStartDate: campaign.current_date,
      jumpEndDate,
      destination,
      jumpDistance: distance,
      fuelConsumed: fuelNeeded
    },
    fuel: currentFuel - fuelNeeded
  });

  return { success: true, jumpEndDate, fuelConsumed: fuelNeeded };
}

// Complete jump (called when time reaches jumpEndDate)
function completeJump(shipId, campaignId) {
  const ship = getShip(shipId);
  const jump = ship.current_state?.jump;

  if (!jump?.inJump) return { success: false, error: 'Not in jump' };

  // Update campaign location
  updateCampaign(campaignId, { current_system: jump.destination });

  // Clear jump state
  updateShipState(shipId, {
    jump: { inJump: false }
  });

  return { success: true, arrivedAt: jump.destination };
}

// Helper: advance date by hours/minutes
function advanceDate(dateStr, hours, minutes) {
  // Same logic as ops:advanceTime handler
}
```

### 7.3 Socket Handlers

```javascript
// Astrogator initiates jump
socket.on('ops:initiateJump', (data) => {
  // Role check (astrogator or pilot), fuel check
  // Set jump state, log entry, broadcast
});

// Time advance checks for jump completion
// Modify ops:advanceTime to check if new date >= jumpEndDate
```

### 7.4 Astrogator Role Panel

```javascript
case 'astrogator':
  if (ship.current_state?.jump?.inJump) {
    return `
      <div class="jump-status">
        <h4>IN JUMP SPACE</h4>
        <p>Destination: ${jump.destination}</p>
        <p>Arrival: ${jump.jumpEndDate}</p>
        <div class="jump-countdown">${hoursRemaining} hours remaining</div>
      </div>
    `;
  }
  return `
    <div class="jump-controls">
      <input type="text" id="jump-destination" placeholder="Destination system">
      <select id="jump-distance">
        <option value="1">Jump-1 (1 parsec)</option>
        <option value="2">Jump-2 (2 parsecs)</option>
        <!-- ... up to ship's jump rating -->
      </select>
      <div class="fuel-estimate">Fuel required: <span id="fuel-needed">--</span> tons</div>
      <button onclick="initiateJump()">Initiate Jump</button>
    </div>
  `;
```

---

## Tests

### Stage 6 Tests (tests/ship-systems.test.js)

1. getSystemStatuses returns all systems
2. applySystemDamage stores crit in current_state
3. repairSystem calls attemptRepair correctly
4. System status computed from crit severity
5. Multiple crits accumulate severity
6. Repaired crits don't count toward severity

### Stage 7 Tests (tests/jump.test.js)

1. initiateJump checks fuel availability
2. initiateJump calculates correct fuel consumption
3. initiateJump sets 168-hour duration
4. completeJump updates campaign location
5. completeJump clears jump state
6. Cannot initiate jump while in jump
7. advanceDate handles year rollover

---

## Execution Order

1. Create feature branch
2. **Stage 6.2**: Create `lib/operations/ship-systems.js`
3. **Stage 6.3**: Add socket handlers
4. **Stage 6.4**: Engineer panel UI
5. **Stage 6.5**: GM damage controls
6. **Stage 6 Tests**: Write and verify
7. **Stage 7.2**: Create `lib/operations/jump.js`
8. **Stage 7.3**: Add socket handlers
9. **Stage 7.4**: Astrogator panel UI
10. **Stage 7 Tests**: Write and verify
11. Run full test suite (expect ~340 tests)
12. Commit and merge

---

## TODO: Future - Refueling System

**Not in this autorun - tracked for Stage 8+**

Refueling options needed:
1. **Starport Purchase** - Buy refined fuel at starport (Cr500/ton)
2. **Wilderness Refueling** - Scoop water from ocean/ice (free, unrefined)
3. **Gas Giant Skimming** - Scoop hydrogen from gas giant (free, unrefined)

Unrefined fuel rules:
- Works but with penalty until processed
- Risk of misjump (DM-2 to jump check)
- Can be refined by ship's fuel processor (if equipped)
- Processing time: 1 ton per hour typically

---

## Success Criteria

- [ ] Engineer can see damaged systems
- [ ] Engineer can attempt repairs (skill check)
- [ ] GM can apply damage to any system
- [ ] System effects shown (thrust penalty, sensor limits, etc.)
- [ ] Astrogator can initiate jump with destination
- [ ] Jump consumes correct fuel
- [ ] Ship shows "In Jump" status for 168 hours
- [ ] Jump completion updates campaign location
- [ ] All existing 324 tests still pass
- [ ] New tests for ship systems and jump
