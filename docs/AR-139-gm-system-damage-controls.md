# AR-139: GM Ship Systems Damage Controls

## Summary
GM needs ability to directly damage, disable, or destroy ship systems for narrative events (sabotage, accidents, ambushes). Currently no UI exists for this.

## Use Case: Saboteur Scenario
> A saboteur got access to the Ship's Power Plant and rigged it to blow up. It blows up while the ship is in orbit around a Mainworld. With Power Plant down there's not enough power to run any ship systems. Nothing works.

**GM needs:** One-click ability to destroy the Power Plant
**Result:** Ship loses all power, systems go offline, emergency backup kicks in

## Requirements

### 139.1 GM System Damage UI
Location: GM's Ship Systems Status panel (gear icon)

```
┌─────────────────────────────────────────┐
│ ⚙ SHIP SYSTEMS - GM CONTROLS           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                         │
│ Power Plant      [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ Maneuver Drive   [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ Jump Drive       [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ Life Support     [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ Sensors          [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ Weapons Bay 1    [████████] 100%        │
│   [Damage 25%] [Disable] [Destroy]      │
│                                         │
│ [RESTORE ALL]                           │
└─────────────────────────────────────────┘
```

### 139.2 Damage States
| State | Effect | Repairable? |
|-------|--------|-------------|
| **Operational** (100%) | Normal function | N/A |
| **Damaged** (75/50/25%) | Reduced performance, -DM | Yes, in field |
| **Disabled** (0%) | Non-functional | Yes, at shipyard |
| **Destroyed** | Gone, must replace | No, buy new |

### 139.3 Power Plant Cascade Effects
When Power Plant disabled/destroyed:
- All powered systems go offline
- Emergency backup activates (if present)
- Bridge displays "EMERGENCY POWER" warning
- Limited systems available

### 139.4 Emergency Backup Power Plant
**Capacity:** Life Support + 1 Power Point
**Duration:** 72 hours (standard emergency reserve)
**Limitations:**
- Cannot run M-Drive or J-Drive
- Sensors passive only
- No weapons
- Minimal lighting
- One additional system at GM discretion

```javascript
const EMERGENCY_POWER = {
  capacity: 2,  // 1 for life support, 1 spare
  duration: 72, // hours
  systems: ['life-support'], // always on
  spare: 1      // PP available for one other system
};
```

### 139.5 System Priority Queue (Emergency Power)
When on backup power, crew must choose what to power:
```
┌─────────────────────────────────────────┐
│ ⚠ EMERGENCY POWER - SELECT ONE SYSTEM  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Life Support: ✓ ACTIVE (Required)      │
│                                         │
│ Available Power: 1 PP                   │
│ Choose ONE additional system:           │
│                                         │
│ ○ Communications (distress beacon)      │
│ ○ Sensors (passive only)                │
│ ○ Computer (basic navigation)           │
│ ○ Airlock (EVA operations)              │
│                                         │
│ [CONFIRM SELECTION]                     │
└─────────────────────────────────────────┘
```

## Implementation Stages

### Stage 139.1: GM Damage Buttons
**Risk:** LOW | **LOC:** ~100 | **Time:** 2hr
- Add damage controls to GM Ship Systems panel
- Socket handler: `ops:gmDamageSystem { systemId, level }`
- Levels: 'damage25', 'damage50', 'damage75', 'disable', 'destroy'
- Broadcast system state change to bridge

### Stage 139.2: System State Effects
**Risk:** MEDIUM | **LOC:** ~150 | **Time:** 3hr
- Each system tracks damage level
- Damaged systems apply -DM to related rolls
- Disabled systems return "offline" for all checks
- Destroyed systems removed from ship data

### Stage 139.3: Power Plant Cascade
**Risk:** MEDIUM | **LOC:** ~100 | **Time:** 2hr
- When power plant disabled: trigger cascade
- All systems go to "unpowered" state
- Emergency power check
- Bridge UI shows emergency mode

### Stage 139.4: Emergency Backup System
**Risk:** LOW | **LOC:** ~80 | **Time:** 2hr
- Add `emergencyPower` to ship template
- 72-hour timer when activated
- System priority selection UI
- Countdown display on bridge

### Stage 139.5: Repair Integration
**Risk:** LOW | **LOC:** ~50 | **Time:** 1hr
- Engineer can repair damaged systems
- Disabled requires shipyard or exceptional roll
- Destroyed requires replacement purchase

## Ship Template Changes
```javascript
{
  systems: {
    powerPlant: { rating: 2, status: 'operational', damage: 0 },
    mDrive: { rating: 2, status: 'operational', damage: 0 },
    jDrive: { rating: 2, status: 'operational', damage: 0 },
    lifeSupport: { status: 'operational', damage: 0 },
    sensors: { grade: 'civilian', status: 'operational', damage: 0 },
    computer: { rating: 5, status: 'operational', damage: 0 }
  },
  emergencyPower: {
    installed: true,
    capacity: 2,
    duration: 72,
    active: false,
    hoursRemaining: 72
  }
}
```

## Socket Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `ops:gmDamageSystem` | Client→Server | GM inflicts damage |
| `ops:systemDamaged` | Server→Clients | Broadcast state change |
| `ops:emergencyPower` | Server→Clients | Emergency mode activated |
| `ops:selectEmergencySystem` | Client→Server | Crew chooses powered system |
| `ops:repairSystem` | Client→Server | Engineer repair attempt |

## Dependencies
- Existing ship systems status panel
- Engineer repair queue (AR-49)

## Risk: MEDIUM
- Cascade effects need careful testing
- Emergency power UX is new pattern
- Must not break existing damage/repair flow

## Estimate
| Stage | LOC | Time |
|-------|-----|------|
| 139.1 GM damage buttons | 100 | 2hr |
| 139.2 System state effects | 150 | 3hr |
| 139.3 Power cascade | 100 | 2hr |
| 139.4 Emergency backup | 80 | 2hr |
| 139.5 Repair integration | 50 | 1hr |
| 139.6 GM Settings UI | 60 | 1hr |
| **Total** | **540** | **11hr** |

---

## Stage 139.6: GM Settings UI (Added)

**Risk:** LOW | **LOC:** ~60 | **Time:** 1hr

Wire up the existing ⚙ button on GM Setup screen to show settings modal.

### Settings to expose:
- **Jumps Cost Fuel** (T/F) - already has `ops:setNoFuelMode` handler
- **Require Position Verification** (T/F) - already has `ops:setRequirePositionVerification` handler

### Implementation:
```javascript
// Add click handler for btn-gm-settings
document.getElementById('btn-gm-settings').addEventListener('click', showGMSettingsModal);

function showGMSettingsModal() {
  // Modal with toggle switches for each setting
  // Emit ops:setNoFuelMode and ops:setRequirePositionVerification on change
}
```

### GM Repair Controls (rolled into 139.1):
Alongside damage buttons, add repair buttons:
```
[Damage 25%] [Disable] [Destroy] | [Repair 25%] [Restore]
```
- Repair 25%: Increase system health by 25%
- Restore: Reset system to 100% operational
