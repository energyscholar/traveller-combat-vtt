# Ship Template Migration Guide: V1 to V2

**Last Updated:** 2025-11-13
**Purpose:** Guide for converting simple V1 combat templates to comprehensive V2 ship design templates

---

## Overview

### What are V1 and V2 Templates?

**V1 Templates** (`data/ships/*.json`):
- Simple combat-focused schema
- Minimal data needed for space combat gameplay
- Used by the multiplayer space combat VTT
- Fast to load, compact format
- **Purpose:** Real-time combat simulation

**V2 Templates** (`data/ships/v2/*.json`):
- Comprehensive ship design schema
- Complete component breakdown with costs, tonnage, power
- Based on Mongoose Traveller 2E High Guard 2022
- Validates against official rules
- **Purpose:** Ship building, design validation, campaign management

### Why Have Both Formats?

**V1 is optimized for combat:**
- Fast parsing for real-time multiplayer
- Only includes combat-relevant stats (hull, armour, thrust, weapons)
- Compact JSON for network transmission
- Used in `server.js` combat resolution

**V2 is optimized for ship design:**
- Complete component specifications
- Cost calculations for ship building
- Power budget analysis
- Tonnage allocation tracking
- Validation against High Guard rules

**They serve different purposes and can coexist.**

---

## Schema Comparison

### V1 Schema (Combat)
```json
{
  "$schema": "../schemas/ship.schema.json",
  "id": "scout",
  "type": "scout",
  "name": "Scout",
  "tonnage": 100,
  "role": "exploration",
  "hull": 40,
  "armour": 4,
  "thrust": 2,
  "turrets": [
    {
      "id": "turret1",
      "type": "triple",
      "weapons": ["pulse_laser", "sandcaster", "missile_rack"]
    }
  ],
  "crewRequirements": {
    "pilot": 1,
    "gunner": 1,
    "engineer": 1,
    "sensors": 0,
    "marines": 0
  }
}
```

### V2 Schema (Ship Design)
```json
{
  "$schema": "../schemas/ship-template-v2.schema.json",
  "id": "scout",
  "type": "Type-S",
  "name": "Scout",
  "designation": "Type-S",
  "className": "Scout/Courier",
  "tonnage": 100,
  "techLevel": 12,
  "role": "exploration",
  "hull": {
    "tonnage": 100,
    "configuration": "streamlined",
    "hullPoints": 40,
    "cost": 6000000
  },
  "armour": {
    "type": "crystaliron",
    "rating": 4,
    "tonnage": 6,
    "cost": 1200000
  },
  "drives": {
    "manoeuvre": {
      "thrust": 2,
      "tonnage": 2,
      "cost": 4000000
    },
    "jump": {
      "rating": 2,
      "tonnage": 10,
      "cost": 15000000
    }
  },
  "power": {
    "type": "fusion_tl12",
    "output": 60,
    "tonnage": 4,
    "cost": 4000000
  },
  "bridge": {
    "type": "standard",
    "tonnage": 10,
    "cost": 500000
  },
  "sensors": {
    "grade": "military",
    "tonnage": 2,
    "cost": 4100000,
    "power": 2,
    "dm": 0
  },
  "weapons": [ /* detailed weapon mounts */ ],
  "staterooms": { /* crew quarters */ },
  "systems": [ /* fuel processor, workshop, etc. */ ],
  "costs": { /* total costs */ },
  "powerRequirements": { /* power analysis */ }
}
```

---

## Field Mapping

### Core Fields (V1 → V2)

| V1 Field | V2 Field | Transformation |
|----------|----------|----------------|
| `id` | `id` | Direct copy |
| `type` | `className` | V1 "scout" → V2 "Scout/Courier" |
| `name` | `name` | Direct copy |
| `tonnage` | `hull.tonnage` | Direct copy |
| `role` | `role` | Direct copy |
| `hull` | `hull.hullPoints` | Direct copy |
| `armour` | `armour.rating` | Direct copy |
| `thrust` | `drives.manoeuvre.thrust` | Direct copy |
| `turrets[].type` | `weapons[].mount` | "triple" → "triple_turret" |
| `turrets[].weapons` | `weapons[].weapons` | Direct copy |
| `crewRequirements` | `crew.minimum` | Requires mapping |

### New Fields in V2 (Not in V1)

These fields must be calculated or specified when creating V2 templates:

```json
{
  "techLevel": 12,               // Determine from ship class
  "designation": "Type-S",        // Official designation
  "hull": {
    "configuration": "streamlined", // Choose hull type
    "cost": 6000000               // Calculate: tonnage × MCr 0.06
  },
  "armour": {
    "type": "crystaliron",        // Choose armour type
    "tonnage": 6,                 // Calculate using formulas
    "cost": 1200000               // Calculate: tonnage × cost/ton
  },
  "drives": {
    "manoeuvre": {
      "tonnage": 2,               // Hull × Thrust × 1%
      "cost": 4000000             // Tonnage × MCr 2
    },
    "jump": {
      "rating": 2,                // Add jump capability
      "tonnage": 10,              // (Hull × Rating × 2.5%) + 5t
      "cost": 15000000            // Tonnage × MCr 1.5
    }
  },
  "power": {
    "type": "fusion_tl12",
    "output": 60,
    "tonnage": 4,
    "cost": 4000000
  },
  "fuel": {
    "total": 23,
    "jump": 20,                   // Hull × Jump × 10%
    "powerPlant": 3,              // 10% hull per 2 weeks
    "weeks": 12
  },
  "bridge": { /* ... */ },
  "computer": { /* ... */ },
  "sensors": { /* ... */ },
  "systems": [ /* ... */ ],
  "staterooms": { /* ... */ },
  "software": [ /* ... */ ],
  "cargo": { /* ... */ },
  "costs": { /* totals */ },
  "powerRequirements": { /* analysis */ }
}
```

