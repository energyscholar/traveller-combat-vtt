# Extracted Ship Design Data from High Guard 2022 Update

## Jump Drives

**Formula:** `(Hull × Jump Rating × 2.5%) + 5 tons`, minimum 10 tons
**Fuel:** `Hull × Jump Rating × 10%`
**Cost:** **MCr 1.5 per ton** ✅

| Rating | % of Hull | Minimum Tonnage | TL |
|--------|-----------|-----------------|-----|
| 1      | 2.5%      | 10t            | 9   |
| 2      | 5%        | 10t            | 11  |
| 3      | 7.5%      | 15t            | 12  |
| 4      | 10%       | 20t            | 13  |
| 5      | 12.5%     | 25t            | 14  |
| 6      | 15%       | 30t            | 15  |
| 7      | 17.5%     | 35t            | 16  |
| 8      | 20%       | 40t            | 17  |
| 9      | 22.5%     | 45t            | 18  |

---

## Manoeuvre Drives (Thrust Potential)

**Formula:** `Hull × Thrust Rating × 1%`
**Fuel:** Manoeuvre drives use power plant fuel, not separate fuel
**Power Required:** `Hull × Thrust × 10%`
**Cost:** **MCr 2 per ton** ✅

| Rating | % of Hull | TL |
|--------|-----------|-----|
| 0      | 0.5%      | 9   |
| 1      | 1%        | 9   |
| 2      | 2%        | 10  |
| 3      | 3%        | 10  |
| 4      | 4%        | 11  |
| 5      | 5%        | 11  |
| 6      | 6%        | 12  |
| 7      | 7%        | 12  |
| 8      | 8%        | 13  |
| 9      | 9%        | 13  |
| 10     | 10%       | 16  |
| 11     | 11%       | 17  |

**Reaction Drives:**
- Same tonnage formula but uses fuel (2.5% per Thrust per hour)
- Cost: **MCr 0.2 per ton** ✅

---

## Power Plants

| Type            | TL | Power/Ton | Cost/Ton  |
|-----------------|-----|-----------|-----------|
| Fission         | 6   | 8         | MCr 0.4   |
| Chemical        | 7   | 5         | MCr 0.25  |
| Fusion          | 8   | 10        | MCr 0.5   |
| Fusion          | 12  | 15        | MCr 1     |
| Fusion          | 15  | 20        | MCr 2     |
| Antimatter      | 20  | 100       | MCr 10    |

**Power Requirements:**
- Basic Ship Systems: `Hull × 20%`
- Manoeuvre Drive: `Hull × Thrust × 10%`
- Jump Drive: `Hull × Jump × 10%`

---

## Turrets and Fixed Mounts

| Type           | TL | Tonnage | Hardpoints | Cost   |
|----------------|-----|---------|------------|---------|
| Fixed Mount    | —   | 0       | 0          | MCr 0.1 |
| Single Turret  | 7   | 1       | 1          | MCr 0.2 |
| Double Turret  | 8   | 1       | 1          | MCr 0.5 |
| Triple Turret  | 9   | 1       | 1          | MCr 1   |
| Pop-Up Mount   | 10  | +0      | +1         | MCr 1   |

**Hardpoints:** `1 per 100 tons of hull`

---

## Turret Weapons (Complete)

| Weapon         | TL | Range    | Power | Damage   | Cost      | Traits     |
|----------------|-----|----------|-------|----------|-----------|------------|
| Beam Laser     | 10  | Medium   | 4     | 1D       | MCr 0.5   | —          |
| Fusion Gun     | 14  | Medium   | 12    | 4D       | MCr 2     | Radiation  |
| Laser Drill    | 8   | Adjacent | 4     | 2D       | MCr 0.15  | AP 4       |
| Missile Rack   | 7   | Special  | 0     | 4D       | MCr 0.75  | Smart      |
| Particle Beam  | 12  | VLong    | 8     | 3D       | MCr 4     | Radiation  |
| Plasma Gun     | 11  | Medium   | 6     | 3D       | MCr 2.5   | —          |
| Pulse Laser    | 9   | Long     | 4     | 2D       | MCr 1     | —          |
| Railgun        | 10  | Short    | 2     | 2D       | MCr 1     | AP 4       |
| Sandcaster     | 9   | Special  | 0     | Special  | MCr 0.25  | —          |

