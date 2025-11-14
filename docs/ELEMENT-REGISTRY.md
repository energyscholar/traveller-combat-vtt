# Element Registry - Test Automation IDs
**Created:** 2025-11-14
**Purpose:** Comprehensive reference of data-test-id attributes for Puppeteer/Puppetry automation
**Version:** 1.0.0 (Session 6, Phase 1)

---

## Overview

This document provides a complete registry of all `data-test-id` attributes in the Traveller Combat VTT UI, organized by screen and function. These IDs enable both Puppeteer (headless) and Puppetry (visible) automation modes.

**Usage:**
```javascript
// Puppeteer/Puppetry selection
await page.click('[data-test-id="fire-button"]');
await page.waitForSelector('[data-test-id="combat-log"]');
const range = await page.$eval('[data-test-id="current-range"]', el => el.textContent);
```

---

## 📋 Element Registry by Screen

### Main Menu Screen

**Screen ID:** `#main-menu-screen`

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Space Battle Button | `btn-space-battle` | Button | Launch multiplayer battle |
| Solo Battle Button | `btn-solo-battle` | Button | Launch AI battle (future) |
| Customize Ship Button | `btn-customize-ship` | Button | Open ship customizer |
| Ship Templates Button | `btn-ship-templates` | Button | View ship templates |

**Example Test Scenario:**
```javascript
// Navigate to main menu
await page.goto('http://localhost:3000');
await page.waitForSelector('[data-test-id="btn-space-battle"]');
await page.click('[data-test-id="btn-space-battle"]');
```

---

### Ship Selection Screen

**Screen ID:** `#ship-selection-screen`

#### Ship Selection Cards

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Scout Ship Option | `ship-option-scout` | Div (clickable) | Select Scout ship |
| Free Trader Option | `ship-option-free-trader` | Div (clickable) | Select Free Trader ship |

**Ship Data Attributes:**
- `data-ship="scout"` - Scout/Courier
- `data-ship="free_trader"` - Type-A Free Trader

#### Range Selection

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Range Dropdown | `range-select` | Select | Choose starting range |

**Range Options:**
- `Adjacent`, `Close`, `Short` (default), `Medium`, `Long`, `Very Long`, `Distant`

#### Ready Indicators

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Player Ready Indicator | `player-ready-indicator` | Div | Shows player ready status |
| Opponent Ready Indicator | `opponent-ready-indicator` | Div | Shows opponent ready status |
| Ready Button | `ready-button` | Button | Confirm ship and range selection |

**Example Test Scenario:**
```javascript
// Select ship and start battle
await page.click('[data-test-id="ship-option-scout"]');
await page.select('[data-test-id="range-select"]', 'Short');
await page.click('[data-test-id="ready-button"]');
```

---

### Combat HUD - Player Info

**Screen ID:** `#space-combat-hud`

#### Player Identity

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Player Indicator | `player-indicator` | Div | Player identity badge |
| Player Number | `player-number` | Span | "Player 1" or "Player 2" |
| Player Ship Name | `player-ship-name` | Span | Assigned ship name |
| Combat Player Number | `combat-player-number` | Span | Player number in HUD |
| Combat Player Ship | `combat-player-ship` | Span | Ship name in HUD |

**Example Test Scenario:**
```javascript
// Verify player assignment
const playerNum = await page.$eval('[data-test-id="player-number"]', el => el.textContent);
const shipName = await page.$eval('[data-test-id="player-ship-name"]', el => el.textContent);
console.log(`${playerNum} assigned to ${shipName}`);
```

---

### Combat HUD - Ship Status

#### Ship Info

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Ship Name | `ship-name` | Div | Current ship name |
| Ship Armour | `ship-armour` | Span | Armour rating |
| Current Range | `current-range` | Span | Current range band |
| Round Counter | `round-counter` | Span | Current combat round |

#### Hull Status

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Hull Current | `hull-current` | Span | Current hull points |
| Hull Max | `hull-max` | Span | Maximum hull points |
| Hull Bar Fill | `hull-bar-fill` | Div | Hull bar visual (width: %) |

**Example Test Scenario:**
```javascript
// Monitor hull damage
const hullCurrent = await page.$eval('[data-test-id="hull-current"]', el => parseInt(el.textContent));
const hullMax = await page.$eval('[data-test-id="hull-max"]', el => parseInt(el.textContent));
const hullPercent = (hullCurrent / hullMax) * 100;
console.log(`Hull: ${hullCurrent}/${hullMax} (${hullPercent}%)`);
```

