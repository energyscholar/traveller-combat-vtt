# AUTORUN 14: Ship Builder & Shared Map

**Created:** 2025-12-02
**Status:** PLANNED (after AR-13)
**Risk Level:** MEDIUM-HIGH
**Prerequisite:** AUTORUN-13 complete

---

## Overview

Ship customization system + collaborative map features. Major feature autorun.

**Reference:** `.claude/TODO-ship-builder-system.md` - Comprehensive breakdown

---

## Stage 14.1: Ship CRUD UI (Foundation)
**Risk:** LOW | **LOC:** ~400 | **Priority:** HIGH

Entry point: Ship/Role selection screen in Operations VTT.

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 14.1.1 | Ship list with summary cards | ~80 |
| 14.1.2 | Ship detail view modal | ~100 |
| 14.1.3 | Clone ship as template | ~60 |
| 14.1.4 | Basic property editing (name, cargo) | ~80 |
| 14.1.5 | Delete ship (GM only) | ~40 |
| 14.1.6 | Export/Import JSON | ~40 |

**Deliverable:** Players can view, clone, edit, and manage ships.

---

## Stage 14.2: Ship Schema & Validation
**Risk:** MEDIUM | **LOC:** ~300 | **Priority:** HIGH

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 14.2.1 | Create `schemas/ship.schema.json` | ~150 |
| 14.2.2 | Component definitions schema | ~100 |
| 14.2.3 | Validation rules (tonnage, power) | ~50 |

### New Schema Fields (from Gorram analysis):
- `barbettes[]` - Heavy weapon mounts
- `smallCraft[]` - Carried vessels (fighters, pinnace)
- `specialFeatures{}` - Rad shielding, reflect shields, etc.
- `drones{}` - Probe and repair drones
- `powerPlant{}` - Detailed power stats
- `crewRequirements.fighterPilots` - Fighter crew

**Deliverable:** Full ship schema with validation.

---

## Stage 14.3: Component Picker UI
**Risk:** MEDIUM | **LOC:** ~600 | **Priority:** MEDIUM

Visual ship designer interface.

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 14.3.1 | Hull selection widget | ~80 |
| 14.3.2 | Drive configuration (M/J) | ~80 |
| 14.3.3 | Power plant selector | ~60 |
| 14.3.4 | Weapon/Turret builder | ~150 |
| 14.3.5 | Armor & defense options | ~80 |
| 14.3.6 | Crew & accommodations | ~80 |
| 14.3.7 | Cargo & fuel calculator | ~70 |

**Deliverable:** Full visual ship builder for Core Rulebook ships.

---

## Stage 14.4: Shared Traveller Map View
**Risk:** MEDIUM | **LOC:** ~300 | **Priority:** HIGH

GM-controlled shared map display for all players.

### Features:
- GM can display Traveller Map centered on any system
- GM controls zoom level
- All players see same center point and scale
- Players can interact (hover for info, click for details)

### Tasks:
| Task | Description | Est. LOC |
|------|-------------|----------|
| 14.4.1 | Map View panel UI | ~100 |
| 14.4.2 | Socket events (setMapCenter, sync) | ~80 |
| 14.4.3 | Map state persistence | ~60 |
| 14.4.4 | Player read-only view | ~60 |

### Use Cases:
- "We're here, heading there" tactical briefing
- Planning routes as a group
- Dramatic "you've arrived at..." reveals

---

## Stage 14.5: High Guard Components (Future)
**Risk:** HIGH | **LOC:** ~800+ | **Priority:** LOW
**Dependency:** High Guard PDF rules extraction

Deferred to AR-15+ unless time permits:
- Capital ship components (bay weapons, spinal mounts)
- Advanced systems (extended life support, labs)
- Fighter operations (recovery deck, repair)
- Full rules enforcement

---

## Gorram Ship (Test Case)

**600-ton "Trojan Horse" X-Carrier Q-Ship** - Created as `data/ships/gorram.json`

### Key Features:
- 6× Light Fighters + 1× Pinnace (hidden hangars)
- Ion & Particle Barbettes (heavy firepower)
- 4× Popup Triple Turrets (concealed until combat)
- Rad Shielding + Reflect Shield
- Jump-3, Thrust-3

### Design Issues to Address:
1. **Tonnage**: 620 used in 600 hull (20 over)
2. **Crew Quarters**: 12 staterooms for 19 crew
3. **Schema**: New fields needed (barbettes, smallCraft, etc.)

**Use Case:** Players transitioning from Type-S Scout to custom Q-ship.

---

## Total Estimates

| Stage | LOC | Risk | Priority |
|-------|-----|------|----------|
| 14.1 Ship CRUD UI | ~400 | LOW | HIGH |
| 14.2 Ship Schema | ~300 | MEDIUM | HIGH |
| 14.3 Component Picker | ~600 | MEDIUM | MEDIUM |
| 14.4 Shared Map | ~300 | MEDIUM | HIGH |
| 14.5 High Guard | ~800+ | HIGH | LOW |
| **Total (excl 14.5)** | **~1600** | **MEDIUM** | - |

---

## Files Created

- `data/ships/gorram.json` - Custom 600-ton X-Carrier
- `.claude/TODO-ship-builder-system.md` - Comprehensive breakdown (56-81 hours total)

---

## Notes

This is a major feature autorun. High Guard full implementation may span AR-14 through AR-16 depending on scope decisions.
