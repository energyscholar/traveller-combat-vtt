# Ship Component Cost Reference - Quick Lookup

**Source:** Mongoose Traveller 2E High Guard 2022 Update
**Last Updated:** 2025-11-13
**Purpose:** Quick reference for ship design cost calculations

---

## PROPULSION SYSTEMS

### Jump Drives
| Rating | Formula | Fuel Required | Cost | Min TL |
|--------|---------|---------------|------|--------|
| J-1 | (Hull × 2.5%) + 5t, min 10t | Hull × 10% | MCr 1.5/ton | 9 |
| J-2 | (Hull × 5%) + 5t, min 10t | Hull × 20% | MCr 1.5/ton | 11 |
| J-3 | (Hull × 7.5%) + 5t, min 15t | Hull × 30% | MCr 1.5/ton | 12 |
| J-4 | (Hull × 10%) + 5t, min 20t | Hull × 40% | MCr 1.5/ton | 13 |
| J-5 | (Hull × 12.5%) + 5t, min 25t | Hull × 50% | MCr 1.5/ton | 14 |
| J-6 | (Hull × 15%) + 5t, min 30t | Hull × 60% | MCr 1.5/ton | 15 |

**Power Required:** Hull × Jump Rating × 10%

### Manoeuvre Drives
| Rating | Tonnage | Power Required | Cost | Min TL |
|--------|---------|----------------|------|--------|
| M-1 | Hull × 1% | Hull × 10% | MCr 2/ton | 9 |
| M-2 | Hull × 2% | Hull × 20% | MCr 2/ton | 9 |
| M-3 | Hull × 3% | Hull × 30% | MCr 2/ton | 10 |
| M-4 | Hull × 4% | Hull × 40% | MCr 2/ton | 10 |
| M-5 | Hull × 5% | Hull × 50% | MCr 2/ton | 11 |
| M-6 | Hull × 6% | Hull × 60% | MCr 2/ton | 11 |

**Fuel:** Uses power plant fuel (not separate)

### Reaction Drives
| Rating | Tonnage | Fuel per Hour | Cost | Min TL |
|--------|---------|---------------|------|--------|
| R-1 to R-11 | Same as M-drive | Hull × Thrust × 2.5% | MCr 0.2/ton | 7 |

---

## POWER SYSTEMS

### Power Plants
| Type | TL | Power/Ton | Cost/Ton | Notes |
|------|-----|-----------|----------|-------|
| Fission | 6 | 8 | MCr 0.4 | Radioactive fuel |
| Chemical | 7 | 5 | MCr 0.25 | Low efficiency |
| Fusion (TL8) | 8 | 10 | MCr 0.5 | Standard |
| Fusion (TL12) | 12 | 15 | MCr 1 | Improved |
| Fusion (TL15) | 15 | 20 | MCr 2 | Advanced |
| Antimatter | 20 | 100 | MCr 10 | Extremely expensive |

**Power Requirements:**
- **Basic Ship Systems:** Hull × 20%
- **Manoeuvre Drive:** Hull × Thrust × 10%
- **Jump Drive:** Hull × Jump × 10%

**Fuel Consumption:** 10% of hull for every 2 weeks operation (minimum 1t/month)

---

## HULL & ARMOUR

### Hull Configuration
| Type | Streamlined | Armour Modifier | Hull Points | Cost Modifier |
|------|-------------|-----------------|-------------|---------------|
| Standard | Partial | — | — | — |
| Streamlined | Yes | +20% | — | +20% |
| Sphere | Partial | -10% | +10% | +10% |
| Close Structure | Partial | +50% | -20% | -20% |
| Dispersed | No | +100% | -10% | -50% |

**Base Cost:** MCr 0.06 per ton (Standard hull, TL8+)

### Armour
| Type | TL | % per Point | Cost/Ton | Max Protection |
|------|-----|-------------|----------|----------------|
| Titanium Steel | 7 | 2.5% | Cr 50,000 | TL or 9 (lesser) |
| Crystaliron | 10 | 1.25% | Cr 200,000 | TL or 13 (lesser) |
| Bonded Superdense | 14 | 0.80% | Cr 500,000 | TL |
| Molecular Bonded | 16 | 0.50% | MCr 1.5 | TL+4 |

**Hull Size Multipliers:**
- 5-15t: ×4
- 16-25t: ×3
- 26-99t: ×2
- 100+t: ×1

**Formula:** (Hull Tonnage × % per Point × Armour Rating × Hull Multiplier) = Tonnage

---

## CONTROL SYSTEMS

### Bridge
| Hull Size | Bridge Tonnage | Cost |
|-----------|----------------|------|
| ≤50t | 3t | MCr 0.5 per 100t hull |
| 51-99t | 6t | MCr 0.5 per 100t hull |
| 100-200t | 10t | MCr 0.5 per 100t hull |
| 201-1000t | 20t | MCr 0.5 per 100t hull |
| 1001-2000t | 40t | MCr 0.5 per 100t hull |
| 2001-100,000t | 60t | MCr 0.5 per 100t hull |

