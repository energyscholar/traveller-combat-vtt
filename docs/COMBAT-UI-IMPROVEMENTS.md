# Combat UI Improvements - Enemy Display & Phase Tracker
## Design Document for Stage 14.5 / 15

**Date:** 2025-11-14
**Session:** 8 (Planning)
**Priority:** HIGH - Critical UX improvements
**Estimated Time:** 8-12 hours

---

## Executive Summary

Two critical UI features are missing from the combat system:

1. **Enemy Ship Display** - Players cannot see enemy ship status (currently hidden in log)
2. **Initiative & Phase Tracker** - No visual indication of turn order or Traveller combat phases

Both are essential for production-ready combat. This document proposes comprehensive solutions.

---

## Problem 1: Enemy Ship Visibility

### Current Issues

❌ **No visual representation of enemy ship**
- Players can't see enemy hull, armor, or weapons
- Damage to enemy is invisible (only in log)
- Log file will be hidden in production
- Players feel "blind" in combat

❌ **Combat log is the only source of information**
- Log scrolls away quickly in multi-turn combat
- Requires reading text instead of visual cues
- Not production-ready (logs contain debug info)

### Proposed Solution: Dual Ship Display Panel

**Layout:** Side-by-side ship status cards (like a "versus" screen)

```
┌─────────────────────────────────────────────────────────────┐
│                      COMBAT TACTICAL DISPLAY                │
├──────────────────────────┬──────────────────────────────────┤
│  👤 YOUR SHIP            │           🎯 ENEMY SHIP          │
│  ════════════            │           ═══════════            │
│                          │                                  │
│  ⚡ Type-S Scout         │           📦 Free Trader         │
│  ─────────────           │           ─────────────          │
│                          │                                  │
│  🛡️ HULL:  [███████░░░]  │  🛡️ HULL:  [██████░░░░]         │
│     32/40  (80%)         │     48/80  (60%)                 │
│                          │                                  │
│  🔰 ARMOR: [████] 4      │  🔰 ARMOR: [██] 2                │
│                          │                                  │
│  🚀 THRUST: 2G           │  🚀 THRUST: 1G                   │
│                          │                                  │
│  📍 RANGE: Short         │  💥 DAMAGE THIS TURN: -8 HP     │
│                          │                                  │
│  ⚔️ WEAPONS:             │  ⚔️ WEAPONS:                     │
│  • Pulse Laser (Ready)   │  • Beam Laser (Fired)            │
│  • Sandcaster (2/20)     │  • Beam Laser (Fired)            │
│  • Missiles (8/12)       │                                  │
│                          │                                  │
│  👥 CREW STATUS:         │  👥 CREW STATUS:                 │
│  • Pilot: Ready          │  • Pilot: Evading                │
│  • Gunner: Fired         │  • Gunner: Fired (x2)            │
│  • Engineer: Standby     │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

### UI Components

#### 1. Ship Status Card (Component)

**File:** `public/components/ship-status-card.js`

```javascript
class ShipStatusCard {
  constructor(shipData, isEnemy = false) {
    this.shipData = shipData;
    this.isEnemy = isEnemy;
    this.element = null;
  }

  render() {
    return `
      <div class="ship-status-card ${this.isEnemy ? 'enemy' : 'player'}">
        <div class="ship-header">
          <span class="ship-icon">${this.isEnemy ? '🎯' : '👤'}</span>
          <span class="ship-label">${this.isEnemy ? 'ENEMY SHIP' : 'YOUR SHIP'}</span>
        </div>

        <div class="ship-name">
          ${this.shipData.icon} ${this.shipData.name}
        </div>

        <div class="ship-stats">
          ${this.renderHullBar()}
          ${this.renderArmorBar()}
          ${this.renderThrust()}
          ${this.renderRange()}
          ${this.renderDamageIndicator()}
        </div>

        <div class="ship-weapons">
          <h4>⚔️ WEAPONS:</h4>
          ${this.renderWeaponsList()}
        </div>

        <div class="ship-crew">
          <h4>👥 CREW STATUS:</h4>
          ${this.renderCrewStatus()}
        </div>
      </div>
    `;
  }