**Notes:**
- Missile Rack holds 12 missiles in a turret (TL 7: MCr 0.75)
- Sandcaster holds 20 canisters in turret (refill: Cr 25,000)
- All weapon costs are **per weapon**, not per ton
- Triple turrets can mount 3× of the same weapon type

---

## Bridge / Cockpit

### Bridge (Page 19)
| Hull Size (tons) | Bridge Size | Cost |
|------------------|-------------|------|
| 50 or less | 3 tons | MCr 0.5 per 100t hull |
| 51-99 | 6 tons | MCr 0.5 per 100t hull |
| 100-200 | 10 tons | MCr 0.5 per 100t hull |
| 201-1,000 | 20 tons | MCr 0.5 per 100t hull |
| 1,001-2,000 | 40 tons | MCr 0.5 per 100t hull |
| 2,001-100,000 | 60 tons | MCr 0.5 per 100t hull |
| 100,001+ | +20 tons per +100,000t | MCr 0.5 per 100t hull |

**Notes:**
- Smaller bridge gives DM-1 to all spacecraft operations checks
- Command Bridge (5,000+ tons): adds 40 tons, additional MCr 30

### Cockpit (Page 19)
**Only for ships 50 tons or less**
- Standard Cockpit: 1.5 tons, Cr 10,000
- Dual Cockpit: 2.5 tons, Cr 15,000
- Cockpit not designed for long-term use (24 hours max)

---

## Computer (Page 20)

**Tonnage:** 0 tons (distributed throughout ship)

### Standard Computers
| Model | TL | Cost |
|-------|-----|------|
| Computer/5 | 7 | Cr 30,000 |
| Computer/10 | 9 | Cr 160,000 |
| Computer/15 | 11 | MCr 2 |
| Computer/20 | 12 | MCr 5 |
| Computer/25 | 13 | MCr 10 |
| Computer/30 | 14 | MCr 20 |
| Computer/35 | 15 | MCr 30 |

### Computer Cores (Higher Processing)
| Model | TL | Cost |
|-------|-----|------|
| Core/40 | 9 | MCr 45 |
| Core/50 | 10 | MCr 60 |
| Core/60 | 11 | MCr 75 |
| Core/70 | 12 | MCr 80 |
| Core/80 | 13 | MCr 95 |
| Core/90 | 14 | MCr 120 |
| Core/100 | 15 | MCr 130 |

**Options:**
- Jump Control Specialization (/bis): +50% cost, +5 to Processing for Jump Control only
- Hardened Systems (/fib): +50% cost, immune to ion weapons

---

## Sensors (Page 21)

| Type | TL | Suite | DM | Power | Tons | Cost |
|------|-----|-------|-----|-------|------|------|
| Basic | 8 | Lidar, Radar | -4 | 0 | — | — |
| Civilian Grade | 9 | Lidar, Radar | -2 | 1 | 1 | MCr 3 |
| Military Grade | 10 | Jammers, Lidar, Radar | +0 | 2 | 2 | MCr 4.1 |
| Improved | 12 | Densitometer, Jammers, Lidar, Radar | +1 | 4 | 3 | MCr 4.3 |
| Advanced | 15 | Densitometer, Jammers, Lidar, Neural Activity, Radar | +2 | 6 | 5 | MCr 5.3 |

**Notes:**
- DM applied to all Electronics (comms) and Electronics (sensors) checks
- All ships have Basic sensors unless upgraded

---

## Hull Configuration (Page 11)

| Configuration | Streamlined? | Armour Volume Modifier | Hull Points | Hull Cost |
|---------------|--------------|------------------------|-------------|-----------|
| Standard | Partial | — | — | — |
| Streamlined | Yes | +20% | — | +20% |
| Sphere | Partial | -10% | +10% | +10% |
| Close Structure | Partial | +50% | -20% | -20% |
| Dispersed Structure | No | +100% | -10% | -50% |
| Planetoid | No | — | +25% | Special |
| Buffered Planetoid | No | — | +50% | Special |

