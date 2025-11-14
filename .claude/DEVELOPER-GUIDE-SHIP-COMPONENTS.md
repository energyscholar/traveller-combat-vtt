# Developer Guide: Adding Ship Components and Templates

**Last Updated:** 2025-11-13
**Target Audience:** Developers extending the Traveller Combat VTT ship design system
**Prerequisites:** JavaScript/Node.js knowledge, familiarity with Mongoose Traveller 2E rules

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Adding a New Validation Module](#adding-a-new-validation-module)
3. [Creating Ship Templates](#creating-ship-templates)
4. [Testing Your Components](#testing-your-components)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture

```
lib/
├── index.js                    # Central exports, validateCompleteShip()
├── ship-jump-drive.js          # Jump drive calculations & validation
├── ship-manoeuvre-drive.js     # Manoeuvre drive calculations
├── ship-power-plant.js         # Power plant calculations
├── ship-sensors.js             # Sensor systems
├── ship-bridge.js              # Bridge & cockpit
├── ship-staterooms.js          # Crew quarters & accommodations
├── ship-weapons.js             # Turrets & weapons
└── ship-armour.js              # Armour calculations

data/ships/
├── v1/                         # Combat-focused templates (simple)
└── v2/                         # Ship design templates (comprehensive)
    ├── ship-template-v2.schema.json
    ├── scout.json
    ├── free_trader.json
    └── ...

tests/
├── unit/                       # Component-specific tests
│   ├── ship-jump-drive.test.js
│   └── ...
└── integration/                # Full ship validation tests
    └── ship-validation-integration.test.js
```

### Module Pattern

All validation modules follow this pattern:

```javascript
// 1. Calculate individual values (tonnage, cost, power, etc.)
function calculateComponentTonnage(params...) { ... }
function calculateComponentCost(params...) { ... }
function calculateComponentPower(params...) { ... }

// 2. Validate component configuration
function validateComponent(params...) {
  return {
    valid: boolean,
    errors: Array<string>,
    warnings: Array<string>,
    stats: { tonnage, cost, power, ... }
  };
}

// 3. Calculate complete package (all costs & requirements)
function calculateComponentPackage(params...) {
  return {
    tonnage,
    power,
    cost,
    [other relevant fields]
  };
}

// 4. Export all functions
module.exports = {
  calculateComponent*,
  validateComponent,
  calculateComponentPackage,
  [utility functions]
};
```

---

## Adding a New Validation Module

### Example: Adding Fuel Tanks Module

Let's walk through creating `lib/ship-fuel-tanks.js`.

#### Step 1: Create the File

```javascript
// ======== FUEL TANKS CALCULATIONS MODULE ========
// Based on Mongoose Traveller 2E High Guard 2022 Update
// Page 24 (High Guard) - Fuel specifications

/**
 * Calculate fuel requirements for ship operations
 *
 * @param {number} hullTonnage - Ship hull size in tons
 * @param {number} jumpRating - Jump rating (0-9)
 * @param {number} powerPlantWeeks - Weeks of power plant operation
 * @returns {Object} Fuel breakdown
 */
function calculateFuelRequirements(hullTonnage, jumpRating, powerPlantWeeks = 2) {
  const jumpFuel = hullTonnage * jumpRating * 0.1;  // 10% per jump rating
  const powerPlantFuel = Math.ceil((hullTonnage * 0.1 * powerPlantWeeks) / 2);  // 10% per 2 weeks
  const total = jumpFuel + powerPlantFuel;

  return {
    jump: jumpFuel,
    powerPlant: powerPlantFuel,
    total: total,
    weeks: powerPlantWeeks
  };
}

/**
 * Validate fuel tank configuration
 *
 * @param {number} allocatedFuel - Fuel tonnage allocated
 * @param {number} requiredFuel - Minimum fuel required
 * @param {number} hullTonnage - Ship hull size
 * @returns {Object} Validation result
 */
function validateFuelTanks(allocatedFuel, requiredFuel, hullTonnage) {
  const errors = [];
  const warnings = [];

  if (allocatedFuel < requiredFuel) {
    errors.push(`Insufficient fuel: ${requiredFuel}t required, only ${allocatedFuel}t allocated`);
  }

  if (allocatedFuel > hullTonnage * 0.8) {
    warnings.push(`Fuel tanks occupy ${Math.round((allocatedFuel / hullTonnage) * 100)}% of hull - very high percentage`);
  }

  if (allocatedFuel > requiredFuel * 2) {
    warnings.push('Fuel capacity is more than 2× requirements - consider reducing for more cargo/components');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      allocated: allocatedFuel,
      required: requiredFuel,
      surplus: allocatedFuel - requiredFuel,
      percentOfHull: Math.round((allocatedFuel / hullTonnage) * 100)
    }
  };
}

/**
 * Calculate complete fuel package for a ship
 *
 * @param {number} hullTonnage - Ship hull size in tons
 * @param {number} jumpRating - Jump rating
 * @param {number} powerPlantWeeks - Weeks of operation
 * @param {number} additionalFuel - Extra fuel for extended operations
 * @returns {Object} Complete fuel package
 */
function calculateFuelPackage(hullTonnage, jumpRating, powerPlantWeeks = 2, additionalFuel = 0) {
  const requirements = calculateFuelRequirements(hullTonnage, jumpRating, powerPlantWeeks);

  return {
    tonnage: requirements.total + additionalFuel,
    jumpFuel: requirements.jump,
    powerPlantFuel: requirements.powerPlant,
    additionalFuel: additionalFuel,
    cost: 0,  // Fuel tanks are free tonnage
    weeks: powerPlantWeeks
  };
}

module.exports = {
  calculateFuelRequirements,
  validateFuelTanks,
  calculateFuelPackage
};
```

#### Step 2: Add to lib/index.js

```javascript
// In lib/index.js, add:
const FuelTanks = require('./ship-fuel-tanks');

module.exports = {
  // ... existing exports ...
  FuelTanks,

  validators: {
    // ... existing validators ...
    validateFuelTanks: FuelTanks.validateFuelTanks
  },

  packages: {
    // ... existing packages ...
    calculateFuelPackage: FuelTanks.calculateFuelPackage
  },

  utils: {
    // ... existing utils ...
    calculateFuelRequirements: FuelTanks.calculateFuelRequirements
  }
};
```

#### Step 3: Create Unit Tests

Create `tests/unit/ship-fuel-tanks.test.js`:

```javascript
const FuelTanks = require('../../lib/ship-fuel-tanks');

describe('Fuel Tanks Calculations', () => {
  describe('calculateFuelRequirements', () => {
    test('100t scout with J-2, 2 weeks power', () => {
      const result = FuelTanks.calculateFuelRequirements(100, 2, 2);
      expect(result.jump).toBe(20);          // 100 × 2 × 10%
      expect(result.powerPlant).toBe(10);    // (100 × 10% × 2 weeks) / 2
      expect(result.total).toBe(30);
      expect(result.weeks).toBe(2);
    });

    test('200t trader with J-1, 4 weeks power', () => {
      const result = FuelTanks.calculateFuelRequirements(200, 1, 4);
      expect(result.jump).toBe(20);          // 200 × 1 × 10%
      expect(result.powerPlant).toBe(40);    // (200 × 10% × 4 weeks) / 2
      expect(result.total).toBe(60);
    });

    test('No jump drive (J-0)', () => {
      const result = FuelTanks.calculateFuelRequirements(100, 0, 2);
      expect(result.jump).toBe(0);
      expect(result.powerPlant).toBe(10);
      expect(result.total).toBe(10);
    });
  });

  describe('validateFuelTanks', () => {
    test('Sufficient fuel allocation', () => {
      const result = FuelTanks.validateFuelTanks(30, 20, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.surplus).toBe(10);
    });

    test('Insufficient fuel', () => {
      const result = FuelTanks.validateFuelTanks(15, 20, 100);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient fuel: 20t required, only 15t allocated');
    });

    test('Warning for excessive fuel', () => {
      const result = FuelTanks.validateFuelTanks(85, 20, 100);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('calculateFuelPackage', () => {
    test('Standard fuel package for 100t J-2 scout', () => {
      const pkg = FuelTanks.calculateFuelPackage(100, 2, 2, 0);
      expect(pkg.tonnage).toBe(30);
      expect(pkg.jumpFuel).toBe(20);
      expect(pkg.powerPlantFuel).toBe(10);
      expect(pkg.cost).toBe(0);
    });

    test('Extended range with additional fuel', () => {
      const pkg = FuelTanks.calculateFuelPackage(200, 1, 4, 20);
      expect(pkg.tonnage).toBe(80);  // 60 required + 20 additional
      expect(pkg.additionalFuel).toBe(20);
    });
  });
});
```

#### Step 4: Run Tests

```bash
npx jest tests/unit/ship-fuel-tanks.test.js
```

#### Step 5: Integrate with validateCompleteShip()

In `lib/index.js`, add fuel validation to `validateCompleteShip()`:

```javascript
function validateCompleteShip(shipSpec) {
  // ... existing code ...

  // Validate fuel tanks
  if (fuel) {
    const fuelResult = FuelTanks.validateFuelTanks(
      fuel.total,
      fuel.jump + fuel.powerPlant,
      hull.tonnage
    );
    results.componentValidation.fuelTanks = fuelResult;
    if (!fuelResult.valid) results.valid = false;
    results.errors.push(...fuelResult.errors);
    results.warnings.push(...fuelResult.warnings);
  }

  // ... rest of function ...
}
```

---

## Creating Ship Templates

### V2 Template Format

V2 templates are comprehensive ship designs with all components, costs, and validation data.

#### Step 1: Plan Your Ship

Let's create a **Survey Ship** (400t, TL11, J-2, M-2).

**Design Goals:**
- Jump-2 for extended exploration
- Good sensors (improved grade)
- Laboratory and workshop
- Probe drones for surveys
- Comfortable crew quarters

#### Step 2: Calculate Components

Use the Component Cost Reference (`.claude/COMPONENT-COST-REFERENCE.md`) and validation modules:

```javascript
const ShipValidation = require('./lib/index');

const surveyShip = {
  hull: { tonnage: 400 },
  techLevel: 11,

  // Use package calculators
  jump: ShipValidation.packages.calculateJumpPackage(400, 2, 11),
  manoeuvre: ShipValidation.packages.calculateManoeuvrePackage(400, 2, 11),
  power: ShipValidation.packages.calculatePowerPackage(80, 'fusion_tl12', 11),
  sensors: ShipValidation.packages.calculateSensorPackage('improved', 11),
  // ... etc
};
```

#### Step 3: Create Template File

Create `data/ships/v2/survey_ship.json`:

```json
{
  "$schema": "../schemas/ship-template-v2.schema.json",
  "id": "survey_ship",
  "type": "Survey Ship",
  "name": "Survey Ship",
  "designation": "Type-SV",
  "className": "Survey/Science Vessel",
  "tonnage": 400,
  "techLevel": 11,
  "role": "exploration",
  "thrust": 2,
  "turrets": [
    {
      "id": "turret_1",
      "type": "single",
      "weapons": ["beam_laser"]
    }
  ],

  "hull": {
    "tonnage": 400,
    "configuration": "streamlined",
    "hullPoints": 160,
    "cost": 24000000
  },

  "armour": {
    "type": "crystaliron",
    "rating": 2,
    "tonnage": 10,
    "cost": 2000000
  },

  "drives": {
    "manoeuvre": {
      "thrust": 2,
      "tonnage": 8,
      "cost": 16000000
    },
    "jump": {
      "rating": 2,
      "tonnage": 25,
      "cost": 37500000
    }
  },

  "power": {
    "type": "fusion_tl12",
    "output": 120,
    "tonnage": 8,
    "cost": 8000000
  },

  "fuel": {
    "total": 88,
    "jump": 80,
    "powerPlant": 8,
    "weeks": 4
  },

  "bridge": {
    "type": "standard",
    "tonnage": 20,
    "cost": 2000000
  },

  "computer": {
    "model": "Computer/15",
    "processing": 15,
    "cost": 2000000
  },

  "sensors": {
    "grade": "improved",
    "tonnage": 3,
    "cost": 4300000,
    "power": 4,
    "dm": 1
  },

  "weapons": [
    {
      "mount": "single_turret",
      "weapons": ["beam_laser"],
      "tonnage": 1,
      "cost": 700000,
      "power": 4
    }
  ],

  "systems": [
    {
      "type": "fuel_scoops",
      "tonnage": 0,
      "cost": 0,
      "power": 0
    },
    {
      "type": "fuel_processor",
      "tonnage": 4,
      "cost": 200000,
      "power": 4,
      "capacity": 80
    },
    {
      "type": "laboratory",
      "tonnage": 16,
      "cost": 4000000,
      "power": 4,
      "specialization": "planetary_science"
    },
    {
      "type": "workshop",
      "tonnage": 6,
      "cost": 900000,
      "power": 0
    },
    {
      "type": "probe_drones",
      "tonnage": 4,
      "cost": 2000000,
      "power": 0,
      "capacity": 20
    }
  ],

  "staterooms": {
    "standard": {
      "count": 12,
      "tonnage": 48,
      "cost": 6000000
    }
  },

  "software": [
    {
      "name": "manoeuvre",
      "rating": 0,
      "cost": 0
    },
    {
      "name": "jump_control",
      "rating": 2,
      "cost": 200000
    },
    {
      "name": "library",
      "rating": 0,
      "cost": 0
    }
  ],

  "cargo": {
    "tonnage": 50
  },

  "crew": {
    "minimum": {
      "pilot": 1,
      "astrogator": 1,
      "engineer": 2,
      "gunner": 1,
      "scientist": 4,
      "steward": 1,
      "medic": 1,
      "marines": 0
    },
    "description": "11 crew: Pilot, Astrogator, 2 Engineers, Gunner, 4 Scientists, Steward, Medic"
  },

  "costs": {
    "base": 109800000,
    "maintenance": 9150
  },

  "powerRequirements": {
    "basic": 80,
    "manoeuvre": 80,
    "jump": 80,
    "sensors": 4,
    "weapons": 4,
    "other": 8,
    "total": 256
  },

  "notes": "Type-SV Survey Ship designed for long-range scientific missions. Features include improved sensors, large laboratory (16t), probe drone capacity for 20 drones, and workshop for field repairs. Extended fuel capacity provides 4 weeks of independent operation."
}
```

#### Step 4: Validate the Template

```javascript
const shipTemplate = require('./data/ships/v2/survey_ship.json');
const result = ShipValidation.validateCompleteShip(shipTemplate);

if (result.valid) {
  console.log('✅ Survey Ship validates!');
  console.log('Power:', result.powerAnalysis);
  console.log('Tonnage:', result.tonnageAnalysis);
} else {
  console.log('❌ Errors:', result.errors);
}
```

#### Step 5: Add Integration Test

In `tests/integration/ship-validation-integration.test.js`:

```javascript
describe('Complete Ship Validation - Survey Ship', () => {
  test('400t science vessel validates', () => {
    const surveyShip = require('../../data/ships/v2/survey_ship.json');
    const result = ShipValidation.validateCompleteShip(surveyShip);

    expect(result.valid).toBe(true);
    expect(result.tonnageAnalysis.allocated).toBeLessThanOrEqual(400);
    expect(result.powerAnalysis.available).toBeGreaterThanOrEqual(result.powerAnalysis.required);
  });
});
```

---

## Testing Your Components

### Test-Driven Development (TDD)

Follow the TDD approach used throughout this project:

1. **Write tests first** (before implementation)
2. **Run tests** (they should fail)
3. **Implement feature** (make tests pass)
4. **Refactor** (clean up code)
5. **Validate** (run full test suite)

### Test Coverage Goals

- **Unit Tests:** Cover all calculation functions (100% coverage)
- **Validation Tests:** Test all error conditions and warnings
- **Integration Tests:** Test complete ship configurations
- **Edge Cases:** Test boundary conditions (TL limits, max ratings, zero values)

### Example Test Suite Structure

```javascript
describe('ComponentName Module', () => {
  describe('Calculations', () => {
    test('Basic calculation');
    test('Edge case: zero values');
    test('Edge case: maximum values');
    test('Rounding behavior');
  });

  describe('Validation', () => {
    test('Valid configuration passes');
    test('Invalid TL fails');
    test('Warnings for suboptimal choices');
    test('Error messages are clear');
  });

  describe('Package Calculations', () => {
    test('Complete package includes all costs');
    test('Package respects TL limits');
  });
});
```

---

## Best Practices

### Code Style

1. **Use British spelling** (match Traveller rules):
   - "armour" not "armor"
   - "manoeuvre" not "maneuver"

2. **Integer credits** (avoid floating point):
   ```javascript
   // ✅ GOOD
   const cost = tonnage * 1500000;  // MCr 1.5 = Cr 1,500,000

   // ❌ BAD
   const cost = tonnage * 1.5;  // Floating point, ambiguous units
   ```

3. **Clear variable names:**
   ```javascript
   // ✅ GOOD
   const jumpDriveTonnage = calculateJumpDriveTonnage(hullTonnage, jumpRating);

   // ❌ BAD
   const t = calc(h, j);
   ```

4. **Comprehensive JSDoc:**
   ```javascript
   /**
    * Calculate component tonnage
    *
    * @param {number} hullTonnage - Ship hull size in tons
    * @param {number} rating - Component rating (1-9)
    * @param {number} techLevel - Ship tech level
    * @returns {number} Component tonnage
    */
   function calculateComponentTonnage(hullTonnage, rating, techLevel) {
     // ...
   }
   ```

### Validation Function Pattern

All `validate*()` functions must return this structure:

```javascript
{
  valid: boolean,           // Overall validation status
  errors: Array<string>,    // Critical errors (prevents ship from functioning)
  warnings: Array<string>,  // Non-critical issues or recommendations
  stats: {                  // Component specifications
    tonnage: number,
    cost: number,
    power: number,
    minimumTL: number,
    // ... other relevant fields
  }
}
```

### Error Message Guidelines

**Errors** (critical issues):
- "Insufficient power: 64 required, 60 available (deficit: 4)"
- "Jump-3 requires TL12, ship is only TL10"
- "Armour rating 10 exceeds maximum of 8 for crystaliron at TL12"

**Warnings** (recommendations):
- "Consider upgrading to improved sensors for better performance at TL12"
- "Power plant oversized: 80 available, only 64 required"
- "Fuel capacity is more than 2× requirements"

### Constants and Configuration

Define constants at module level:

```javascript
const COST_PER_TON = 1500000;  // MCr 1.5 = Cr 1,500,000
const MIN_TL = 9;
const MAX_RATING = 9;
```

---

## Common Patterns

### Pattern 1: Tonnage Calculation

```javascript
function calculateComponentTonnage(hullTonnage, rating) {
  const percentage = rating * 2.5;  // Percentage per rating
  const baseTonnage = hullTonnage * (percentage / 100);
  const minimum = 10;  // Absolute minimum

  return Math.max(baseTonnage, minimum);
}
```

### Pattern 2: TL Validation

```javascript
function getMinimumTL(rating) {
  const tlTable = {
    1: 9,
    2: 11,
    3: 12,
    // ...
  };
  return tlTable[rating] || 9;
}

// In validation function:
const requiredTL = getMinimumTL(rating);
if (techLevel < requiredTL) {
  errors.push(`Rating ${rating} requires TL${requiredTL}, ship is only TL${techLevel}`);
}
```

### Pattern 3: Cost Calculation

```javascript
function calculateCost(tonnage, costPerTon) {
  if (tonnage === 0) return 0;
  return tonnage * costPerTon;  // Already in credits (not MCr)
}
```

### Pattern 4: Power Budget Tracking

```javascript
function calculateTotalPower(components) {
  let total = 0;

  total += basicPower;
  total += manoeuvrePower;
  total += jumpPower;
  total += sensorPower;
  total += weaponPower;

  return {
    basic: basicPower,
    manoeuvre: manoeuvrePower,
    jump: jumpPower,
    sensors: sensorPower,
    weapons: weaponPower,
    total: total
  };
}
```

---

## Troubleshooting

### Common Issues

**Issue:** "Module not found: ship-component-name"
**Solution:** Check `lib/index.js` exports, ensure `require()` path is correct

**Issue:** Validation returns `valid: false` but no error messages
**Solution:** Check that validation logic populates `errors` array for failures

**Issue:** Tests fail with "Cannot read property 'tonnage' of undefined"
**Solution:** Ensure test data includes all required fields (hull, techLevel, etc.)

**Issue:** Power calculations don't match High Guard
**Solution:** Verify formula: Basic (Hull × 20%), M-drive (Hull × Thrust × 10%), J-drive (Hull × Jump × 10%)

**Issue:** Floating point precision errors in costs
**Solution:** Use integers (credits) instead of floats (megacredits)

### Debugging Tips

1. **Enable verbose validation:**
   ```javascript
   const result = validateCompleteShip(ship);
   console.log(JSON.stringify(result, null, 2));
   ```

2. **Test individual components:**
   ```javascript
   const jumpResult = validateJumpDrive(100, 2, 12);
   console.log('Jump Drive:', jumpResult);
   ```

3. **Use integration tests for full validation:**
   ```bash
   npx jest tests/integration/ship-validation-integration.test.js --verbose
   ```

---

## Checklist for New Components

- [ ] Create `lib/ship-component-name.js` with calculation functions
- [ ] Add validation function with proper error/warning messages
- [ ] Add package calculator function
- [ ] Export all functions in module
- [ ] Add component to `lib/index.js` exports
- [ ] Create `tests/unit/ship-component-name.test.js` with 20+ tests
- [ ] Run tests: `npx jest tests/unit/ship-component-name.test.js`
- [ ] Add integration test if needed
- [ ] Update COMPONENT-COST-REFERENCE.md with costs and formulas
- [ ] Test with real ship template
- [ ] Run full test suite: `npm test`
- [ ] Commit with descriptive message

---

## Resources

- **High Guard 2022 Rules:** `.claude/EXTRACTED-SHIP-DATA.md`
- **Cost Reference:** `.claude/COMPONENT-COST-REFERENCE.md`
- **V1→V2 Migration:** `.claude/V1-TO-V2-MIGRATION-GUIDE.md`
- **Validation Report:** `.claude/SHIP-TEMPLATE-VALIDATION-REPORT.md`
- **Existing Modules:** `lib/ship-*.js` (use as templates)
- **Test Examples:** `tests/unit/ship-*.test.js`

---

**Happy ship building! 🚀**

**Last Updated:** 2025-11-13
**Version:** 1.0
**Status:** ✅ COMPLETE