  renderHullBar() {
    const percent = (this.shipData.hull / this.shipData.maxHull) * 100;
    const barColor = percent > 66 ? '#22c55e' : percent > 33 ? '#f59e0b' : '#ef4444';
    const bars = Math.ceil(percent / 10);

    return `
      <div class="stat-row hull">
        <span class="stat-label">🛡️ HULL:</span>
        <div class="stat-bar">
          <div class="bar-fill" style="width: ${percent}%; background: ${barColor};">
            ${'█'.repeat(bars)}${'░'.repeat(10 - bars)}
          </div>
        </div>
        <span class="stat-value">${this.shipData.hull}/${this.shipData.maxHull} (${Math.round(percent)}%)</span>
      </div>
    `;
  }

  renderDamageIndicator() {
    if (!this.shipData.damageThisTurn || this.shipData.damageThisTurn === 0) return '';

    return `
      <div class="damage-indicator">
        <span class="damage-flash">💥 DAMAGE THIS TURN: -${this.shipData.damageThisTurn} HP</span>
      </div>
    `;
  }
}
```

#### 2. Damage Flash Animation

**CSS Animation:**

```css
@keyframes damage-flash {
  0%, 100% {
    background: rgba(239, 68, 68, 0);
    transform: scale(1);
  }
  50% {
    background: rgba(239, 68, 68, 0.3);
    transform: scale(1.05);
  }
}

.damage-indicator {
  animation: damage-flash 1s ease-in-out;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  color: #ef4444;
}
```

#### 3. Real-time Updates

**Event Listener:**

```javascript
// Listen for damage events
socket.on('space:damageApplied', (data) => {
  const { targetShip, damage, newHull } = data;

  // Update ship status card
  updateShipStatus(targetShip, {
    hull: newHull,
    damageThisTurn: damage
  });

  // Flash damage indicator
  flashDamageIndicator(targetShip, damage);

  // Clear damage indicator after 2 seconds
  setTimeout(() => {
    clearDamageIndicator(targetShip);
  }, 2000);
});
```

---

## Problem 2: Initiative & Phase Tracker

### Current Issues

❌ **No initiative display**
- Players don't know who goes first
- Turn order is unclear in multiplayer
- No Roll20-style initiative tracker

❌ **No phase tracking**
- Traveller has specific combat phases
- Players don't know when they can act
- No visual indication of current phase
- Crew actions aren't gated by phase

### Traveller Combat Phases (Official Rules)

1. **🎯 Initiative Phase** - Roll 2D6 + Pilot skill (once per round)
2. **🚀 Maneuver Phase** - Pilot: Movement, evasion, range changes
3. **🔧 Engineering Phase** - Engineer: Repairs, power allocation
4. **⚔️ Weapons Phase** - Gunner: Fire weapons, launch missiles
5. **🛡️ Defense Phase** - Point defense, sandcasters (reaction)
6. **💥 Damage Phase** - Apply all damage
7. **🔄 End Round** - Check victory conditions, start new round

### Proposed Solution: Integrated Phase Tracker

**Layout:** Vertical initiative tracker + horizontal phase indicator

```
┌─────────────────────────────────────────────────────────────┐
│                     🎲 INITIATIVE TRACKER                    │
├─────────────────────────────────────────────────────────────┤
│  ROUND 3                                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🟢 YOUR TURN                                       │     │
│  │ ⚡ Scout (Initiative: 11)  ◀─ YOU ARE HERE        │     │
│  │                                                    │     │
│  │ Current Phase: ⚔️ WEAPONS PHASE                   │     │
│  │ Your Actions: Fire weapons, launch missiles       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  📦 Free Trader (Initiative: 8)                             │
│  └─ Waiting for your turn...                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    COMBAT PHASES - ROUND 3                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Initiative  ✅ Maneuver  ✅ Engineering  🟢 WEAPONS      │
│  ⬜ Defense     ⬜ Damage     ⬜ End Round                   │
│                                                              │
│  [Mouseover any phase for details]                          │
└─────────────────────────────────────────────────────────────┘
```

### UI Components

#### 1. Initiative Tracker Component

**File:** `public/components/initiative-tracker.js`

```javascript
class InitiativeTracker {
  constructor() {
    this.ships = [];
    this.currentShipIndex = 0;
    this.round = 1;
    this.element = null;
  }

  setInitiative(ships) {
    // Sort by initiative (highest first)
    this.ships = ships.sort((a, b) => b.initiative - a.initiative);
    this.render();
  }