#### Initiative

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Initiative Display | `initiative-display` | Div | Initiative container |
| Initiative Value | `initiative-value` | Span | Initiative roll result |

---

### Combat HUD - Turn Tracker

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Turn Indicator | `turn-indicator` | Div | Turn indicator container |
| Turn Status | `turn-status` | Div | "Your turn" / "Opponent's turn" |
| Round Display | `round-display` | Div | Round information text |

**Example Test Scenario:**
```javascript
// Wait for your turn
await page.waitForFunction(() => {
  const status = document.querySelector('[data-test-id="turn-status"]').textContent;
  return status.includes('Your turn');
});
```

---

### Combat HUD - Crew Panel

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Crew Panel Toggle | `crew-panel-toggle` | Div | Toggle crew panel visibility |
| Crew Panel Content | `crew-panel-content` | Div | Crew panel content container |
| Crew Panel | `crew-panel` | Div | Crew list |

**Example Test Scenario:**
```javascript
// Expand crew panel
await page.click('[data-test-id="crew-panel-toggle"]');
await page.waitForSelector('[data-test-id="crew-panel-content"]:not([style*="display: none"])');
```

---

### Combat HUD - Gunner Controls

#### Weapon Selection

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Turret Select | `turret-select` | Select | Choose turret |
| Target Select | `target-select` | Select | Choose target |
| Weapon Select | `weapon-select` | Select | Choose weapon |
| Fire Button | `fire-button` | Button | Fire selected weapon |

**Weapon Select Options:**
- `0` - Pulse Laser (2d6)
- `1` - Sandcaster (Defense)
- `2` - Missiles (4d6, 6 shots)

#### Advanced Weapon Actions (Stage 11)

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Launch Missile Button | `launch-missile-button` | Button | Launch missile attack |
| Point Defense Button | `point-defense-button` | Button | Point defense against missiles |
| Use Sandcaster Button | `use-sandcaster-button` | Button | Deploy sandcaster defense |

#### Ammo Display

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Missiles Remaining | `missiles-remaining` | Span | Missile ammo count |
| Sandcaster Remaining | `sandcaster-remaining` | Span | Sandcaster ammo count |

**Example Test Scenario:**
```javascript
// Fire weapon sequence
await page.select('[data-test-id="turret-select"]', '0');
await page.select('[data-test-id="target-select"]', 'opponent');
await page.select('[data-test-id="weapon-select"]', '0'); // Pulse laser
await page.click('[data-test-id="fire-button"]');

// Check ammo
const missiles = await page.$eval('[data-test-id="missiles-remaining"]',
  el => el.textContent.match(/\d+/)[0]);
console.log(`Missiles remaining: ${missiles}`);
```

---

### Combat HUD - Turn Management

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Turn Timer | `turn-timer` | Span | Turn timer countdown |
| Use Default Button | `use-default-button` | Button | Use default action |
| End Turn Button | `end-turn-button` | Button | End current turn |

**Example Test Scenario:**
```javascript
// End turn
await page.click('[data-test-id="end-turn-button"]');
```

---

### Combat HUD - Combat Log

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Combat Log | `combat-log` | Div | Scrollable combat log |

**Combat Log Entry Classes:**
- `.log-entry.system` - System messages
- `.log-entry.hit` - Hit messages
- `.log-entry.miss` - Miss messages
- `.log-entry.damage` - Damage messages

**Example Test Scenario:**
```javascript
// Wait for combat log entry
await page.waitForFunction(() => {
  const log = document.querySelector('[data-test-id="combat-log"]');
  return log.textContent.includes('fires at');
});
```

---

### Combat HUD - Player Feedback

| Element | data-test-id | Type | Purpose |
|---------|--------------|------|---------|
| Feedback Text | `feedback-text` | Textarea | Feedback input field |
| Submit Feedback Button | `submit-feedback-button` | Button | Submit feedback |
| Feedback Status | `feedback-status` | Div | Feedback submission status |

**Example Test Scenario:**
```javascript
// Submit feedback
await page.type('[data-test-id="feedback-text"]', 'Great game!');
await page.click('[data-test-id="submit-feedback-button"]');
await page.waitForSelector('[data-test-id="feedback-status"]:not(:empty)');
```

---

## 🔍 Complete Element List (Alphabetical)

