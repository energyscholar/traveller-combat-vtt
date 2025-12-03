# TODO: Ship Builder & Customization System

**Created:** 2025-12-02
**Priority:** LOW (AR-14 scope)
**Complexity:** HIGH - Major feature requiring High Guard rules

---

## Overview

Full CRUD ship customization system allowing players to design, edit, and manage their ships using complete Traveller/High Guard rules.

### Entry Point
Ship/Role selection screen in Operations VTT - players can:
- Select existing ship from library
- Create new custom ship
- Edit existing ship (clone & modify)
- Delete ships (GM only initially, players later)

### Current State
- Ship JSON files exist in `data/ships/`
- Basic ship loading works
- No UI for editing ships
- Schema not enforced (ships reference non-existent schema)
- Validator warns on unknown fields but doesn't block

---

## Phase 1: Ship CRUD UI (Foundation)
**Priority:** HIGH | **Effort:** 8-12 hours

### 1.1 Ship List Management
- [ ] Display all available ships on selection screen
- [ ] Show ship summary cards (tonnage, role, weapons, cost)
- [ ] Filter by: tonnage range, role, jump capability
- [ ] Search by name
- [ ] Sort by: name, tonnage, cost, role

### 1.2 Ship Detail View
- [ ] Full ship stats display
- [ ] Turret/weapon breakdown
- [ ] Crew requirements
- [ ] Small craft carried
- [ ] Special features

### 1.3 Basic CRUD Operations
- [ ] **Create**: Clone existing ship as template
- [ ] **Read**: View any ship in library
- [ ] **Update**: Edit ship properties (name, cargo, etc.)
- [ ] **Delete**: Remove ship (GM only initially)

### 1.4 Ship Persistence
- [ ] Save custom ships to user's campaign
- [ ] Export ship as JSON
- [ ] Import ship from JSON
- [ ] Ship versioning (track changes)

---

## Phase 2: Ship Schema & Validation
**Priority:** HIGH | **Effort:** 6-8 hours

### 2.1 Create Ship Schema
- [ ] `schemas/ship.schema.json` - Full JSON Schema
- [ ] All current fields documented
- [ ] New High Guard fields defined
- [ ] Validation rules for tonnage limits

### 2.2 Ship Components Schema
```javascript
// Required schema definitions:
- Hull types (standard, streamlined, distributed)
- Armor types (titanium, crystaliron, bonded superdense)
- Drive types (M-Drive, J-Drive ratings)
- Power plant configurations
- Bridge types (standard, hardened, holographic)
- Computer models (1-30, fib variants)
- Sensor packages (basic, civilian, military, improved, advanced)
- Weapon types (lasers, missiles, particle, meson, etc.)
- Turret types (single, double, triple, popup)
- Barbette types (particle, ion, plasma, etc.)
- Bay weapons (particle, meson, missile, fighter)
- Small craft types (launch, pinnace, cutter, fighter)
- Special features (fuel scoops, armor, screens, etc.)
```

### 2.3 Validation Rules
- [ ] Tonnage cannot exceed hull size
- [ ] Power consumption cannot exceed power plant output
- [ ] Hardpoints limited by tonnage (1 per 100 tons)
- [ ] Crew requirements based on components
- [ ] Cost calculation verification

---

## Phase 3: Component Picker UI
**Priority:** MEDIUM | **Effort:** 12-16 hours

### 3.1 Hull Selection
- [ ] Hull size picker (100-ton increments or free entry)
- [ ] Hull configuration (standard, streamlined, sphere, etc.)
- [ ] Base cost calculation
- [ ] Hull points auto-calculated

### 3.2 Drive Configuration
- [ ] M-Drive rating selector (0-6)
- [ ] J-Drive rating selector (0-6)
- [ ] Tonnage/cost auto-calculation per rating
- [ ] Power requirement display

### 3.3 Power Plant
- [ ] Rating selector
- [ ] Output calculation
- [ ] Power budget display (used vs available)

### 3.4 Bridge & Computer
- [ ] Bridge type selector
- [ ] Computer model picker
- [ ] Software selection
- [ ] TL requirements shown

### 3.5 Weapons & Turrets
- [ ] Add/remove turrets
- [ ] Turret type selection (single/double/triple)
- [ ] Weapon assignment per turret
- [ ] Popup option
- [ ] Barbette configuration
- [ ] Bay weapons (larger ships)

### 3.6 Armor & Defenses
- [ ] Armor type selector
- [ ] Armor points calculator
- [ ] Screens (nuclear damper, meson screen)
- [ ] Point defense configuration

### 3.7 Small Craft
- [ ] Hangar configuration
- [ ] Small craft picker
- [ ] Launch/recovery systems
- [ ] Docking space vs full hangar

### 3.8 Crew & Accommodations
- [ ] Stateroom count
- [ ] Low berth count
- [ ] Crew requirement calculator
- [ ] Passenger capacity

### 3.9 Cargo & Fuel
- [ ] Cargo hold sizing
- [ ] Fuel tank calculation (based on J-Drive)
- [ ] Fuel scoops/processor options
- [ ] Collapsible tanks

---

## Phase 4: High Guard Advanced Features
**Priority:** LOW | **Effort:** 20-30 hours
**Dependency:** High Guard PDF rules extraction

### 4.1 Capital Ship Components
- [ ] Bay weapons (50+ tons)
- [ ] Spinal mounts
- [ ] Large bays (100+ ton weapons)
- [ ] Capital ship screens
- [ ] Armor for 1000+ ton ships

