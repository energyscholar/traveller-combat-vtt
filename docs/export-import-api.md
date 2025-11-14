# Export/Import API Documentation
**Version:** 1.0
**Module:** `lib/export-import.js`
**Created:** Session 4 (2025-11-13)

---

## Overview

The Export/Import system provides comprehensive save/load functionality for:
- **Ship Instances** - Complete ship state including battle damage, crew, position
- **Battle States** - Multi-ship combat scenarios with full game state
- **Characters** - Complete Traveller 2E character data

All exports conform to JSON schemas defined in `data/schemas/`:
- `ship-instance-export.schema.json`
- `battle-state-export.schema.json`
- `character-export.schema.json`

---

## Quick Start

```javascript
const {
  exportShipInstance,
  importShipInstance,
  exportBattleState,
  importBattleState,
  exportCharacter,
  importCharacter
} = require('./lib/export-import');

// Export a ship
const ship = {
  id: 'ship-001',
  name: 'Beowulf',
  type: 'free_trader',
  hull: 60,
  maxHull: 60,
  armor: 4,
  x: 10,
  y: 5
};

const exported = exportShipInstance(ship);
const jsonString = JSON.stringify(exported, null, 2);

// Save to file
fs.writeFileSync('beowulf-save.json', jsonString);

// Later: Load and import
const loaded = JSON.parse(fs.readFileSync('beowulf-save.json'));
const imported = importShipInstance(loaded);
// imported is now ready to use in game
```

---

## Ship Instance API

### `exportShipInstance(ship, options)`

Export a ship instance to JSON format.

**Parameters:**
- `ship` (Object) - Ship data from game state
  - Required fields: `id`
  - Common fields: `name`, `type`, `hull`, `maxHull`, `armor`, `x`, `y`, `facing`, `crew`, `ammunition`, etc.
- `options` (Object, optional)
  - `user` (string) - Username of exporter
  - `battleContext` (boolean) - Include battle-specific data (initiative, targeting, effects)

**Returns:** Object conforming to `ship-instance-export.schema.json`

**Example:**
```javascript
const ship = {
  id: 'scout-01',
  name: 'March Harrier',
  type: 'scout',
  hull: 35,
  maxHull: 40,
  armor: 2,
  x: 12,
  y: 7,
  facing: 90,
  crew: [{ name: 'Pilot Jones', role: 'pilot', skill: 2 }],
  ammunition: [{ weapon: 'pulse_laser', count: -1 }]
};

const exported = exportShipInstance(ship, {
  user: 'gamemaster',
  battleContext: true
});

// exported.schemaVersion === '1.0'
// exported.exportDate === '2025-11-13T...'
// exported.ship.currentState.structure.hull.current === 35
```

---

### `importShipInstance(jsonData)`

Import a ship instance from JSON format.

**Parameters:**
- `jsonData` (Object|string) - JSON export data or JSON string

**Returns:** Object - Ship data suitable for game state

**Throws:**
- `Error` - If JSON invalid, schema version unsupported, or required fields missing

**Example:**
```javascript
// From object
const imported = importShipInstance(exportedData);

// From JSON string
const jsonString = fs.readFileSync('ship-save.json', 'utf8');
const imported = importShipInstance(jsonString);

// Use in game
gameState.ships.push(imported);
```

---

### `validateShipInstance(jsonData)`

Validate ship instance JSON data without importing.

**Parameters:**
- `jsonData` (Object|string) - JSON data to validate

**Returns:** Object
```javascript
{
  valid: boolean,
  errors: string[]  // Empty if valid
}
```

**Example:**
```javascript
const validation = validateShipInstance(jsonData);

if (!validation.valid) {
  console.error('Invalid ship data:');
  validation.errors.forEach(err => console.error(`  - ${err}`));
} else {
  const ship = importShipInstance(jsonData);
}
```

---

## Battle State API

### `exportBattleState(gameState, options)`

Export complete battle state including all ships, turns, and history.

**Parameters:**
- `gameState` (Object) - Complete game state object
  - `ships` (Array) - Array of ship objects
  - `turn` (number) - Current turn number
  - `phase` (string) - Current phase ('movement', 'combat', etc.)
  - `initiative` (Array) - Initiative order
  - `combatLog` (Array) - Battle log entries
  - Optional: `factions`, `location`, `conditions`, `casualties`, etc.
- `options` (Object, optional)
  - `user` (string) - Username of exporter
  - `battleName` (string) - Name/description of battle
  - `description` (string) - Battle description

**Returns:** Object conforming to `battle-state-export.schema.json`