---

## Step-by-Step Migration Process

### Step 1: Copy Core Fields
```javascript
const v1 = require('../data/ships/scout.json');
const v2 = {
  id: v1.id,
  name: v1.name,
  role: v1.role,
  tonnage: v1.tonnage
};
```

### Step 2: Expand Hull Data
```javascript
v2.hull = {
  tonnage: v1.tonnage,
  configuration: "streamlined",  // Choose based on ship class
  hullPoints: v1.hull,
  cost: v1.tonnage * 1000000 * 0.06  // MCr 0.06 per ton
};
```

### Step 3: Expand Armour Data
```javascript
// Determine armour type and calculate tonnage
const armourTypes = {
  "titanium_steel": { tlMin: 7, percentPerPoint: 0.025, costPerTon: 50000 },
  "crystaliron": { tlMin: 10, percentPerPoint: 0.0125, costPerTon: 200000 },
  "bonded_superdense": { tlMin: 14, percentPerPoint: 0.008, costPerTon: 500000 }
};

// For 100t ship with armour 4, using crystaliron
const hullMultiplier = v1.tonnage >= 100 ? 1 : (v1.tonnage >= 26 ? 2 : 3);
const armourTonnage = v1.tonnage * 0.0125 * v1.armour * hullMultiplier;

v2.armour = {
  type: "crystaliron",
  rating: v1.armour,
  tonnage: Math.ceil(armourTonnage),
  cost: Math.ceil(armourTonnage) * 200000
};
```

### Step 4: Expand Drive Data
```javascript
v2.drives = {
  manoeuvre: {
    thrust: v1.thrust,
    tonnage: v1.tonnage * v1.thrust * 0.01,
    cost: (v1.tonnage * v1.thrust * 0.01) * 2000000
  },
  jump: {
    rating: 2,  // Add jump drive (not in V1)
    tonnage: Math.max(10, (v1.tonnage * 2 * 0.025) + 5),
    cost: Math.max(10, (v1.tonnage * 2 * 0.025) + 5) * 1500000
  }
};
```

### Step 5: Calculate Power Plant
```javascript
// Calculate power requirements
const basicPower = v1.tonnage * 0.2;
const manoeuvrePower = v1.tonnage * v1.thrust * 0.1;
const jumpPower = v1.tonnage * 2 * 0.1;  // Jump-2
const totalPower = basicPower + manoeuvrePower + jumpPower;

// Select power plant type (fusion TL12 = 15 power/ton)
const powerTonnage = Math.ceil(totalPower / 15);

v2.power = {
  type: "fusion_tl12",
  output: powerTonnage * 15,
  tonnage: powerTonnage,
  cost: powerTonnage * 1000000
};
```

### Step 6: Add Bridge
```javascript
const bridgeSizes = {
  50: 3, 99: 6, 200: 10, 1000: 20, 2000: 40
};
const bridgeTonnage = v1.tonnage <= 50 ? 3 :
                      v1.tonnage <= 99 ? 6 :
                      v1.tonnage <= 200 ? 10 : 20;

v2.bridge = {
  type: "standard",
  tonnage: bridgeTonnage,
  cost: Math.ceil(v1.tonnage / 100) * 500000
};
```

### Step 7: Convert Weapons
```javascript
v2.weapons = v1.turrets.map((turret, index) => {
  const mountTypes = {
    "single": { cost: 200000, tonnage: 1 },
    "double": { cost: 500000, tonnage: 1 },
    "triple": { cost: 1000000, tonnage: 1 }
  };

  const mount = mountTypes[turret.type];
  const weaponCosts = {
    "pulse_laser": 1000000,
    "beam_laser": 500000,
    "missile_rack": 750000,
    "sandcaster": 250000,
    "particle_beam": 4000000
  };

  const weaponPower = {
    "pulse_laser": 4,
    "beam_laser": 4,
    "missile_rack": 0,
    "sandcaster": 0,
    "particle_beam": 8
  };

  const totalWeaponCost = turret.weapons.reduce((sum, w) =>
    sum + (weaponCosts[w] || 0), 0);
  const totalPower = turret.weapons.reduce((sum, w) =>
    sum + (weaponPower[w] || 0), 0);

  return {
    mount: turret.type + "_turret",
    weapons: turret.weapons,
    tonnage: mount.tonnage,
    cost: mount.cost + totalWeaponCost,
    power: totalPower
  };
});
```