**Cockpit (≤50t ships only):**
- Standard: 1.5t, Cr 10,000
- Dual: 2.5t, Cr 15,000

**Command Bridge (5000+t):** +40t, additional MCr 30

### Computer
| Model | TL | Cost | Processing |
|-------|-----|------|------------|
| Computer/5 | 7 | Cr 30,000 | 5 |
| Computer/10 | 9 | Cr 160,000 | 10 |
| Computer/15 | 11 | MCr 2 | 15 |
| Computer/20 | 12 | MCr 5 | 20 |
| Computer/25 | 13 | MCr 10 | 25 |
| Computer/30 | 14 | MCr 20 | 30 |
| Core/40-100 | 9-15 | MCr 45-130 | 40-100 |

**Options:**
- /bis (Jump Control): +50% cost, +5 processing for Jump Control only
- /fib (Hardened): +50% cost, immune to ion weapons

### Sensors
| Grade | TL | Tonnage | Power | DM | Cost |
|-------|-----|---------|-------|-----|------|
| Basic | 8 | 0 | 0 | -4 | Free |
| Civilian | 9 | 1 | 1 | -2 | MCr 3 |
| Military | 10 | 2 | 2 | +0 | MCr 4.1 |
| Improved | 12 | 3 | 4 | +1 | MCr 4.3 |
| Advanced | 15 | 5 | 6 | +2 | MCr 5.3 |

---

## WEAPONS

### Turrets & Mounts
| Type | TL | Tonnage | Hardpoints | Cost |
|------|-----|---------|------------|------|
| Fixed Mount | — | 0 | 0 | MCr 0.1 |
| Single Turret | 7 | 1 | 1 | MCr 0.2 |
| Double Turret | 8 | 1 | 1 | MCr 0.5 |
| Triple Turret | 9 | 1 | 1 | MCr 1 |
| Pop-Up Mount | 10 | 0 | +1 | MCr 1 |

**Hardpoints:** 1 per 100 tons of hull

### Turret Weapons
| Weapon | TL | Range | Power | Damage | Cost | Traits |
|--------|-----|-------|-------|--------|------|--------|
| Beam Laser | 10 | Medium | 4 | 1D | MCr 0.5 | — |
| Fusion Gun | 14 | Medium | 12 | 4D | MCr 2 | Radiation |
| Laser Drill | 8 | Adjacent | 4 | 2D | MCr 0.15 | AP 4 |
| Missile Rack | 7 | Special | 0 | 4D | MCr 0.75 | Smart, 12 missiles |
| Particle Beam | 12 | V.Long | 8 | 3D | MCr 4 | Radiation |
| Plasma Gun | 11 | Medium | 6 | 3D | MCr 2.5 | — |
| Pulse Laser | 9 | Long | 4 | 2D | MCr 1 | — |
| Railgun | 10 | Short | 2 | 2D | MCr 1 | AP 4 |
| Sandcaster | 9 | Special | 0 | Special | MCr 0.25 | 20 canisters |

**Ammunition Costs:**
- Missiles: Cr 5,000 each (12 per rack)
- Sandcaster Canisters: Cr 25,000 per 20-canister barrel

---

## ACCOMMODATIONS

### Staterooms
| Type | Tonnage | Occupancy | Cost | Power |
|------|---------|-----------|------|-------|
| Standard | 4t | 1 person | MCr 0.5 | 0 |
| Luxury | 8t | 1 person | MCr 1.5 | 0 |
| Low Berth | 0.5t | 1 person (hibernation) | Cr 50,000 | 0 |
| Barracks | 2t | 1 marine | MCr 0.1 | 0 |

**Crew Requirements:** Typically 1 stateroom per 2 crew members (double occupancy)

### Common Areas
| Type | Tonnage | Cost | Power | Function |
|------|---------|------|-------|----------|
| Galley | 4t | MCr 0.1 | 1 | Food preparation |
| Lounge | 8t | MCr 0.4 | 1 | Recreation space |

---

## SUPPORT FACILITIES

### Science & Medical
| Facility | Tonnage | Cost | Power | Function |
|----------|---------|------|-------|----------|
| Medical Bay (Basic) | 4t | MCr 2 | 1 | DM+2 to Medic checks |
| Medical Bay (Advanced) | 8t | MCr 4 | 2 | DM+3 to Medic checks, surgery |
| Laboratory | 8t | MCr 2 | 2 | DM+1 to Science checks |
| Workshop | 6t | MCr 0.9 | 0 | DM+1 to Mechanic/Engineer |