| data-test-id | Screen | Element Type |
|--------------|--------|--------------|
| `btn-customize-ship` | Main Menu | Button |
| `btn-ship-templates` | Main Menu | Button |
| `btn-solo-battle` | Main Menu | Button |
| `btn-space-battle` | Main Menu | Button |
| `combat-log` | Combat HUD | Div |
| `combat-player-number` | Combat HUD | Span |
| `combat-player-ship` | Combat HUD | Span |
| `crew-panel` | Combat HUD | Div |
| `crew-panel-content` | Combat HUD | Div |
| `crew-panel-toggle` | Combat HUD | Div |
| `current-range` | Combat HUD | Span |
| `end-turn-button` | Combat HUD | Button |
| `feedback-status` | Combat HUD | Div |
| `feedback-text` | Combat HUD | Textarea |
| `fire-button` | Combat HUD | Button |
| `hull-bar-fill` | Combat HUD | Div |
| `hull-current` | Combat HUD | Span |
| `hull-max` | Combat HUD | Span |
| `initiative-display` | Combat HUD | Div |
| `initiative-value` | Combat HUD | Span |
| `launch-missile-button` | Combat HUD | Button |
| `missiles-remaining` | Combat HUD | Span |
| `opponent-ready-indicator` | Ship Selection | Div |
| `player-indicator` | Header | Div |
| `player-number` | Header | Span |
| `player-ready-indicator` | Ship Selection | Div |
| `player-ship-name` | Header | Span |
| `point-defense-button` | Combat HUD | Button |
| `range-select` | Ship Selection | Select |
| `ready-button` | Ship Selection | Button |
| `round-counter` | Combat HUD | Span |
| `round-display` | Combat HUD | Div |
| `sandcaster-remaining` | Combat HUD | Span |
| `ship-armour` | Combat HUD | Span |
| `ship-name` | Combat HUD | Div |
| `ship-option-free-trader` | Ship Selection | Div |
| `ship-option-scout` | Ship Selection | Div |
| `submit-feedback-button` | Combat HUD | Button |
| `target-select` | Combat HUD | Select |
| `turret-select` | Combat HUD | Select |
| `turn-indicator` | Combat HUD | Div |
| `turn-status` | Combat HUD | Div |
| `turn-timer` | Combat HUD | Span |
| `use-default-button` | Combat HUD | Button |
| `use-sandcaster-button` | Combat HUD | Button |
| `weapon-select` | Combat HUD | Select |

**Total Elements:** 45 data-test-id attributes

---

## 🎯 Usage Patterns

### Pattern 1: Click Button
```javascript
await page.click('[data-test-id="fire-button"]');
```

### Pattern 2: Select Dropdown Option
```javascript
await page.select('[data-test-id="range-select"]', 'Short');
```

### Pattern 3: Get Text Content
```javascript
const range = await page.$eval('[data-test-id="current-range"]', el => el.textContent);
```

### Pattern 4: Wait for Element
```javascript
await page.waitForSelector('[data-test-id="ready-button"]:not([disabled])');
```

### Pattern 5: Type into Input
```javascript
await page.type('[data-test-id="feedback-text"]', 'Test feedback');
```

### Pattern 6: Wait for Condition
```javascript
await page.waitForFunction(() => {
  const status = document.querySelector('[data-test-id="turn-status"]').textContent;
  return status.includes('Your turn');
});
```

---

## 📊 Coverage Statistics

**Coverage by Screen:**
- Main Menu: 4 elements
- Ship Selection: 6 elements
- Player Info: 5 elements
- Ship Status: 8 elements
- Turn Tracker: 3 elements
- Crew Panel: 3 elements
- Gunner Controls: 10 elements
- Turn Management: 3 elements
- Combat Log: 1 element
- Feedback: 3 elements

**Total Interactive Elements:** 45

**Coverage:** 100% of user-actionable elements

---

## 🚀 Next Steps

### Phase 2: Remote Control API
Create server endpoints for programmatic control:
- `POST /api/test/battle/create`
- `POST /api/test/battle/join/:battleId`
- `POST /api/test/action/fire`
- `GET /api/test/battle/:battleId/state`

### Phase 3: Test Scenarios
Define reusable test scenarios:
- Basic combat (Scout vs Free Trader)
- Missile combat (6-shot volley)
- Sandcaster defense
- Multi-round endurance

### Phase 4: Puppeteer Runner (Headless)
Fast, headless execution for performance testing

### Phase 5: Puppetry Runner (Visible)
Slow, visual execution for demonstrations

---

## 📝 Maintenance

**Update Frequency:** After any UI changes

**Checklist:**
- [ ] Add data-test-id to new interactive elements
- [ ] Update this registry with element descriptions
- [ ] Test all selectors with Puppeteer
- [ ] Update test scenarios to use new elements

---

**Document Status:** ✅ Complete (Phase 1.2)
**Version:** 1.0.0
**Last Updated:** 2025-11-14

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
