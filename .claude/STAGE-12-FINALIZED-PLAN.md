# Stage 12 FINALIZED: Ship Customization System

**Date:** 2025-11-12
**Status:** Sub-stage 12.1 COMPLETE, 12.2-12.6 PENDING
**Version Target:** 0.12

---

## Executive Summary

**REVISED SCOPE:** Ship customization/modification (NOT full construction)
**APPROACH:** Visual SVG-based UI with clickable ship schematics
**COST TRACKING:** Budget system (MCr spent on modifications)
**TEMPLATES:** 9 standard ships (2 existing + 7 new ✅ DONE)

---

## Key Requirements (User-Specified)

### 1. Ship Customization (Not Construction)
- Start with standard template (Scout, Free Trader, etc.)
- Modify existing components (turrets, weapons, armor, drives, fuel, cargo)
- Save with custom name (e.g., "Potemkin", "Jolly Reaver")

### 2. SVG-Based Visual UI
- Show ship schematic from above (top-down view)
- Components placed where they go on ship:
  - **Rear:** M-Drive, J-Drive, Power Plant
  - **Front:** Turrets (numbered)
  - **Middle:** Cargo, Fuel, Passengers
- Click component → Customize interface appears
- Example: Click "Turret 1" → "Buy Turret" or "Customize Turret" panel

### 3. Cost Tracking & Budget System
- Track MCr (megacredits) spent on modifications
- Show running total: "Base Cost: MCr 52.42 | Mods: +MCr 2.5 | Total: MCr 54.92"
- Use case: Players have budget of X MCr to customize
- Don't handle accounting, just show total cost

### 4. Main Menu / Landing Page
- Menu: "Customize Ship" | "Space Battle"
- URL parameters for testing:
  - `?mode=customize` → Ship customization
  - `?mode=battle` → Combat (current behavior)
  - `?mode=battle&ship1=Potemkin&ship2=JollyReaver` → Specific ships
- No menu = show menu (backward compatibility)

### 5. Ship Tracking by Name
- Ships identified by: Template + Mods + Custom Name
- Ship library/garage for saved ships
- Select custom ships in combat

---

## Use Cases (Verified)

### UC1: Scout with Different Turret
**Start:** Type-S Scout (1 double turret, MCr 36.94)
**Modify:** Upgrade to triple turret (+MCr 0.5), change weapons to 3× Pulse Laser (+MCr 2.0)
**Cost:** Base MCr 36.94 + Mods MCr 2.5 = **Total MCr 39.44**
**Save As:** "Combat Scout Alpha"

### UC2: Armed Far Trader
**Start:** Type-A2 Far Trader (unarmed, MCr 52.42)
**Modify:** Add 2 double turrets (+MCr 1.0), add weapons (+MCr 3.0), upgrade armor 2→4 (+MCr 2.0)
**Cost:** Base MCr 52.42 + Mods MCr 6.0 = **Total MCr 58.42**
**Save As:** "Jolly Reaver"

### UC3: Q-Ship Merchant
**Start:** Type-M Subsidised Liner (600t, unarmed, MCr 158.32)
**Modify:** Add 4 triple turrets (+MCr 4.0), add missile racks (+MCr 3.0), upgrade armor 0→4 (+MCr 12.0)
**Cost:** Base MCr 158.32 + Mods MCr 19.0 = **Total MCr 177.32**
**Save As:** "Potemkin" (Q-Ship)
**Note:** Fighter bay deferred to High Guard (Stage 20)

### UC4: Subsidized Merchant Refit
**Start:** Type-R Subsidized Merchant (400t, MCr 101.03)
**Modify:** Upgrade M-Drive Thrust 1→2 (+MCr 4.0), add 2 turrets (+MCr 2.0), armor 0→2 (+MCr 4.0), reduce cargo 200t→150t
**Cost:** Base MCr 101.03 + Mods MCr 10.0 = **Total MCr 111.03**
**Save As:** "Fast Trader Mk II"

### UC5: Jump Range Extension
**Start:** Type-A Free Trader (Jump-1, MCr 51.48)
**Modify:** Upgrade J-Drive Jump-1→2 (+MCr 10.0), reduce cargo 81t→64t, add drop tanks (+MCr 1.5)
**Cost:** Base MCr 51.48 + Mods MCr 11.5 = **Total MCr 62.98**
**Save As:** "Long Ranger"

### UC6: Inflatable Fuel Tanks (DEFERRED)
**Status:** NOT in Core Rulebook → Defer to High Guard (Stage 20)
**Alternative:** Use drop tanks (external fuel, jettisoned after use) - AVAILABLE NOW

---

## Ship Templates Created ✅

**Sub-stage 12.1 COMPLETE:**

| Ship | Tonnage | Role | Jump | Thrust | Armor | Turrets | Cost (MCr) | Status |
|------|---------|------|------|--------|-------|---------|------------|--------|
| Type-S Scout | 100 | Exploration | 2 | 2 | 4 | 1 | 36.94 | ✅ Exists |
| Type-A Free Trader | 200 | Trading | 1 | 1 | 2 | 2 | 51.48 | ✅ Exists |
| Type-A2 Far Trader | 200 | Trading | 2 | 1 | 2 | 2 | 52.42 | ✅ Created |
| Type-T Patrol Corvette | 400 | Military | 3 | 4 | 4 | 4 | 184.46 | ✅ Created |
| Type-C Mercenary Cruiser | 800 | Military | 3 | 3 | 4 | 8 | 305.27 | ✅ Created |
| Type-M Subsidised Liner | 600 | Passenger | 3 | 1 | 0 | 6 | 158.32 | ✅ Created |
| Type-K Safari Ship | 200 | Exploration | 2 | 1 | 0 | 2 | 71.51 | ✅ Created |
| Type-J Seeker | 100 | Mining | 2 | 2 | 4 | 1 | 33.84 | ✅ Created |
| Type-L Laboratory Ship | 400 | Research | 2 | 2 | 0 | 4 | 136.37 | ✅ Created |

**Total:** 9 ship templates (all with base cost field)

---

## Implementation Plan (REVISED)

### ✅ Sub-stage 12.0: Pre-Implementation Setup (DONE)
- Update .gitignore
- Remove tracked session files
- Clean git state