  render() {
    return `
      <div class="initiative-tracker">
        <div class="tracker-header">
          <h3>🎲 INITIATIVE TRACKER</h3>
          <div class="round-indicator">ROUND ${this.round}</div>
        </div>

        <div class="initiative-list">
          ${this.ships.map((ship, index) => this.renderShipInitiative(ship, index)).join('')}
        </div>
      </div>
    `;
  }

  renderShipInitiative(ship, index) {
    const isActive = index === this.currentShipIndex;
    const isYou = ship.isPlayer;

    return `
      <div class="initiative-item ${isActive ? 'active' : ''} ${isYou ? 'player' : 'enemy'}">
        ${isActive ? '<div class="turn-indicator">◀─ YOU ARE HERE</div>' : ''}

        <div class="ship-initiative">
          <span class="ship-icon">${ship.icon}</span>
          <span class="ship-name">${ship.name}</span>
          <span class="initiative-value">Initiative: ${ship.initiative}</span>
        </div>

        ${isActive ? `
          <div class="active-turn-info">
            <div class="current-phase">
              Current Phase: ${this.getCurrentPhaseDisplay()}
            </div>
            <div class="available-actions">
              Your Actions: ${this.getAvailableActions()}
            </div>
          </div>
        ` : `
          <div class="waiting-indicator">
            └─ Waiting for your turn...
          </div>
        `}
      </div>
    `;
  }

  nextShip() {
    this.currentShipIndex++;
    if (this.currentShipIndex >= this.ships.length) {
      this.currentShipIndex = 0;
      this.nextRound();
    }
    this.render();
  }

  nextRound() {
    this.round++;
    // Re-roll initiative for all ships
    this.ships.forEach(ship => {
      ship.initiative = this.rollInitiative(ship.pilotSkill);
    });
    this.ships.sort((a, b) => b.initiative - a.initiative);
  }

  rollInitiative(pilotSkill) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return die1 + die2 + pilotSkill;
  }
}
```

#### 2. Phase Tracker Component

**File:** `public/components/phase-tracker.js`

```javascript
const COMBAT_PHASES = [
  {
    id: 'initiative',
    name: 'Initiative',
    icon: '🎲',
    description: 'Roll 2D6 + Pilot skill to determine turn order',
    actions: ['Roll initiative dice'],
    crew: ['Pilot']
  },
  {
    id: 'maneuver',
    name: 'Maneuver',
    icon: '🚀',
    description: 'Pilot controls ship movement and evasion',
    actions: ['Change range', 'Evasive maneuvers', 'Pursue enemy'],
    crew: ['Pilot']
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: '🔧',
    description: 'Engineer manages power and repairs',
    actions: ['Emergency repairs', 'Boost power', 'Damage control'],
    crew: ['Engineer']
  },
  {
    id: 'weapons',
    name: 'Weapons',
    icon: '⚔️',
    description: 'Gunner fires weapons and launches ordnance',
    actions: ['Fire lasers', 'Launch missiles', 'Fire particle beams'],
    crew: ['Gunner']
  },
  {
    id: 'defense',
    name: 'Defense',
    icon: '🛡️',
    description: 'React to incoming attacks',
    actions: ['Point defense', 'Deploy sandcasters', 'Evasion'],
    crew: ['Gunner', 'Pilot']
  },
  {
    id: 'damage',
    name: 'Damage',
    icon: '💥',
    description: 'Apply all damage from this round',
    actions: ['Calculate damage', 'Apply to hull/armor', 'Check critical hits'],
    crew: []
  },
  {
    id: 'end',
    name: 'End Round',
    icon: '🔄',
    description: 'Check victory conditions and prepare next round',
    actions: ['Check for destroyed ships', 'Roll new initiative'],
    crew: []
  }
];

class PhaseTracker {
  constructor() {
    this.currentPhase = 0;
    this.round = 1;
    this.element = null;
  }

  render() {
    return `
      <div class="phase-tracker">
        <div class="phase-header">
          <h3>COMBAT PHASES - ROUND ${this.round}</h3>
        </div>

        <div class="phase-list">
          ${COMBAT_PHASES.map((phase, index) => this.renderPhase(phase, index)).join('')}
        </div>

        <div class="phase-help">
          [Mouseover any phase for details]
        </div>
      </div>
    `;
  }