**Notes:**
- Streamlined hulls can enter atmosphere safely
- Partial streamlined can enter with penalties
- Non-streamlined burn up if entering atmosphere

---

## Armour (Page 13)

**Tonnage Consumed:** Percentage of hull × Armour Tonnage Multiplier (from table below)

| Type | TL | % per Point | Cost per Ton | Max Protection |
|------|-----|-------------|--------------|----------------|
| Titanium Steel | 7 | 2.5% | Cr 50,000 | TL or 9 (whichever less) |
| Crystaliron | 10 | 1.25% | Cr 200,000 | TL or 13 (whichever less) |
| Bonded Superdense | 14 | 0.80% | Cr 500,000 | TL |
| Molecular Bonded | 16 | 0.50% | MCr 1.5 | TL+4 |

### Armour Tonnage Multiplier
| Hull Size | Multiplier |
|-----------|------------|
| 5-15 tons | ×4 |
| 16-25 tons | ×3 |
| 26-99 tons | ×2 |
| 100+ tons | ×1 |

**Notes:**
- Apply hull configuration Armour Volume Modifier to final tonnage
- Example: 10-ton fighter with Crystaliron armour, Tonnage = 1.25% × 3 = 3.75% → 5%

---

## Stealth (Page 14)

| Type | TL | Cost per Ton of Hull | Electronics (sensors) DM | Tonnage |
|------|-----|----------------------|--------------------------|---------|
| Basic | 8 | MCr 0.04 | DM-2 | 2% of hull |
| Improved | 10 | MCr 0.1 | DM-2 | — |
| Enhanced | 12 | MCr 0.5 | DM-4 | — |
| Advanced | 14 | MCr 1.0 | DM-6 | — |

**Notes:**
- Stealth cannot be combined with Solar Coating or Radiation/Heat Shielding

---

## Fuel Requirements

### Jump Fuel
`Hull × Jump Rating × 10%`

### Manoeuvre Fuel (Reaction Drives Only)
`2.5% of hull per Thrust Rating per hour`

### Power Plant Fuel
`10% of hull for every two weeks of operation (round up, minimum 1 ton per month)`

---

## Staterooms & Crew Quarters

**Standard Stateroom:** 4 tons, MCr 0.5 each
**Low Berth:** 0.5 tons, Cr 50,000 each (suspended animation)
**Cargo Hold:** Free tonnage, no cost

---

## Fuel Systems

### Fuel Procurement Options
1. **Purchase Refined Fuel** - Safest, at starports (costs credits)
2. **Purchase Unrefined Fuel** - Cheaper, but risk of misjump (almost certainly fatal!)
3. **Skim from Gas Giant** - Free, requires Fuel Scoops, takes time
4. **Pump & Crack Water** - Free, requires Fuel Processor, takes time

### Fuel Scoops (Page 24)
**Function:** Allows ship to skim fuel from gas giant atmospheres or ocean worlds
**Tonnage:** 0 tons (integrated into hull)
**Cost:** Free (included with streamlined hull)
**TL:** 8+
**Notes:**
- Only available on streamlined hulls
- Collects 1 ton of fuel per hour while skimming
- Fuel collected is unrefined (requires fuel processor to refine)

### Fuel Processor (Page 24)
**Function:** Refines unrefined fuel into refined fuel, prevents misjumps
**Tonnage:** 1% of ship tonnage per 20 tons/day processing rate
**Cost:** MCr 0.05 per ton of processor
**Power:** 1 per ton of processor
**Processing Rate:** 20 tons/day per 1% of ship tonnage
**TL:** 7+

**Examples:**
- 100t ship: 1t processor = 20 tons/day, MCr 0.05, 1 power
- 200t ship: 2t processor = 40 tons/day, MCr 0.1, 2 power
- 400t ship: 4t processor = 80 tons/day, MCr 0.2, 4 power
- 800t ship: 8t processor = 160 tons/day, MCr 0.4, 8 power

---

## Ship's Boats & Craft (Page 26)