### ✅ Sub-stage 12.1: Ship Templates (DONE - 2 days actual)
- Created 7 new ship JSON files
- Extended ship schema (jump, fuel, cargo, passengers, cost, etc.)
- Updated validator
- All 12 JSON files validate

**Files Created:**
- `data/ships/far_trader.json`
- `data/ships/patrol_corvette.json`
- `data/ships/mercenary_cruiser.json`
- `data/ships/subsidised_liner.json`
- `data/ships/safari_ship.json`
- `data/ships/seeker.json`
- `data/ships/laboratory_ship.json`

**Files Modified:**
- `data/schemas/ship.schema.json` (extended with new fields)
- `tools/validate-json.js` (updated role validation)

### 📋 Sub-stage 12.2: Main Menu / Landing Page (1 day)

**Scope:**
- Create menu overlay/screen: "Customize Ship" | "Space Battle"
- URL parameter support:
  - `?mode=customize` → Skip menu, go to customization
  - `?mode=battle` → Skip menu, go to ship selection (current behavior)
  - `?mode=battle&ship1=X&ship2=Y` → Skip menu, load specific ships
  - No parameters → Show menu
- Backward compatibility for tests

**UI:**
```
┌─────────────────────────────────────────┐
│   TRAVELLER COMBAT VTT - Main Menu      │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────┐       │
│   │  🛠️  CUSTOMIZE SHIP         │       │
│   │  Design and modify ships    │       │
│   └─────────────────────────────┘       │
│                                         │
│   ┌─────────────────────────────┐       │
│   │  ⚔️  SPACE BATTLE           │       │
│   │  Fight with ships           │       │
│   └─────────────────────────────┘       │
│                                         │
│   Version 0.12 - Stage 12 in progress   │
└─────────────────────────────────────────┘
```

**Files:**
- Modify `public/index.html` (add menu mode, URL parsing)
- Modify `public/app.js` (conditional rendering based on mode)
- Modify `public/styles.css` (menu styles)

**URL Parameter Examples:**
- `http://localhost:3000/` → Show menu
- `http://localhost:3000/?mode=customize` → Ship customization
- `http://localhost:3000/?mode=battle` → Ship selection → Combat
- `http://localhost:3000/?mode=battle&ship1=scout&ship2=free_trader` → Direct to combat

### 📋 Sub-stage 12.3: SVG Ship Schematics (2-3 days) **REVISED**

**Scope:**
- Create SVG ship schematics for 9 ship types (top-down view)
- Simple geometric shapes (rectangles, circles, polygons)
- Labeled component regions (clickable)
- Component placement matches real ship layout

**SVG Ship Components:**
- **Rear section:** M-Drive, J-Drive, Power Plant
- **Front section:** Turrets (Turret 1, Turret 2, etc.)
- **Middle section:** Cargo Bay, Fuel Tanks, Passenger Quarters
- **Indicators:** Empty slot (dashed outline) vs Installed (solid)

**Example SVG (Scout):**
```svg
<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Ship hull outline -->
  <polygon points="150,20 250,100 250,300 150,380 50,300 50,100"
           fill="#1a1a2e" stroke="#16213e" stroke-width="2"/>

  <!-- Turret 1 (front) -->
  <circle id="turret1" cx="150" cy="80" r="25"
          fill="#0f3460" stroke="#16213e" stroke-width="2"
          class="clickable-component" data-component="turret1"/>
  <text x="150" y="85" text-anchor="middle" fill="#eee" font-size="12">
    Turret 1
  </text>

  <!-- Cargo Bay (middle) -->
  <rect id="cargo" x="100" y="180" width="100" height="60"
        fill="#533483" stroke="#16213e" stroke-width="2"
        class="clickable-component" data-component="cargo"/>

  <!-- M-Drive (rear) -->
  <rect id="m-drive" x="100" y="300" width="45" height="40"
        fill="#e94560" stroke="#16213e" stroke-width="2"
        class="clickable-component" data-component="m-drive"/>

  <!-- J-Drive (rear) -->
  <rect id="j-drive" x="155" y="300" width="45" height="40"
        fill="#e94560" stroke="#16213e" stroke-width="2"
        class="clickable-component" data-component="j-drive"/>
</svg>
```

**Interactivity:**
- CSS hover effects (`:hover` highlight)
- Click component → Open customization panel
- Show current config (e.g., "Triple Turret: Pulse Laser × 3")
- Show "Empty Slot" for unused hardpoints

**Files to Create:**
- `public/assets/ships/scout.svg`
- `public/assets/ships/free_trader.svg`
- ... (9 total SVG files)
- OR embed SVGs directly in HTML for easier manipulation

### 📋 Sub-stage 12.4: Ship Customization UI (3-4 days) **REVISED**