### Security & Military
| Facility | Tonnage | Cost | Power | Capacity |
|----------|---------|------|-------|----------|
| Armory | 2t | MCr 0.2 | 0 | 10 marines equipment |
| Brig (4 cells) | 4t | MCr 0.2 | 0 | 4 prisoners |
| Brig (8 cells) | 8t | MCr 0.4 | 0 | 8 prisoners |

---

## FUEL SYSTEMS

### Fuel Management
| Component | Tonnage | Cost | Power | Function |
|-----------|---------|------|-------|----------|
| Fuel Scoops | 0t | Free (streamlined hulls) | 0 | Skim 1t/hour from gas giants |
| Fuel Processor | 1% of hull | MCr 0.05/ton | 1/ton | Refine 20 tons/day per ton |

**Examples:**
- 100t ship: 1t processor = 20t/day, MCr 0.05, 1 power
- 200t ship: 2t processor = 40t/day, MCr 0.1, 2 power
- 400t ship: 4t processor = 80t/day, MCr 0.2, 4 power
- 800t ship: 8t processor = 160t/day, MCr 0.4, 8 power

---

## SMALL CRAFT & VEHICLES

### Ships Boats
| Craft | Tonnage | Cost | Crew | Notes |
|-------|---------|------|------|-------|
| Launch | 20t | MCr 7 | 1 | Basic ship-to-shore |
| Modular Cutter | 50t | MCr 12.5 | 1-2 | Versatile with mission pods |
| Ship's Boat | 30t | MCr 10 | 1 | Standard shuttle |

**Docking Space:** 110% of craft tonnage, MCr 0.25 per ton of docking space

### Vehicles
| Vehicle | Internal Storage | Cost | Crew/Passengers |
|---------|------------------|------|-----------------|
| Air/Raft | 4t | MCr 0.25 | 1 + 5 passengers |
| ATV | 10t | MCr 0.05 | 1 + 11 passengers |

---

## SPECIAL EQUIPMENT

### Drones & Probes
| Equipment | Tonnage | Cost | Power | Capacity |
|-----------|---------|------|-------|----------|
| Probe Drones | 0.5t | MCr 0.5 | 0 | 5 drones |
| Repair Drones | 0.5t | MCr 0.2 | 0 | 5 drones |

**Note:** Probe drones cost MCr 0.1 each, single-use but can be recovered

### Stealth Systems
| Type | TL | Cost/Ton Hull | Electronics DM | Tonnage |
|------|-----|---------------|----------------|---------|
| Basic | 8 | MCr 0.04 | -2 | 2% of hull |
| Improved | 10 | MCr 0.1 | -2 | 0 |
| Enhanced | 12 | MCr 0.5 | -4 | 0 |
| Advanced | 14 | MCr 1.0 | -6 | 0 |

---

## CARGO

### Cargo Hold
**Tonnage:** Any remaining tonnage after components
**Cost:** Free (no cost)
**Notes:** 1 ton = ~14 cubic metres, approximately 1 shipping container

---

## QUICK CALCULATION FORMULAS

### Minimum Ship Components (100t example)
```
Hull:           100t @ MCr 0.06/t = MCr 6.0
Bridge:         10t @ MCr 0.5 per 100t hull = MCr 0.5
Computer:       0t, Computer/5 = Cr 30,000
Sensors:        0t (Basic, free)
Power Plant:    Depends on drives (basic power = 20)
Manoeuvre:      Depends on thrust (M-2 = 2t @ MCr 2/t = MCr 4)
Jump:           Optional (J-2 = 10t @ MCr 1.5/t = MCr 15)
Staterooms:     Depends on crew (4× = 16t @ MCr 0.5 each = MCr 2)
Fuel:           Depends on drives (J-2 = 20t, Power = 3t)
Weapons:        Optional (1 hardpoint available)
                ────────────────────────────────────
Minimum Cost:   MCr 27.53 (without jump drive)
                MCr 42.53 (with J-2)
```

### Power Budget Calculation
```
Basic Power:        Hull × 20%
Manoeuvre Power:    Hull × Thrust × 10%
Jump Power:         Hull × Jump × 10%
Sensor Power:       Varies by grade (0-6)
Weapon Power:       Varies by weapon type
Other Systems:      Fuel processor, medical bay, etc.
                    ────────────────────────────────
Total Required:     Sum of all above
Power Plant Size:   Total Required ÷ (Power/Ton ratio)
```

---

**IMPORTANT NOTES:**
1. **All costs in Credits (Cr) or MegaCredits (MCr):** MCr 1 = Cr 1,000,000
2. **British Spelling:** Use "armour" not "armor", "manoeuvre" not "maneuver"
3. **Integer Credits:** Always use whole numbers, no decimals for credits
4. **Tonnage:** 1 displacement ton = ~14 cubic metres
5. **TL Requirements:** Ship cannot use components above its TL rating
6. **Hardpoints:** 1 per 100 tons, cannot exceed available hardpoints
7. **Power:** Must have sufficient power plant output for all components

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Status:** ✅ COMPLETE