  renderPhase(phase, index) {
    const status = index < this.currentPhase ? 'completed' :
                   index === this.currentPhase ? 'active' :
                   'pending';

    const icon = status === 'completed' ? '✅' :
                 status === 'active' ? '🟢' :
                 '⬜';

    return `
      <div
        class="phase-item ${status}"
        data-phase="${phase.id}"
        title="${phase.description}"
        onmouseenter="showPhaseTooltip('${phase.id}')"
      >
        <span class="phase-icon">${icon}</span>
        <span class="phase-name">${phase.name}</span>
      </div>
    `;
  }

  nextPhase() {
    this.currentPhase++;
    if (this.currentPhase >= COMBAT_PHASES.length) {
      this.nextRound();
    }
    this.render();
    this.updateActionButtons();
  }

  nextRound() {
    this.round++;
    this.currentPhase = 0;
  }

  updateActionButtons() {
    // Enable/disable buttons based on current phase
    const currentPhase = COMBAT_PHASES[this.currentPhase];

    // Get all action buttons
    const fireButton = document.getElementById('fire-button');
    const missileButton = document.getElementById('missile-button');
    const pdButton = document.getElementById('point-defense-button');
    const sandButton = document.getElementById('sandcaster-button');
    const endTurnButton = document.getElementById('end-turn-button');

    // Weapons phase
    if (currentPhase.id === 'weapons') {
      this.enableButton(fireButton);
      this.enableButton(missileButton);
      this.disableButton(pdButton);
      this.disableButton(sandButton);
    }
    // Defense phase
    else if (currentPhase.id === 'defense') {
      this.disableButton(fireButton);
      this.disableButton(missileButton);
      this.enableButton(pdButton);
      this.enableButton(sandButton);
    }
    // Other phases
    else {
      this.disableButton(fireButton);
      this.disableButton(missileButton);
      this.disableButton(pdButton);
      this.disableButton(sandButton);
    }

    // End turn always available
    this.enableButton(endTurnButton);
  }

  enableButton(button) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('phase-disabled');
    button.classList.add('phase-active');
  }

  disableButton(button) {
    if (!button) return;
    button.disabled = true;
    button.classList.add('phase-disabled');
    button.classList.remove('phase-active');
  }
}
```

#### 3. Phase Tooltip System

**HTML:**

```html
<div id="phase-tooltip" class="phase-tooltip hidden">
  <div class="tooltip-header">
    <span class="tooltip-icon"></span>
    <span class="tooltip-title"></span>
  </div>
  <div class="tooltip-description"></div>
  <div class="tooltip-actions">
    <strong>Available Actions:</strong>
    <ul class="action-list"></ul>
  </div>
  <div class="tooltip-crew">
    <strong>Crew Required:</strong>
    <span class="crew-list"></span>
  </div>
</div>
```

**JavaScript:**

```javascript
function showPhaseTooltip(phaseId) {
  const phase = COMBAT_PHASES.find(p => p.id === phaseId);
  if (!phase) return;

  const tooltip = document.getElementById('phase-tooltip');
  const icon = tooltip.querySelector('.tooltip-icon');
  const title = tooltip.querySelector('.tooltip-title');
  const description = tooltip.querySelector('.tooltip-description');
  const actionList = tooltip.querySelector('.action-list');
  const crewList = tooltip.querySelector('.crew-list');

  icon.textContent = phase.icon;
  title.textContent = phase.name;
  description.textContent = phase.description;

  actionList.innerHTML = phase.actions.map(action => `<li>${action}</li>`).join('');
  crewList.textContent = phase.crew.length > 0 ? phase.crew.join(', ') : 'Automatic';

  tooltip.classList.remove('hidden');
}

function hidePhaseTooltip() {
  const tooltip = document.getElementById('phase-tooltip');
  tooltip.classList.add('hidden');
}
```

#### 4. Button State Management

**CSS for disabled/active buttons:**

```css
/* Phase-disabled buttons (grey, dim) */
.action-button.phase-disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
  opacity: 0.5;
  border: 2px solid #666;
}

.action-button.phase-disabled:hover {
  background: #444;
  transform: none;
  box-shadow: none;
}

/* Phase-active buttons (bright, highlighted) */
.action-button.phase-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  animation: button-pulse 2s infinite;
}

@keyframes button-pulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(251, 191, 36, 0.8);
  }
}