**Scope:**
- Ship customization interface with SVG schematic
- Click component → Customization panel appears
- Real-time cost calculation and display
- Budget tracker (show MCr spent)

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  SHIP CUSTOMIZATION                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │  TEMPLATES   │    │  SHIP SCHEMATIC (SVG)            │  │
│  │              │    │                                  │  │
│  │ ○ Scout      │    │     [Turret 1] ← Click me!      │  │
│  │ ● Free Trader│    │                                  │  │
│  │ ○ Far Trader │    │    [Cargo Bay]   [Fuel]         │  │
│  │ ○ Corvette   │    │                                  │  │
│  │   ...        │    │    [M-Drive]  [J-Drive]         │  │
│  └──────────────┘    └──────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  COMPONENT CUSTOMIZATION PANEL                      │   │
│  │                                                      │   │
│  │  📍 Turret 1 (Double Turret)                       │   │
│  │  ┌──────────────────────────────────────────┐       │   │
│  │  │ Turret Type: [Single ▼] [Double ✓] [Triple]│   │   │
│  │  │ Weapon 1:   [Pulse Laser ▼]              │       │   │
│  │  │ Weapon 2:   [Sandcaster ▼]               │       │   │
│  │  │ Cost: MCr 0.5 (turret) + MCr 1.25 (weapons)│    │   │
│  │  └──────────────────────────────────────────┘       │   │
│  │  [Apply Changes]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💰 COST SUMMARY                                    │   │
│  │  Base Cost:        MCr 51.48                        │   │
│  │  Modifications:  + MCr 2.75                         │   │
│  │  ─────────────────────────────                      │   │
│  │  Total:            MCr 54.23                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Ship Name: [Jolly Reaver____]  [💾 Save Ship]            │
└─────────────────────────────────────────────────────────────┘
```

**Component Customization Panels:**

1. **Turret Panel:**
   - Buy turret (if empty slot): Single/Double/Triple
   - Assign weapons (up to turret capacity)
   - Cost breakdown

2. **Armor Panel:**
   - Slider: 0 to TL-max (e.g., 0-4 for TL9)
   - Show tonnage impact
   - Cost per point

3. **M-Drive Panel:**
   - Thrust rating: 1-6
   - Show power/fuel impact
   - Cost to upgrade

4. **J-Drive Panel:**
   - Jump rating: 0-6
   - Show fuel requirement (10% per jump number)
   - Cost to upgrade

5. **Cargo/Fuel Panel:**
   - Trade cargo ↔ fuel (slider)
   - Show total tonnage
   - No direct cost (tonnage reallocation)

**Validation (Real-time):**
- ✅ Green: Valid configuration
- ⚠️ Yellow: Warning (e.g., "Low fuel for Jump-2")
- ❌ Red: Invalid (e.g., "Exceeds hardpoint limit")

**Files:**
- `public/ship-customizer.html` (main customization page)
- `public/ship-customizer.js` (client logic, SVG interaction)
- `public/styles.css` (customization UI styles)
- `lib/ship-customization.js` (validation logic - server-side backup)

### 📋 Sub-stage 12.5: Ship Library / Garage (2 days)

**Scope:**
- localStorage-based ship library
- List all custom ships
- Edit, duplicate, delete, select for combat

**Data Format:**
```json
{
  "customShips": [
    {
      "id": "ship_1699999999",
      "templateId": "free_trader",
      "name": "Jolly Reaver",
      "baseCost": 51480000,
      "mods": {
        "armor": 4,
        "turrets": [
          { "type": "double", "weapons": ["beam_laser", "sandcaster"] },
          { "type": "double", "weapons": ["beam_laser", "missile_rack"] }
        ],
        "cargo": 61
      },
      "modCost": 6000000,
      "totalCost": 57480000,
      "created": "2025-11-12T10:30:00Z"
    }
  ]
}
```

**UI:**
```
┌─────────────────────────────────────────────────────┐
│  MY SHIPS                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🚀 Jolly Reaver (Far Trader)                      │
│     Armor 4, 2× Double Turrets                     │
│     Cost: MCr 57.48 (base 51.48 + mods 6.00)       │
│     [⚔️ Use in Combat] [✏️ Edit] [🗑️ Delete]        │
│                                                     │
│  🚀 Potemkin (Subsidised Liner)                    │
│     Q-Ship, Armor 4, 4× Triple Turrets             │
│     Cost: MCr 177.32 (base 158.32 + mods 19.00)    │
│     [⚔️ Use in Combat] [✏️ Edit] [🗑️ Delete]        │
│                                                     │
│  [+ Create New Ship]                                │
└─────────────────────────────────────────────────────┘
```

**Files:**
- `lib/ship-library.js` (localStorage CRUD operations)
- Integrate into `ship-customizer.html` (ship library section)

### 📋 Sub-stage 12.6: Combat Integration (2 days)

**Scope:**
- Modify ship selection screen to show custom ships
- Load custom ship data into combat
- Server-side validation (CRITICAL - Stage 11 lesson)
- Display custom ship names in combat

**Ship Selection Screen Changes:**
```
┌──────────────────────────────────────────────┐
│  SELECT YOUR SHIP                            │
├──────────────────────────────────────────────┤
│                                              │
│  [Standard Ships] [My Custom Ships]          │
│                                              │
│  ○ Scout (Type-S)                            │
│  ○ Free Trader (Type-A)                      │
│  ● Jolly Reaver (Far Trader - Modified)     │
│  ○ Potemkin (Q-Ship - Modified)             │
│                                              │
│  Starting Range: [Short ▼]                   │
│  [Ready]                                      │
└──────────────────────────────────────────────┘
```

**Combat Display:**
- Player 1: "Jolly Reaver" (instead of "Free Trader")
- Player 2: "Potemkin" (instead of "Subsidised Liner")
- All stats from custom ship (armor, turrets, weapons)

**Server-Side Validation:**
```javascript
// CRITICAL: Validate custom ship on server (Stage 11 lesson)
function validateCustomShip(customShip) {
  // Check turret count ≤ hardpoint limit
  // Check armor ≤ TL max
  // Check power budget
  // Check fuel requirements
  // Reject if invalid
}
```

**Files Modified:**
- `public/index.html` (ship selection screen)
- `public/app.js` (load custom ships, send to server)
- `server.js` (custom ship validation, combat integration)
- `lib/combat.js` (handle custom ship objects)

### 📋 Sub-stage 12.7: Testing & Polish (2 days)

**Unit Tests:**
- Ship template loading (10 tests)
- Customization validation (30 tests)
- Cost calculation (15 tests)
- Ship library CRUD (10 tests)
- Power/fuel calculations (10 tests)

**Integration Tests:**
- Custom ship in combat (15 tests)
- URL parameter routing (5 tests)
- Menu navigation (5 tests)
- SVG interaction (5 tests)

**Manual Testing:**
- All 6 use cases (UC1-UC5, UC6 deferred)
- Custom ships persist across sessions
- Combat with custom ships works
- Cost tracking accurate

**Files:**
- `tests/unit/ship-customization.test.js`
- `tests/unit/ship-library.test.js`
- `tests/unit/cost-calculation.test.js`
- `tests/integration/custom-ship-combat.test.js`
- `tests/integration/menu-routing.test.js`

---

## Acceptance Criteria (FINALIZED)

### Core Functionality
- [✅] 9 ship templates available (Sub-stage 12.1 DONE)
- [ ] Main menu with "Customize Ship" | "Space Battle"
- [ ] URL parameters for testing (`?mode=customize`, `?mode=battle`)
- [ ] SVG ship schematics for 9 ship types
- [ ] Click component → Customization panel
- [ ] Ship customization (turrets, weapons, armor, drives, fuel, cargo)
- [ ] Cost tracking (Base + Mods = Total MCr)
- [ ] Ship library (save, load, edit, delete)
- [ ] Custom ships work in combat
- [ ] Custom ship names in combat log

### SVG Ship Schematics
- [ ] Top-down view of each ship type
- [ ] Components placed correctly (drives rear, turrets front)
- [ ] Clickable regions with hover effects
- [ ] Visual indicators (empty slot vs installed)
- [ ] Scalable (SVG format)

### Cost Tracking
- [ ] Base cost from template (MCr)
- [ ] Modification cost calculation (MCr)
- [ ] Running total display
- [ ] Cost breakdown by component

### Customization Options
- [ ] Turret count (up to hardpoint limit)
- [ ] Turret type (single/double/triple)
- [ ] Weapon assignment
- [ ] Armor (TL-limited)
- [ ] Thrust (1-6)
- [ ] Jump (0-6)
- [ ] Fuel/cargo trade-offs

### Validation
- [ ] Server-side validation (CRITICAL)
- [ ] Tonnage limits enforced
- [ ] Power budget validated
- [ ] Fuel requirements checked
- [ ] TL restrictions enforced
- [ ] Real-time UI feedback (green/yellow/red)

### Testing
- [ ] 75+ unit tests
- [ ] 25+ integration tests
- [ ] All use cases work
- [ ] No regression (URL parameters)

### UI/UX Review
- [ ] Cross-reference against Use Cases 1-5
- [ ] Test workflow: <5 minutes to customize
- [ ] Error messages helpful
- [ ] Visual feedback clear
- [ ] SVG schematics intuitive

---

## Files Summary

### Created in Sub-stage 12.1 ✅
- `data/ships/far_trader.json`
- `data/ships/patrol_corvette.json`
- `data/ships/mercenary_cruiser.json`
- `data/ships/subsidised_liner.json`
- `data/ships/safari_ship.json`
- `data/ships/seeker.json`
- `data/ships/laboratory_ship.json`

### To Create (Sub-stages 12.2-12.7)
**SVG Assets (9 files):**
- `public/assets/ships/scout.svg`
- `public/assets/ships/free_trader.svg`
- `public/assets/ships/far_trader.svg`
- `public/assets/ships/patrol_corvette.svg`
- `public/assets/ships/mercenary_cruiser.svg`
- `public/assets/ships/subsidised_liner.svg`
- `public/assets/ships/safari_ship.svg`
- `public/assets/ships/seeker.svg`
- `public/assets/ships/laboratory_ship.svg`

**JavaScript/HTML/CSS:**
- `public/ship-customizer.html`
- `public/ship-customizer.js`
- `lib/ship-customization.js`
- `lib/ship-library.js`
- Modify `public/index.html` (menu mode)
- Modify `public/app.js` (URL parsing, custom ships)
- Modify `public/styles.css` (menu + SVG styles)

**Tests:**
- `tests/unit/ship-customization.test.js`
- `tests/unit/ship-library.test.js`
- `tests/unit/cost-calculation.test.js`
- `tests/integration/custom-ship-combat.test.js`
- `tests/integration/menu-routing.test.js`

---

## Cost Calculation Formulas

### Base Costs (From Templates)
- Already in ship JSON: `"cost": 51480000` (Cr, not MCr)
- Display as MCr: `cost / 1000000` = MCr 51.48

### Modification Costs

**Turrets:**
- Single: MCr 0.2
- Double: MCr 0.5
- Triple: MCr 1.0

**Weapons:**
- Beam Laser: MCr 0.5
- Pulse Laser: MCr 1.0
- Missile Rack: MCr 0.75
- Sandcaster: MCr 0.25

**Armor:**
- Cost per point per ton: MCr 0.05 × (tonnage / 10) × armor rating
- Example: 200t ship, Armor 4 = MCr 0.05 × 20 × 4 = MCr 4.0

**Drives (Simplified):**
- M-Drive upgrade: ~MCr 2-4 per thrust increase
- J-Drive upgrade: ~MCr 5-10 per jump increase
- (Use lookup table from Core Rulebook or approximate)

**Total Modification Cost:**
```javascript
modCost = turretCost + weaponCost + armorCost + driveCost;
totalCost = baseCost + modCost;
```

---

## Estimated Effort (REVISED)

### Token Budget
- **Original estimate:** ~12k tokens
- **Revised estimate (with SVG):** ~14k tokens
- SVG creation adds ~2k (simple geometric shapes)

### Time Estimate
- **Original:** 2-3 weeks
- **Revised:** 2.5-3.5 weeks (SVG work adds ~0.5 week)
- Sub-stage breakdown:
  - 12.0: Pre-setup (DONE - 30 min)
  - 12.1: Templates (DONE - 2 days)
  - 12.2: Menu (1 day)
  - 12.3: SVG Schematics (2-3 days) **+1 day vs original**
  - 12.4: Customization UI (3-4 days)
  - 12.5: Ship Library (2 days)
  - 12.6: Combat Integration (2 days)
  - 12.7: Testing (2 days)
  - **Total:** 14-18 days (~2.5-3.5 weeks)

### LOC Estimate
- **Production:** ~700 LOC (up from 600 - SVG interaction)
- **Tests:** ~400 LOC
- **SVG:** ~1,800 lines (9 ships × ~200 lines each)
- **JSON data:** ~1,400 lines (done)

---

## Success Metrics

- ✅ All 6 use cases work (5 immediate, 1 deferred)
- ✅ 9 ship templates with SVG schematics
- ✅ Visual, intuitive ship customization
- ✅ Cost tracking shows MCr spent
- ✅ Custom ships save/load correctly
- ✅ Custom ships work in combat
- ✅ Menu doesn't break tests (URL parameters)
- ✅ 100+ tests passing

---

## RISK ANALYSIS & MITIGATION

**Analysis Date:** 2025-11-12
**Risk Assessment:** Comprehensive review of Stage 12 implementation risks
**Focus:** Test stability, backward compatibility, rollback strategies

### CRITICAL RISKS IDENTIFIED

#### **RISK #1: Breaking Integration Tests (HIGH SEVERITY) ⚠️**

**Current State:**
- **30 test files** use `getElementById()` to access DOM elements
- **5 browser tests** navigate to `http://localhost:3000` expecting immediate combat UI
- Tests hardcode element IDs: `ship-option-scout`, `ship-option-free_trader`, `ready-button`, `ship-selection-screen`
- Puppeteer tests use `waitForSelector` and timing-based waits