### Docking Space
**Function:** Berth for small craft (ship's boat, launch, shuttle, etc.)
**Tonnage:** 110% of craft tonnage
**Cost:** MCr 0.25 per ton of docking space
**Notes:** Includes airlocks, grapples, and maintenance equipment

### Launch (Ship's Boat)
**Tonnage:** 20 tons
**Cost:** MCr 7
**Crew:** 1 pilot
**Notes:** Basic 20-ton craft for ship-to-shore operations

### Modular Cutter
**Tonnage:** 50 tons
**Cost:** MCr 12.5
**Crew:** 1-2
**Notes:** Versatile 50-ton craft with modular mission pods

### Air/Raft
**Tonnage:** 4 tons (when carried internally)
**Cost:** MCr 0.25 (Cr 250,000)
**Crew:** 1 pilot + 5 passengers
**Notes:** Anti-gravity vehicle for atmospheric travel

---

## Medical & Science Facilities

### Medical Bay (Page 25)
**Tonnage:** 4 tons (basic) or 8 tons (advanced)
**Cost:** MCr 2 (basic) or MCr 4 (advanced)
**Power:** 1 (basic) or 2 (advanced)
**TL:** 8+ (basic), 10+ (advanced)
**Function:** Provides DM+2 to Medic checks
**Notes:** Advanced medical bay provides DM+3 and can handle surgery

### Laboratory (Page 25)
**Tonnage:** 8 tons
**Cost:** MCr 2
**Power:** 2
**TL:** 9+
**Function:** Provides DM+1 to Science checks in specialized field
**Specializations:** Physics, Chemistry, Biology, Planetary Science, etc.
**Notes:** Can be configured for specific research focus

---

## Support Facilities

### Workshop (Page 25)
**Tonnage:** 6 tons
**Cost:** MCr 0.9
**Power:** 0
**TL:** 9+
**Function:** Provides DM+1 to Mechanic and Engineer checks
**Notes:** Essential for field repairs and maintenance

### Armory (Page 25)
**Tonnage:** 2 tons per 10 marines
**Cost:** MCr 0.1 per ton
**Power:** 0
**TL:** 9+
**Function:** Secure storage for weapons and combat equipment
**Capacity:** 10 marines worth of equipment per 2 tons
**Notes:** Includes vault doors, weapon racks, and ammunition storage

### Brig (Page 25)
**Tonnage:** 4 tons (holds 4 prisoners) or 8 tons (holds 8 prisoners)
**Cost:** MCr 0.2 (4t) or MCr 0.4 (8t)
**Power:** 0
**TL:** 8+
**Capacity:** 1 prisoner per ton (includes cell and basic facilities)
**Notes:** Secure cells with life support and monitoring

### Barracks (Page 22)
**Tonnage:** 2 tons per marine
**Cost:** MCr 0.05 per ton (MCr 0.1 per marine)
**Power:** 0
**TL:** 7+
**Capacity:** 1 marine per 2 tons
**Notes:** Efficient troop quarters with bunks and storage

---

## Luxury Accommodations

### Luxury Stateroom (Page 22)
**Tonnage:** 8 tons
**Cost:** MCr 1.5
**Power:** 0
**TL:** 8+
**Occupancy:** 1 person (high comfort)
**Notes:** Double the size and cost of standard stateroom

### Galley (Common Area - Page 23)
**Tonnage:** 4 tons
**Cost:** MCr 0.1
**Power:** 1
**TL:** 7+
**Function:** Food preparation for crew and passengers
**Notes:** Reduces steward workload, improves crew morale

### Lounge (Common Area - Page 23)
**Tonnage:** 8 tons
**Cost:** MCr 0.4
**Power:** 1
**TL:** 7+
**Function:** Recreation and relaxation space
**Notes:** Improves passenger satisfaction on long voyages

---

## Probe Drones & Equipment (Page 25)

### Probe Drones
**Tonnage:** 0.5 tons per 5 drones
**Cost:** MCr 0.5 per ton (MCr 0.1 per drone)
**Power:** 0
**TL:** 11+
**Capacity:** 5 drones per 0.5 tons
**Function:** Remote sensing, planetary surveys, hazardous environment exploration
**Notes:** Single-use consumables, can be recovered and refurbished

---

**Source:** High Guard 2022 Update PDF + V2 Ship Templates
**Extraction Method:** pdftotext + grep + screenshot reading + template analysis
**Date:** 2025-11-13
**Status:** COMPLETE ✅ All major ship components documented