**Example:**
```javascript
const gameState = {
  factions: ['Imperial Navy', 'Pirates'],
  ships: [
    { id: 'ship-1', name: 'Defender', type: 'patrol_corvette', hull: 120, maxHull: 120 },
    { id: 'ship-2', name: 'Raider', type: 'corsair', hull: 80, maxHull: 80 }
  ],
  turn: 3,
  phase: 'combat',
  initiative: [{ id: 'ship-1', value: 12 }, { id: 'ship-2', value: 8 }],
  combatLog: ['Turn 1: Battle begins', 'Turn 2: Defender fires']
};

const exported = exportBattleState(gameState, {
  battleName: 'Battle of Regina',
  user: 'gamemaster',
  description: 'Pirate raiders intercepted by system defense'
});
```

---

### `importBattleState(jsonData)`

Import battle state and reconstruct complete game state.

**Parameters:**
- `jsonData` (Object|string) - JSON export data or JSON string

**Returns:** Object - Game state ready for application

**Example:**
```javascript
const imported = importBattleState(savedBattle);

// Restore game
gameState.ships = imported.ships;
gameState.turn = imported.turn;
gameState.phase = imported.phase;
gameState.combatLog = imported.combatLog;
```

---

### `validateBattleState(jsonData)`

Validate battle state JSON data.

**Returns:** `{ valid: boolean, errors: string[] }`

---

## Character API

### `exportCharacter(character, options)`

Export Traveller 2E character data.

**Parameters:**
- `character` (Object) - Character data
  - `name` (string) - Character name
  - Optional: `characteristics`, `skills`, `careers`, `equipment`, `currentState`
- `options` (Object, optional)
  - `user` (string) - Username of exporter

**Returns:** Object conforming to `character-export.schema.json`

**Example:**
```javascript
const character = {
  name: 'Marcus Cole',
  title: 'Scout',
  homeworld: 'Regina',
  characteristics: {
    strength: { current: 7, base: 7, dm: 0 },
    dexterity: { current: 9, base: 9, dm: 1 },
    endurance: { current: 8, base: 8, dm: 0 },
    intelligence: { current: 10, base: 10, dm: 1 },
    education: { current: 9, base: 9, dm: 1 },
    social: { current: 6, base: 6, dm: 0 }
  },
  skills: [
    { name: 'Pilot', specialty: 'starship', level: 2 },
    { name: 'Astrogation', level: 1 },
    { name: 'Gun Combat', specialty: 'slug', level: 1 }
  ],
  careers: [
    { name: 'Scout', terms: 3, rank: 'Scout' }
  ]
};

const exported = exportCharacter(character);
```

---

### `importCharacter(jsonData)`

Import character data.

**Parameters:**
- `jsonData` (Object|string) - JSON export data or JSON string

**Returns:** Object - Character data

---

### `validateCharacter(jsonData)`

Validate character JSON data.

**Returns:** `{ valid: boolean, errors: string[] }`

---

## Utility Functions

### `detectSchemaVersion(jsonData)`

Detect schema version from JSON data.

**Parameters:**
- `jsonData` (Object|string) - JSON data to analyze

**Returns:** string|null - Schema version or null if not found

**Example:**
```javascript
const version = detectSchemaVersion(importedData);
if (version === '1.0') {
  // Current version, import directly
} else if (version === '0.9') {
  // Old version, migrate first
  const migrated = migrateSchema(importedData, '0.9', '1.0');
}
```

---

### `getSupportedVersions()`

Get list of supported schema versions.

**Returns:** string[] - Array of version strings

**Example:**
```javascript
const versions = getSupportedVersions();
// Returns: ['1.0']
```

---

### `getSchemaPath(type, version)`

Get file path for a schema.

**Parameters:**
- `type` (string) - Schema type: 'ship', 'battle', or 'character'
- `version` (string, optional) - Schema version (default: current)

**Returns:** string - Path to schema file

**Throws:** Error if type invalid

**Example:**
```javascript
const schemaPath = getSchemaPath('ship');
// Returns: '/path/to/data/schemas/ship-instance-export.schema.json'
```

---

### `migrateSchema(jsonData, fromVersion, toVersion)`

Migrate schema between versions (placeholder for future).

**Parameters:**
- `jsonData` (Object) - JSON data to migrate
- `fromVersion` (string) - Source version
- `toVersion` (string) - Target version

**Returns:** Object - Migrated data

**Throws:** Error if migration not implemented

**Note:** Currently only version 1.0 exists. This function is a placeholder for future schema evolution.

---

## Schema Versions

### Version 1.0 (Current)

**Release:** Session 4 (2025-11-13)

**Schemas:**
- `ship-instance-export.schema.json` - Full ship instance with battle state
- `battle-state-export.schema.json` - Multi-ship battle scenarios
- `character-export.schema.json` - Traveller 2E character data