**Breaking Changes:**
1. Adding menu screen changes page load sequence
2. Menu = extra navigation layer → tests expecting direct ship selection **WILL FAIL**
3. DOM elements hidden behind menu → `waitForSelector` will timeout
4. Ship selection screen initially `display: none` → tests fail

**Impact:** 🔴 **HIGH** - Could break 10-15 integration tests

**MITIGATION STRATEGIES:**

**1. URL Parameter Bypass (PRIMARY DEFENSE)**
```javascript
// ?mode=battle → Skip menu, show ship selection (existing behavior)
// ?mode=customize → Skip menu, show customization
// No params → Show menu

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

if (mode === 'battle' || !mode) {  // Default to battle for backward compat
  showShipSelection();
} else if (mode === 'customize') {
  showCustomization();
} else {
  showMenu();
}
```

**2. Test Update Strategy**
- **Affected files:** 5 integration tests
  - `tests/integration/browser.test.js` (line 94)
  - `tests/integration/browser-simple.test.js` (line 63)
  - `tests/integration/browser-full.test.js`
  - `tests/integration/space-combat.test.js`
  - `tests/integration/stage3.test.js`

- **Fix:** ONE-LINE change per test:
```javascript
// OLD:
await page.goto('http://localhost:3000');

// NEW:
await page.goto('http://localhost:3000?mode=battle');
```