### Step 8: Add Missing Components

V2 templates include components not in V1:
- Sensors (default to basic or military grade)
- Computer (default to Computer/5)
- Fuel (calculate based on drives)
- Staterooms (calculate based on crew)
- Systems (fuel processor, workshop, medical bay, etc.)
- Software (manoeuvre, jump control, library)
- Cargo (remaining tonnage)

See V2 template examples for complete component specifications.

---

## Automated Migration Script

```javascript
/**
 * Convert V1 combat template to V2 ship design template
 *
 * @param {Object} v1Template - V1 template from data/ships/*.json
 * @param {Object} options - Migration options (TL, jump rating, sensors, etc.)
 * @returns {Object} V2 template for data/ships/v2/*.json
 */
function migrateV1toV2(v1Template, options = {}) {
  const {
    techLevel = 10,
    jumpRating = 1,
    sensorGrade = 'military',
    armourType = 'crystaliron',
    powerPlantType = 'fusion_tl12',
    includeFuelProcessor = true,
    includeWorkshop = false
  } = options;

  // Use validation modules from lib/
  const { validateCompleteShip } = require('../lib/index.js');

  const v2 = {
    $schema: "../schemas/ship-template-v2.schema.json",
    id: v1Template.id,
    type: v1Template.type,
    name: v1Template.name,
    designation: v1Template.type.toUpperCase(),
    className: v1Template.name,
    tonnage: v1Template.tonnage,
    techLevel: techLevel,
    role: v1Template.role,
    thrust: v1Template.thrust
  };

  // Calculate all components using validation modules
  // (See lib/ship-*.js for calculation functions)

  // ... (full implementation would be ~200 lines)

  // Validate the result
  const validation = validateCompleteShip(v2);
  if (!validation.valid) {
    console.error('Migration produced invalid template:', validation.errors);
  }

  return v2;
}

module.exports = { migrateV1toV2 };
```

---

## Usage Examples

### Example 1: Migrate Scout
```bash
# Using Node.js script (to be created)
node tools/migrate-v1-to-v2.js data/ships/scout.json --jump 2 --tl 12 --sensors military

# Output: data/ships/v2/scout.json
```

### Example 2: Manual Migration
```javascript
const v1Scout = require('./data/ships/scout.json');

// Apply migration steps 1-8 above
const v2Scout = {
  // ... (copy fields and expand as shown above)
};

// Validate using lib/index.js
const { validateCompleteShip } = require('./lib/index.js');
const result = validateCompleteShip(v2Scout);

if (result.valid) {
  console.log('✅ Migration successful!');
  fs.writeFileSync('./data/ships/v2/scout.json', JSON.stringify(v2Scout, null, 2));
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Missing Power Budget
**Problem:** Forgetting to calculate total power requirements
**Solution:** Use `PowerPlant.calculateTotalPowerRequirement()` from `lib/ship-power-plant.js`

### ❌ Pitfall 2: Incorrect Armour Tonnage
**Problem:** Forgetting hull size multiplier (×4 for tiny, ×3 for small, ×2 for medium, ×1 for large)
**Solution:** Use `Armour.calculateArmourPackage()` from `lib/ship-armour.js`

### ❌ Pitfall 3: Hardpoint Violations
**Problem:** Adding more turrets than available hardpoints (1 per 100t)
**Solution:** Use `Weapons.calculateHardpoints()` from `lib/ship-weapons.js`

### ❌ Pitfall 4: Exceeding Hull Tonnage
**Problem:** Total component tonnage exceeds hull capacity
**Solution:** Use `validateCompleteShip()` to check tonnage allocation

---

## Validation Checklist

After migration, verify:

- [ ] All required V2 fields present
- [ ] Hull tonnage matches V1
- [ ] Armour rating matches V1
- [ ] Thrust rating matches V1
- [ ] Weapons match V1 turret configuration
- [ ] Power plant provides sufficient power
- [ ] Total tonnage ≤ hull capacity
- [ ] Crew quarters sufficient for crew requirements
- [ ] Fuel sufficient for jump + power plant
- [ ] Costs calculated correctly
- [ ] JSON validates against `ship-template-v2.schema.json`
- [ ] `validateCompleteShip()` returns `valid: true`

---

## Best Practices

1. **Start with V1, enhance to V2:** Keep V1 templates for combat, create V2 for ship building
2. **Validate early and often:** Use validation modules throughout migration
3. **Document assumptions:** Note TL, sensor grade, optional components in template notes
4. **Test in combat:** Verify V1 template still works in multiplayer combat
5. **Cross-reference High Guard:** Check costs and tonnages against official rules

---

## Future Enhancements

Planned improvements to migration process:

1. **Automated migration script** (`tools/migrate-v1-to-v2.js`)
2. **Batch migration** (migrate all V1 templates at once)
3. **Reverse migration** (V2 → V1 for combat-only templates)
4. **Diff report** (show what changed during migration)
5. **Interactive migration** (CLI wizard asking for options)

---

**Status:** ✅ COMPLETE
**Last Updated:** 2025-11-13
**Next Steps:** Create `tools/migrate-v1-to-v2.js` implementation