/* Button with crew requirement indicator */
.action-button[data-crew]::before {
  content: attr(data-crew);
  position: absolute;
  top: -8px;
  right: -8px;
  background: #667eea;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
```

---

## Implementation Plan

### Phase 1: Enemy Ship Display (4-5 hours)

**Tasks:**

1. **Create ShipStatusCard component** (1.5h)
   - Build reusable component
   - Add hull/armor/weapon rendering
   - Implement damage flash animation

2. **Integrate dual display panel** (1h)
   - Add to combat HUD layout
   - Position side-by-side
   - Responsive design for mobile

3. **Real-time updates** (1.5h)
   - Socket.io event listeners for damage
   - Update enemy ship status on events
   - Flash animations on damage

4. **Remove/hide combat log** (0.5h)
   - Keep log in dev mode only
   - Hide in production (ENV flag)
   - Replace with visual updates

5. **Testing** (0.5h)
   - Test damage display
   - Test animation timing
   - Verify multiplayer sync

### Phase 2: Initiative & Phase Tracker (6-8 hours)

**Tasks:**

1. **Create InitiativeTracker component** (2h)
   - Roll initiative system
   - Sort by initiative value
   - Display turn order
   - Highlight active ship

2. **Create PhaseTracker component** (2h)
   - Define all 7 phases
   - Visual phase indicator
   - Current phase highlighting
   - Phase progression logic

3. **Phase tooltip system** (1h)
   - Mouseover tooltips
   - Phase descriptions
   - Available actions list
   - Crew requirements

4. **Button state management** (2h)
   - Disable buttons by phase
   - Enable buttons when appropriate
   - Visual feedback (grey/bright/pulsing)
   - Crew-specific coloring

5. **Integration & testing** (1-2h)
   - Integrate with combat system
   - Test phase transitions
   - Test multiplayer sync
   - Test button state changes

### Phase 3: Polish & Production (1-2 hours)

**Tasks:**

1. **Visual polish** (0.5h)
   - Animation timing
   - Color scheme consistency
   - Mobile responsiveness

2. **Accessibility** (0.5h)
   - Keyboard navigation
   - Screen reader support
   - Color-blind friendly indicators

3. **Documentation** (0.5h)
   - Update user guide
   - Add phase explanations
   - Document crew roles

---

## Success Criteria

### Enemy Ship Display

✅ Enemy ship status visible at all times
✅ Hull, armor, weapons displayed clearly
✅ Damage shows with flash animation (2s)
✅ Updates in real-time (< 100ms latency)
✅ Combat log hidden in production
✅ Works in multiplayer with sync

### Initiative & Phase Tracker

✅ Initiative rolls automatically each round
✅ Turn order displayed clearly (Roll20-style)
✅ All 7 Traveller phases shown
✅ Current phase highlighted
✅ Phase tooltips explain rules
✅ Buttons disabled/enabled by phase
✅ Active buttons pulse/glow
✅ Crew-specific color coding
✅ Works in multiplayer with sync

---

## Technical Notes

### Socket.io Events (New)

```javascript
// Initiative rolled
socket.emit('combat:rollInitiative', { shipId, pilotSkill });
socket.on('combat:initiativeRolled', { shipId, initiative, turnOrder });

// Phase changed
socket.emit('combat:nextPhase');
socket.on('combat:phaseChanged', { round, phase, activeShip });

// Damage applied (existing, enhanced)
socket.on('space:damageApplied', {
  targetShip,
  damage,
  newHull,
  newArmor,
  weaponType,
  attackingShip
});
```

### State Management

```javascript
// Combat state structure (enhanced)
const combatState = {
  round: 1,
  phase: 0, // 0-6 (initiative, maneuver, engineering, weapons, defense, damage, end)
  turnOrder: [
    { shipId: 'ship1', initiative: 11, isActive: true },
    { shipId: 'ship2', initiative: 8, isActive: false }
  ],
  ships: {
    'ship1': { hull: 32, maxHull: 40, armor: 4, damageThisTurn: 8, ... },
    'ship2': { hull: 48, maxHull: 80, armor: 2, damageThisTurn: 0, ... }
  },
  phaseActions: {
    'ship1': { fired: true, movedThisPhase: false },
    'ship2': { fired: true, movedThisPhase: true }
  }
};
```

### Files to Create/Modify

**New Files:**
- `public/components/ship-status-card.js` (~250 LOC)
- `public/components/initiative-tracker.js` (~200 LOC)
- `public/components/phase-tracker.js` (~300 LOC)
- `public/styles/combat-ui.css` (~200 LOC)

**Modified Files:**
- `public/index.html` - Add new components to combat HUD
- `public/app.js` - Integrate components, add event listeners
- `server.js` - Add initiative rolling, phase tracking
- `lib/space-combat.js` - Enhanced combat flow with phases

**Total:** ~950 LOC new, ~300 LOC modified

---

## Visual Mockup

```
┌────────────────────────────────────────────────────────────────────┐
│                   TRAVELLER COMBAT VTT - ROUND 3                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────┬────────────────────────────────┐ │
│  │ 🎲 INITIATIVE TRACKER      │  COMBAT PHASES - ROUND 3       │ │
│  ├─────────────────────────────┼────────────────────────────────┤ │
│  │ ROUND 3                     │  ✅ Initiative                │ │
│  │                             │  ✅ Maneuver                  │ │
│  │ 🟢 ⚡ Scout (Init: 11)      │  ✅ Engineering               │ │
│  │    ◀─ YOU ARE HERE         │  🟢 WEAPONS ◀─ CURRENT        │ │
│  │    Phase: ⚔️ WEAPONS        │  ⬜ Defense                   │ │
│  │    Actions: Fire, Launch    │  ⬜ Damage                    │ │
│  │                             │  ⬜ End Round                 │ │
│  │ 📦 Free Trader (Init: 8)    │                               │ │
│  │    └─ Waiting...           │ [Mouseover for phase details] │ │
│  └─────────────────────────────┴────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              COMBAT TACTICAL DISPLAY                         │ │
│  ├────────────────────────┬─────────────────────────────────────┤ │
│  │ 👤 YOUR SHIP           │ 🎯 ENEMY SHIP                       │ │
│  │ ⚡ Type-S Scout        │ 📦 Free Trader                      │ │
│  │                        │                                     │ │
│  │ 🛡️ HULL: [███████░░░]  │ 🛡️ HULL: [██████░░░░]              │ │
│  │    32/40 (80%)         │    48/80 (60%)                      │ │
│  │                        │                                     │ │
│  │ 🔰 ARMOR: 4            │ 🔰 ARMOR: 2                         │ │
│  │ 🚀 THRUST: 2G          │ 🚀 THRUST: 1G                       │ │
│  │ 📍 RANGE: Short        │ 💥 DAMAGE: -8 HP [FLASH]            │ │
│  │                        │                                     │ │
│  │ ⚔️ WEAPONS:            │ ⚔️ WEAPONS:                         │ │
│  │ • Pulse Laser ✅       │ • Beam Laser (Fired)                │ │
│  │ • Missiles (8/12)      │ • Beam Laser (Fired)                │ │
│  │ • Sandcaster (20/20)   │                                     │ │
│  └────────────────────────┴─────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ CREW ACTIONS                                                 │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ [🔥 FIRE] [🚀 MISSILE] [⚫ POINT DEF] [⚫ SANDCAST] [END TURN]│ │
│  │  ACTIVE    ACTIVE      DISABLED     DISABLED     ALWAYS      │ │
│  │  (Pulsing) (Pulsing)   (Grey)       (Grey)      (Available)  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Risk Analysis

### Low Risk
✅ Ship status display - straightforward UI
✅ Damage flash animation - CSS only
✅ Phase tracker visual - simple state management

### Medium Risk
⚠️ Initiative rolling - requires server sync
⚠️ Phase transitions - must sync across clients
⚠️ Button state management - phase-dependent logic

### High Risk
❌ Multiplayer phase sync - potential race conditions
❌ Complex crew action gating - requires phase validation
❌ Backward compatibility - existing combats might break

### Mitigation Strategies

1. **Phase sync:** Use server as source of truth, emit phase changes
2. **Button validation:** Server validates actions match current phase
3. **Backward compat:** Keep old combat log as fallback (dev mode)
4. **Testing:** Extensive multiplayer testing with 2 real players

---

## Recommendation

**Priority:** HIGH - Both features are critical for production

**Approach:** Implement in TWO stages:
1. **Stage 14.5:** Enemy Ship Display (4-5h) - Quick win, immediate value
2. **Stage 15:** Initiative & Phase Tracker (6-8h) - More complex, game-changing

**Total Time:** 10-13 hours (can be split across 2-3 sessions)

**Alternative:** Could combine with Stage 15 (Redis + Cluster) if scaling is also priority, but recommend doing UI first before infrastructure.

---

**Status:** 📋 PLANNED - Ready for implementation
**Next Step:** User approval, then begin Stage 14.5