- **Automation script:**
```bash
# Update all test URLs
sed -i "s|localhost:3000'|localhost:3000?mode=battle'|g" tests/integration/*.test.js
npm test  # Verify
# If fails: git checkout tests/  # Rollback
```

**3. DOM ID Preservation**
- Keep ALL existing element IDs unchanged
- Menu uses NEW IDs only: `menu-screen`, `menu-customize-btn`, `menu-battle-btn`
- Zero risk of ID collision

**4. Backward Compatibility Layer**
- Default behavior (no URL params) = show menu
- Tests with `?mode=battle` = skip menu (backward compatible)
- **Critical:** Test BOTH paths before merging

**Rollback Plan:**
- Level 1: Remove `?mode=battle` from tests if breaks
- Level 2: Hide menu by default (`display: none`), show only if `?mode=menu`
- Level 3: Delete menu completely, keep Sub-stage 12.1 ship templates

---

#### **RISK #2: Ship Selection Screen Breaking (HIGH SEVERITY) ⚠️**

**Current State:**
- Ship selection hardcoded for 2 ships in HTML
- Element IDs: `ship-option-scout`, `ship-option-free_trader`
- Tests validate these specific IDs exist

**Breaking Changes:**
- Adding 7 new ship templates → need 9 ship options
- Adding custom ships → unknown quantity, dynamic names
- Hardcoding 9+ ships in HTML = maintenance nightmare

**Impact:** 🔴 **HIGH** - HTML bloat, test fragility

**MITIGATION STRATEGIES:**

**1. Dynamic Ship Loading (Sub-stage 12.6)**
```javascript
// Load ships from server + localStorage
async function populateShipSelection() {
  const standardShips = await fetch('/api/ships').then(r => r.json());
  const customShips = loadCustomShips();  // from localStorage

  // Render standard ships (keep IDs for backward compat)
  renderStandardShips(standardShips);

  // Render custom ships (new section)
  renderCustomShips(customShips);
}
```

**2. Ship Selection Modes (Tabs)**
```html
<div class="ship-selection-tabs">
  <button class="tab active" data-tab="standard">Standard Ships</button>
  <button class="tab" data-tab="custom">My Custom Ships</button>
</div>
<div id="standard-ships"><!-- Scout, Free Trader, etc. --></div>
<div id="custom-ships" style="display:none;"><!-- From localStorage --></div>
```

**3. ID Backward Compatibility**
- Keep `ship-option-scout` and `ship-option-free_trader` IDs
- New ships use pattern: `ship-option-{ship_id}`
- Tests still pass (scout + free_trader exist)

**4. Test Fixtures**
```javascript
// tests/fixtures/ships.json
{
  "scout": { "id": "scout", "name": "Scout", ... },
  "free_trader": { "id": "free_trader", "name": "Free Trader", ... }
}

// Tests use fixtures, not live data
const ships = require('../fixtures/ships.json');
```

**Rollback Plan:**
- Level 1: Keep both hardcoded + dynamic (fallback to hardcoded if dynamic fails)
- Level 2: Remove new ship options, keep original 2
- Level 3: Revert to Stage 11 ship selection

---

#### **RISK #3: Combat Code Ship Object Changes (MEDIUM SEVERITY) ⚠️**

**Current State:**
- Combat expects: `{ id, name, hull, armour, thrust, turrets }`
- Ships loaded from `data/ships/*.json`

**Breaking Changes:**
- Custom ships include: `baseCost`, `mods`, `modCost`, `totalCost`, `templateId`
- Combat code might reject/crash on unexpected fields
- Server validation assumes standard ship format

**Impact:** 🟡 **MEDIUM** - Combat breaks with custom ships

**MITIGATION STRATEGIES:**

**1. Ship Adapter Pattern**
```javascript
// lib/ship-adapter.js
function normalizeShipForCombat(ship) {
  // Accept custom ship, return combat-ready format
  const base = ship.templateId ? loadTemplate(ship.templateId) : ship;

  return {
    id: ship.id,
    type: ship.type,
    name: ship.name || base.name,
    hull: ship.hull || base.hull,
    armour: ship.mods?.armor || base.armour,
    thrust: ship.mods?.thrust || base.thrust,
    turrets: ship.mods?.turrets || base.turrets,
    // Strip: baseCost, modCost, templateId, etc.
  };
}
```