**Features:**
- Complete ship state (hull, armor, crew, position, ammunition, fuel)
- Battle context (initiative, targeting, effects)
- Multi-ship scenarios with turn tracking
- Campaign data (factions, history, casualties)
- Full Traveller 2E character support

**Backward Compatibility:** None (first version)

---

## Error Handling

All import functions throw errors for invalid data:

```javascript
try {
  const imported = importShipInstance(jsonData);
} catch (error) {
  if (error.message.includes('schema version')) {
    // Unsupported version - may need migration
  } else if (error.message.includes('Invalid JSON')) {
    // Malformed JSON string
  } else if (error.message.includes('Missing required field')) {
    // Required field not present
  }
}
```

**Common Errors:**
- `"Invalid ship data: ship must be an object"` - Non-object passed to export
- `"Invalid ship data: missing required field \"id\""` - Ship missing ID
- `"Invalid JSON: ..."` - Malformed JSON string
- `"Missing schemaVersion field"` - No version in import data
- `"Unsupported schema version: X.Y"` - Version not supported
- `"Missing required field: ship"` - Required top-level field missing

---

## Best Practices

### 1. Always Validate Before Import

```javascript
const validation = validateShipInstance(jsonData);
if (validation.valid) {
  const ship = importShipInstance(jsonData);
} else {
  console.error('Validation failed:', validation.errors);
}
```

### 2. Handle Version Mismatch

```javascript
const version = detectSchemaVersion(jsonData);
const supported = getSupportedVersions();

if (!supported.includes(version)) {
  console.error(`Unsupported version: ${version}. Supported: ${supported.join(', ')}`);
  // Optionally attempt migration
}
```

### 3. Include Metadata in Exports

```javascript
const exported = exportShipInstance(ship, {
  user: currentUser.name,
  battleContext: true  // Include battle-specific data
});

// Metadata helps track where save came from
console.log(`Exported by ${exported.exportedBy.user}`);
console.log(`Export date: ${exported.exportDate}`);
```

### 4. Preserve Import Metadata

```javascript
const imported = importShipInstance(jsonData);

// Imported ship includes metadata
console.log(`Originally exported: ${imported.originalExportDate}`);
console.log(`Imported by: ${imported.importedFrom.application}`);
```

### 5. Use Round-Trip Testing

```javascript
// Export
const exported = exportShipInstance(originalShip);

// Import
const imported = importShipInstance(exported);

// Verify critical fields preserved
assert.strictEqual(imported.id, originalShip.id);
assert.strictEqual(imported.name, originalShip.name);
assert.strictEqual(imported.hull, originalShip.hull);
```

---

## Integration Examples

### Save to File

```javascript
const fs = require('fs');
const { exportBattleState } = require('./lib/export-import');

function saveBattle(gameState, filename) {
  const exported = exportBattleState(gameState, {
    battleName: 'Autosave',
    user: 'system'
  });

  const json = JSON.stringify(exported, null, 2);
  fs.writeFileSync(filename, json, 'utf8');
  console.log(`Battle saved to ${filename}`);
}
```

### Load from File

```javascript
const fs = require('fs');
const { importBattleState } = require('./lib/export-import');

function loadBattle(filename) {
  const json = fs.readFileSync(filename, 'utf8');
  const gameState = importBattleState(json);
  console.log(`Battle loaded: ${gameState.battleName || 'Unnamed'}`);
  return gameState;
}
```

### HTTP API Endpoint

```javascript
// Express endpoint for export
app.get('/api/battle/export', (req, res) => {
  const exported = exportBattleState(currentGameState);
  res.json(exported);
});

// Express endpoint for import
app.post('/api/battle/import', express.json(), (req, res) => {
  try {
    const gameState = importBattleState(req.body);
    currentGameState = gameState;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## VTT Integration

The export format is designed for easy integration with VTT platforms:

```javascript
// Export for Roll20
const roll20Data = {
  ships: gameState.ships.map(ship => {
    const exported = exportShipInstance(ship);
    return {
      name: exported.ship.name,
      attributes: {
        hull: exported.ship.currentState.structure.hull.current,
        armor: exported.ship.currentState.structure.armor.rating
      }
    };
  })
};

// Export for Foundry VTT
const foundryData = exportBattleState(gameState);
// Foundry can consume JSON directly
```

---

## Testing

Comprehensive tests in `tests/unit/export-import.test.js`:
- 36 tests covering all functions
- Round-trip preservation tests
- Error handling tests
- Edge case validation

Run tests:
```bash
node tests/unit/export-import.test.js
```

---

## Support

**Module:** `lib/export-import.js`
**Tests:** `tests/unit/export-import.test.js`
**Schemas:** `data/schemas/*.schema.json`
**Created:** Session 4 (2025-11-13)

For issues or questions, see project README.