### 4.2 Advanced Systems
- [ ] Repair drones
- [ ] Medical bays
- [ ] Labs and workshops
- [ ] Mining equipment
- [ ] Extended life support

### 4.3 Fighter Operations
- [ ] Fighter hangar configuration
- [ ] Recovery deck
- [ ] Fighter repair facilities
- [ ] Pilot accommodations

### 4.4 Fleet Auxiliaries
- [ ] Tender configurations
- [ ] Fuel shuttles
- [ ] Repair ships
- [ ] Hospital ships

---

## Phase 5: Rules Enforcement
**Priority:** MEDIUM | **Effort:** 10-15 hours

### 5.1 Construction Rules
- [ ] TL restrictions (can't use TL15 gear at TL12)
- [ ] Military vs civilian restrictions
- [ ] Imperial Navy standards
- [ ] Customs/regulations compliance

### 5.2 Cost Calculations
- [ ] Auto-calculate total cost
- [ ] Monthly maintenance cost
- [ ] Mortgage payment calculator
- [ ] Crew salary calculator

### 5.3 Performance Calculations
- [ ] Jump range calculator
- [ ] Thrust-to-weight ratio
- [ ] Endurance (fuel + life support)
- [ ] Agility rating

### 5.4 Design Validation
- [ ] "Legal" design checker
- [ ] Warnings for edge cases
- [ ] House rules toggle (allow variants)
- [ ] Design notes/justification field

---

## Gorram Ship Analysis

### Current Design (from PDF)
```
Trojan Horse: 600 ton X-Carrier Q-Ship
- Hull: 600 tons, 240 HP, Semi-Streamlined
- Armor: Bonded Super Dense (1), Rad Shielding, Reflect Shield
- Drives: M-3, J-3
- Power: 32 rating, 548 output
- Fuel: 183 tons
- Bridge: 20 tons, Computer/25 TL13
- Sensors: Improved + Station + 5 Probe Drones
- Weapons:
  - 4× Triple Turrets (popup): 8 Pulse Lasers, 2 Missiles, 2 Sand
  - 1× Ion Barbette (Medium Range)
  - 1× Particle Barbette (Very Long Range)
- Small Craft:
  - 6× 10-ton Light Fighters
  - 1× 40-ton Pinnace
- Crew: 13 full (3 pilot, 3 engineer, 6 gunner, 1 steward)
  - Plus 6 fighter pilots = 19 total
- Cargo: 117 tons
- Cost: MCr 265.4
```

### Design Issues Found
1. **Tonnage Overrun**: 620 tons used in 600 ton hull
   - Need to cut 20 tons somewhere
   - Options: reduce cargo, fewer fighters, smaller sensors

2. **Power Budget**: Need to verify 548 output covers all systems
   - M-Drive 3: 180 power
   - J-Drive 3: 180 power (during jump only)
   - Weapons: ~50 power
   - Sensors: 4 power
   - Should be fine for normal ops

3. **Crew Quarters**: 12 staterooms for 19+ crew
   - Need hot-bunking or more staterooms
   - Fighter pilots could use low berths between ops

### Features Requiring New Schema Fields
- `barbettes[]` - New weapon mount type
- `smallCraft[]` - Carried vessels
- `specialFeatures{}` - Rad shielding, reflect, etc.
- `drones{}` - Probe and repair drones
- `powerPlant{}` - Detailed power stats
- `crewRequirements.fighterPilots` - New crew type

---

## Integration with Operations VTT

### Ship Selection Screen Enhancements
1. "Edit Ship" button next to ship cards
2. "Create Custom Ship" button
3. Ship preview panel (existing)
4. Import/Export buttons

### Campaign Integration
- Custom ships saved per-campaign
- Ship modifications tracked in logs
- Repair/refit as gameplay events
- Cost deducted from ship funds

### Combat Integration
- Custom ships work in combat system
- Weapon loadouts affect combat options
- Small craft can be launched (future)
- Damage maps to correct systems

---

## Files to Create/Modify

### New Files
- `schemas/ship.schema.json` - Ship validation schema
- `schemas/components.schema.json` - Component definitions
- `public/operations/modules/ship-builder.js` - Builder UI
- `public/operations/modules/ship-editor.css` - Builder styles
- `lib/operations/ship-builder.js` - Server-side validation
- `data/components/weapons.json` - Weapon database
- `data/components/drives.json` - Drive database
- `data/components/hulls.json` - Hull database

### Modified Files
- `public/operations/app.js` - Add builder entry points
- `lib/socket-handlers/operations.handlers.js` - Ship CRUD handlers
- `lib/operations/database.js` - Ship storage tables
- `data/ships/index.json` - Include custom ships

---

## Success Criteria

### Phase 1 (MVP)
- [ ] Players can view all ship details
- [ ] Players can clone and rename ships
- [ ] Basic property editing works
- [ ] Ships persist to campaign

### Phase 2 (Usable)
- [ ] Full ship creation from scratch
- [ ] All Core Rulebook components available
- [ ] Validation prevents illegal designs
- [ ] Cost auto-calculated

### Phase 3 (Complete)
- [ ] High Guard components available
- [ ] Capital ship support
- [ ] Fighter operations
- [ ] Design import/export

---

## Estimated Total Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: CRUD UI | 8-12 | HIGH |
| Phase 2: Schema | 6-8 | HIGH |
| Phase 3: Components | 12-16 | MEDIUM |
| Phase 4: High Guard | 20-30 | LOW |
| Phase 5: Rules | 10-15 | MEDIUM |
| **Total** | **56-81** | - |

This is a major feature spanning multiple autoruns (AR-14, AR-15+).