**2. Server-Side Validation (CRITICAL)**
```javascript
// server.js
io.on('ship:select:custom', (customShip) => {
  const errors = validateCustomShip(customShip);
  if (errors.length > 0) {
    socket.emit('ship:invalid', { errors });
    return;
  }

  // Normalize for combat
  const combatShip = normalizeShipForCombat(customShip);

  // Proceed with combat
  gameState.ships[playerId] = combatShip;
});

function validateCustomShip(ship) {
  const errors = [];

  // Required fields
  if (!ship.templateId) errors.push('Missing templateId');
  if (!ship.name) errors.push('Missing name');

  // Validate mods
  if (ship.mods) {
    if (ship.mods.turrets && ship.mods.turrets.length > ship.hardpoints) {
      errors.push('Turrets exceed hardpoints');
    }
  }

  return errors;
}
```

**3. Schema Validation**
- Validate custom ships against `data/schemas/ship.schema.json` before saving
- Reject invalid ships at save time (don't let them reach combat)

**Rollback Plan:**
- Level 1: Disable custom ships in combat (standard ships only)
- Level 2: Add "Convert to Standard" button (strips custom fields)
- Level 3: Remove custom ship feature from combat entirely

---

#### **RISK #4: localStorage Data Corruption (MEDIUM SEVERITY) ⚠️**

**Threats:**
- Users manually edit localStorage (invalid JSON)
- localStorage quota exceeded (5-10 MB browser limit)
- Browser clears localStorage unexpectedly
- Schema changes → old format persists

**Impact:** 🟡 **MEDIUM** - Lost ships, crashes on load

**MITIGATION STRATEGIES:**

**1. Versioned Storage Format**
```javascript
// Versioned storage
{
  "version": 1,
  "created": "2025-11-12T10:00:00Z",
  "customShips": [...]
}

function loadCustomShips() {
  try {
    const data = localStorage.getItem('traveller-custom-ships');
    if (!data) return [];

    const parsed = JSON.parse(data);

    // Version mismatch → migrate or reject
    if (parsed.version !== CURRENT_VERSION) {
      return migrateShips(parsed);
    }

    return parsed.customShips;
  } catch (error) {
    console.error('Failed to load custom ships:', error);
    // Don't crash, return empty
    return [];
  }
}
```

**2. Try/Catch with Fallback**
```javascript
function saveCustomShip(ship) {
  try {
    const ships = loadCustomShips();
    ships.push(ship);

    const data = {
      version: CURRENT_VERSION,
      customShips: ships
    };

    localStorage.setItem('traveller-custom-ships', JSON.stringify(data));
    return { success: true };
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded' };
    }
    return { success: false, error: error.message };
  }
}
```

**3. Export/Import Feature (Sub-stage 12.5)**
```javascript
// Export ships as JSON file
function exportShips() {
  const ships = loadCustomShips();
  const json = JSON.stringify(ships, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'traveller-ships.json';
  a.click();
}

// Import from JSON file
function importShips(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const ships = JSON.parse(e.target.result);
      // Validate and save
      ships.forEach(validateAndSaveShip);
    } catch (error) {
      alert('Invalid ship file');
    }
  };
  reader.readAsText(file);
}
```

**Rollback Plan:**
- Level 1: Clear corrupted localStorage, start fresh
- Level 2: Show error message, allow manual recovery
- Level 3: Disable localStorage, use server storage instead

---

#### **RISK #5: SVG Performance & Complexity (LOW-MEDIUM SEVERITY) ⚠️**

**Threats:**
- 9 SVG files × 200 lines = 1,800 lines of SVG code
- SVG click detection finicky (need proper `pointer-events`)
- Inline SVG bloats HTML, external SVG = extra HTTP requests
- Mobile devices may struggle with complex SVG

**Impact:** 🟢 **LOW-MEDIUM** - Performance, maintenance

**MITIGATION STRATEGIES:**

**1. Simple SVG Geometry**
```svg
<!-- Target: <100 lines per SVG -->
<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Ship hull: simple polygon -->
  <polygon points="150,20 250,100 250,300 150,380 50,300 50,100"
           fill="#1a1a2e" stroke="#16213e" stroke-width="2"/>

  <!-- Components: basic shapes -->
  <circle id="turret1" cx="150" cy="80" r="25"
          class="clickable" data-component="turret1"/>
  <rect id="cargo" x="100" y="180" width="100" height="60"
        class="clickable" data-component="cargo"/>
  <rect id="m-drive" x="100" y="300" width="45" height="40"
        class="clickable" data-component="m-drive"/>
</svg>
```

**2. Lazy Loading**
```javascript
// Only load SVG for selected template
function selectTemplate(templateId) {
  const svg = document.getElementById('ship-svg');
  svg.innerHTML = '';  // Clear

  // Load only the selected ship's SVG
  loadShipSVG(templateId).then(svgContent => {
    svg.innerHTML = svgContent;
    attachSVGListeners();
  });
}
```

**3. Click Region Sizing**
```css
.clickable {
  cursor: pointer;
  pointer-events: all;  /* Ensure clickable */
}

.clickable:hover {
  opacity: 0.8;
  stroke: #ffaa00;
  stroke-width: 3;
}
```

**4. Fallback to Simple UI**
```javascript
// Feature detection
if (!document.createElementNS) {
  // SVG not supported → show form-based UI
  showFormBasedCustomization();
} else {
  // SVG supported → show visual UI
  showSVGCustomization();
}
```

**Rollback Plan:**
- Level 1: Simplify SVG (remove gradients, effects)
- Level 2: Use placeholder images instead of SVG
- Level 3: Remove SVG entirely, use form-based UI (still functional)

---

#### **RISK #6: Cost Calculation Errors (MEDIUM SEVERITY) ⚠️**

**Threats:**
- Complex cost formulas (armor by tonnage, drives by rating)
- Floating point errors (0.1 + 0.2 = 0.30000000000000004)
- Client/server cost mismatch
- User confused by cost breakdown

**Impact:** 🟡 **MEDIUM** - Incorrect costs, user distrust

**MITIGATION STRATEGIES:**

**1. Server-Side Cost Validation**
```javascript
function validateShipCost(ship) {
  const serverCost = calculateTotalCost(ship);
  const clientCost = ship.totalCost;

  // Allow 1 cent (0.01 MCr) tolerance for rounding
  if (Math.abs(serverCost - clientCost) > 0.01) {
    return {
      valid: false,
      error: 'Cost mismatch',
      expected: serverCost,
      received: clientCost
    };
  }

  return { valid: true };
}
```

**2. Fixed-Point Arithmetic**
```javascript
// Store costs as integer credits (not MCr)
const BASE_COST_CR = 51480000;  // 51.48 MCr in credits
const TURRET_COST_CR = 500000;  // 0.5 MCr

// Calculate in credits
const totalCostCr = BASE_COST_CR + TURRET_COST_CR;

// Convert to MCr only for display
const totalCostMCr = (totalCostCr / 1000000).toFixed(2);
```

**3. Cost Breakdown Logging**
```javascript
// Show itemized costs in UI
const breakdown = {
  base: { label: 'Base Ship', cost: 51.48 },
  turrets: { label: '2× Double Turrets', cost: 1.0 },
  weapons: { label: '4× Beam Lasers', cost: 2.0 },
  armor: { label: 'Armor Upgrade (2→4)', cost: 2.0 },
  total: { label: 'Total', cost: 56.48 }
};

// Render breakdown table
renderCostBreakdown(breakdown);
```

**4. Cost Formula Documentation**
```javascript
// Document formulas in code
/**
 * Armor Cost Formula:
 * Cost = MCr 0.05 × (tonnage ÷ 10) × armor_rating
 *
 * Example: 200t ship, Armor 4
 * Cost = 0.05 × (200 ÷ 10) × 4 = 0.05 × 20 × 4 = MCr 4.0
 */
function calculateArmorCost(tonnage, armorRating) {
  return 0.05 * (tonnage / 10) * armorRating;
}
```

**Rollback Plan:**
- Level 1: Show server-calculated cost (override client)
- Level 2: Disable custom cost features, use template costs only
- Level 3: Remove cost tracking entirely (defer to later stage)

---

### ROLLBACK PLANS

#### **Full Rollback: Revert to Stage 11**
```bash
# If Stage 12 completely breaks production
git checkout main
git log --oneline -10  # Find Stage 11 commit
git reset --hard <stage-11-commit-hash>
git push origin main --force-with-lease  # Use with caution

# Verify
npm test
node server.js
```

#### **Partial Rollback: Remove Menu Only**
```bash
# Keep ship templates (Sub-stage 12.1), remove menu
git revert <menu-commit-hash>
# OR manually:
# 1. Delete menu HTML from index.html
# 2. Remove menu JS from app.js
# 3. Remove menu CSS from styles.css
# Result: Stage 11 + ship templates (still valuable)
```

#### **Emergency Test Fix**
```bash
# If tests break, quick fix:
# Add ?mode=battle to all test URLs (one line per test)
sed -i "s|localhost:3000'|localhost:3000?mode=battle'|g" tests/integration/*.test.js

# Verify
npm test

# If still fails:
git checkout tests/  # Rollback test changes
```

#### **Sub-stage Isolation Rollback**
- Sub-stage 12.2 breaks → Revert menu only
- Sub-stage 12.3 breaks → Remove SVG, use placeholder UI
- Sub-stage 12.4 breaks → Disable save feature, customization view-only
- Sub-stage 12.5 breaks → Remove localStorage, use session storage
- Sub-stage 12.6 breaks → Disable custom ships in combat

---

### IMPLEMENTATION SAFEGUARDS

#### **Sub-stage 12.2 Checklist (Main Menu)**
- [ ] URL parameter parsing works (`?mode=battle`, `?mode=customize`)
- [ ] `?mode=battle` skips menu → ship selection (backward compatible)
- [ ] `?mode=customize` skips menu → customization
- [ ] No URL params → menu shows
- [ ] Run ALL tests with `?mode=battle` URL
- [ ] **STOP CONDITION:** If >2 tests fail → debug before proceeding
- [ ] Rollback plan ready (menu removal script)

#### **Sub-stage 12.3 Checklist (SVG)**
- [ ] SVG renders correctly in Chrome, Firefox, Safari
- [ ] Click detection works on all components
- [ ] Hover states visible and clear
- [ ] Mobile responsive (viewport scaling)
- [ ] **STOP CONDITION:** If SVG broken after 4 hours → switch to form-based UI
- [ ] Fallback UI ready

#### **Sub-stage 12.4 Checklist (Customization UI)**
- [ ] Cost calculation matches server (within 0.01 MCr)
- [ ] Validation prevents invalid configs
- [ ] Save/load from localStorage works
- [ ] Error handling for localStorage quota
- [ ] **STOP CONDITION:** If localStorage bugs persist → disable save temporarily
- [ ] Export/import feature works (recovery mechanism)

#### **Sub-stage 12.5 Checklist (Ship Library)**
- [ ] localStorage CRUD operations work
- [ ] Versioned storage format
- [ ] Migration from old format works
- [ ] Export/import for backup
- [ ] **STOP CONDITION:** If data corruption issues → switch to session storage

#### **Sub-stage 12.6 Checklist (Combat Integration)**
- [ ] Custom ships load into combat correctly
- [ ] Server validates ALL custom ships
- [ ] Combat log shows custom names
- [ ] Ship adapter normalizes custom → combat format
- [ ] **CRITICAL:** Run full combat test suite (30 tests)
- [ ] **STOP CONDITION:** If >3 tests fail → fix before proceeding
- [ ] Rollback: Disable custom ships in combat

#### **Sub-stage 12.7 Checklist (Testing)**
- [ ] All 30 existing tests still pass
- [ ] 75+ new unit tests passing
- [ ] 25+ integration tests passing
- [ ] Manual testing of all 5 use cases
- [ ] Zero regressions in Stages 1-11

---

### TEST UPDATE STRATEGY

#### **Affected Test Files (5 total)**
1. `tests/integration/browser.test.js` → Line 94
2. `tests/integration/browser-simple.test.js` → Line 63
3. `tests/integration/browser-full.test.js` → Multiple `page.goto` calls
4. `tests/integration/space-combat.test.js` → If using browser tests
5. `tests/integration/stage3.test.js` → Check if affected

#### **Automated Test Update Script**
```bash
#!/bin/bash
# tools/update-tests-for-stage-12.sh

echo "Updating integration tests for Stage 12 menu..."

# Backup original tests
cp -r tests/integration tests/integration.backup

# Update URLs in all integration tests
sed -i "s|localhost:3000'|localhost:3000?mode=battle'|g" tests/integration/*.test.js
sed -i 's|localhost:3000"|localhost:3000?mode=battle"|g' tests/integration/*.test.js

echo "Running tests..."
npm test

if [ $? -eq 0 ]; then
  echo "✓ Tests pass! Removing backup."
  rm -rf tests/integration.backup
else
  echo "✗ Tests failed! Rolling back..."
  rm -rf tests/integration
  mv tests/integration.backup tests/integration
  exit 1
fi
```

#### **Manual Test Update (If Script Fails)**
```javascript
// OLD (5 occurrences):
await page.goto('http://localhost:3000');

// NEW:
await page.goto('http://localhost:3000?mode=battle');

// Search pattern:
grep -n "localhost:3000" tests/integration/*.test.js
```

---

### FEATURE FLAGS (OPTIONAL)

For incremental rollout and A/B testing:

```javascript
// .env or config
ENABLE_MENU=true
ENABLE_SHIP_CUSTOMIZATION=true
ENABLE_CUSTOM_SHIPS_IN_COMBAT=true

// server.js
const FEATURE_FLAGS = {
  MENU_ENABLED: process.env.ENABLE_MENU === 'true',
  CUSTOMIZATION_ENABLED: process.env.ENABLE_SHIP_CUSTOMIZATION === 'true',
  CUSTOM_COMBAT_ENABLED: process.env.ENABLE_CUSTOM_SHIPS_IN_COMBAT === 'true'
};

// Send to client
io.on('connection', (socket) => {
  socket.emit('feature:flags', FEATURE_FLAGS);
});

// app.js
socket.on('feature:flags', (flags) => {
  if (!flags.MENU_ENABLED) {
    // Skip menu, go straight to ship selection
    showShipSelection();
  } else {
    // Show menu
    showMenu();
  }
});
```

**Rollout Strategy:**
1. Deploy with all flags OFF → Stage 11 behavior
2. Enable MENU_ENABLED → Test menu in production
3. Enable CUSTOMIZATION_ENABLED → Test ship customization
4. Enable CUSTOM_COMBAT_ENABLED → Full Stage 12

---

### SUCCESS METRICS

#### **Test Coverage**
- [ ] All 30 existing tests pass (zero regressions)
- [ ] 75+ new unit tests (ship customization, library, costs)
- [ ] 25+ new integration tests (menu, SVG, combat)
- [ ] 100% of Sub-stages 12.1-12.7 tested

#### **Functional Requirements**
- [ ] All 5 use cases work (UC1-UC5)
- [ ] Menu navigation smooth (< 1 sec transitions)
- [ ] Ship customization intuitive (< 5 min to customize)
- [ ] Custom ships persist across sessions
- [ ] Custom ships work in combat with correct stats

#### **Performance**
- [ ] SVG load time < 500ms
- [ ] localStorage save < 100ms
- [ ] Cost calculation < 50ms
- [ ] Page load < 2 sec (menu or combat)

#### **Cross-Browser**
- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Edge (desktop)

---

### RISK SUMMARY TABLE

| Risk | Severity | Mitigation | Rollback |
|------|----------|------------|----------|
| **#1: Breaking Tests** | 🔴 HIGH | URL params, one-line test fix | Remove `?mode=battle` |
| **#2: Ship Selection** | 🔴 HIGH | Dynamic loading, ID preservation | Keep hardcoded fallback |
| **#3: Combat Integration** | 🟡 MEDIUM | Ship adapter, server validation | Disable custom ships |
| **#4: localStorage Corruption** | 🟡 MEDIUM | Versioned storage, export/import | Clear + start fresh |
| **#5: SVG Performance** | 🟢 LOW-MED | Simple geometry, lazy loading | Form-based UI fallback |
| **#6: Cost Calculation** | 🟡 MEDIUM | Fixed-point math, server validation | Use template costs only |

---

### IMPLEMENTATION ORDER (REVISED)

**Week 1:**
- Sub-stage 12.2: Menu + URL params (1 day) → **Test IMMEDIATELY**
- Sub-stage 12.3: SVG schematics (2-3 days) → **Visual review**

**Week 2:**
- Sub-stage 12.4: Customization UI (3-4 days) → **Test cost calc**
- Sub-stage 12.5: Ship library (2 days) → **Test localStorage**

**Week 3:**
- Sub-stage 12.6: Combat integration (2 days) → **CRITICAL: Full test suite**
- Sub-stage 12.7: Testing + polish (2 days) → **Final validation**

**Stop Conditions:**
- After 12.2: >2 tests fail → STOP
- After 12.3: SVG broken after 4 hrs → Switch to form UI
- After 12.6: >3 tests fail → STOP

---

## Next Steps

**Immediate:**
1. Sub-stage 12.2: Main menu with URL parameters
2. Sub-stage 12.3: Create SVG ship schematics (9 ships)
3. Sub-stage 12.4: SVG-based customization UI
4. Sub-stages 12.5-12.7: Library, integration, testing

**After Stage 12:**
- Stage 13: Boarding Actions
- Stage 14: Portfolio Documentation (Architecture + Security)
- Stage 20: High Guard (inflatable tanks, fighter bays, etc.)

---

## PLAN FINALIZED

**Status:** ✅ READY TO IMPLEMENT
**Sub-stage 12.1:** ✅ COMPLETE (9 ship templates created)
**Next:** Sub-stage 12.2 (Main Menu / Landing Page)

**Key Changes from Original:**
1. SVG-based visual UI (not form-based)
2. Cost tracking/budget system
3. Click component → Customize pattern
4. Ship schematics show component placement
5. All templates include base cost

This plan is optimized for **immediate user value** (visual ship customization) and **future extensibility** (High Guard components in Stage 20).
