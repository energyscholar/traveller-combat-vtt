#!/usr/bin/env node
/**
 * Export/Import System Tests
 * Tests for lib/export-import.js
 */

const assert = require('assert');
const {
  exportShipInstance,
  importShipInstance,
  validateShipInstance,
  exportBattleState,
  importBattleState,
  validateBattleState,
  exportCharacter,
  importCharacter,
  validateCharacter,
  detectSchemaVersion,
  getSupportedVersions,
  getSchemaPath,
  migrateSchema,
  SCHEMA_VERSION
} = require('../../lib/export-import');

console.log('========================================');
console.log('EXPORT/IMPORT SYSTEM TESTS');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// ==================================================================
// SHIP INSTANCE EXPORT/IMPORT TESTS
// ==================================================================

console.log('--- Ship Instance Export/Import (12 tests) ---\n');

// Test 1: Export valid ship instance
test('Export ship instance with minimal data', () => {
  const ship = {
    id: 'ship-001',
    name: 'Test Scout',
    type: 'scout',
    hull: 30,
    maxHull: 40,
    armor: 2
  };

  const exported = exportShipInstance(ship);

  assert.strictEqual(exported.schemaVersion, SCHEMA_VERSION);
  assert.ok(exported.exportDate);
  assert.strictEqual(exported.ship.id, 'ship-001');
  assert.strictEqual(exported.ship.name, 'Test Scout');
  assert.strictEqual(exported.ship.currentState.structure.hull.current, 30);
});

// Test 2: Export ship with all optional fields
test('Export ship with complete data', () => {
  const ship = {
    id: 'ship-002',
    name: 'Beowulf',
    designation: 'INS Beowulf',
    type: 'free_trader',
    shipClass: 'Type-A2',
    hull: 60,
    maxHull: 60,
    armor: 4,
    x: 10,
    y: 5,
    facing: 90,
    velocity: { dx: 2, dy: 0 },
    crew: [{ name: 'Captain Smith', role: 'pilot' }],
    casualties: {},
    powerPlant: 60,
    ammunition: [{ weapon: 'missiles', count: 6 }],
    fuel: 20,
    fuelCapacity: 23,
    initiative: 15,
    targeting: 'ship-001'
  };

  const exported = exportShipInstance(ship, {
    user: 'testuser',
    battleContext: true
  });

  assert.strictEqual(exported.ship.designation, 'INS Beowulf');
  assert.strictEqual(exported.ship.currentState.position.x, 10);
  assert.strictEqual(exported.ship.currentState.position.velocity.dx, 2);
  assert.strictEqual(exported.ship.currentState.crew.roster.length, 1);
  assert.strictEqual(exported.ship.currentState.battle.initiative, 15);
  assert.strictEqual(exported.exportedBy.user, 'testuser');
});

// Test 3: Import ship instance
test('Import ship instance and reconstruct state', () => {
  const originalShip = {
    id: 'ship-003',
    name: 'March Harrier',
    type: 'patrol_corvette',
    hull: 100,
    maxHull: 120,
    armor: 6,
    x: 5,
    y: 8,
    facing: 180
  };

  const exported = exportShipInstance(originalShip);
  const imported = importShipInstance(exported);

  assert.strictEqual(imported.id, 'ship-003');
  assert.strictEqual(imported.name, 'March Harrier');
  assert.strictEqual(imported.hull, 100);
  assert.strictEqual(imported.maxHull, 120);
  assert.strictEqual(imported.armor, 6);
  assert.strictEqual(imported.x, 5);
  assert.strictEqual(imported.y, 8);
  assert.ok(imported.importDate);
});

// Test 4: Import from JSON string
test('Import ship from JSON string', () => {
  const jsonString = JSON.stringify({
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    ship: {
      id: 'ship-004',
      name: 'Test Ship',
      template: { id: 'scout', type: 'Type-S' },
      currentState: {
        structure: {
          hull: { current: 40, maximum: 40 },
          armor: { rating: 0, ablated: 0 },
          componentDamage: []
        },
        position: { x: 0, y: 0, facing: 0 },
        crew: { roster: [], casualties: {} },
        power: { available: 40, allocated: {} },
        ammunition: [],
        fuel: { current: 0, maximum: 0 }
      }
    }
  });

  const imported = importShipInstance(jsonString);
  assert.strictEqual(imported.id, 'ship-004');
  assert.strictEqual(imported.name, 'Test Ship');
});

// Test 5: Round-trip export/import preserves data
test('Round-trip export/import preserves ship data', () => {
  const original = {
    id: 'roundtrip-001',
    name: 'Test Vessel',
    type: 'scout',
    hull: 35,
    maxHull: 40,
    armor: 2,
    x: 12,
    y: 7,
    facing: 270,
    crew: [{ name: 'Pilot', skill: 2 }],
    ammunition: [{ weapon: 'pulse_laser', count: -1 }]
  };

  const exported = exportShipInstance(original);
  const imported = importShipInstance(exported);

  assert.strictEqual(imported.id, original.id);
  assert.strictEqual(imported.name, original.name);
  assert.strictEqual(imported.hull, original.hull);
  assert.strictEqual(imported.x, original.x);
  assert.strictEqual(imported.crew.length, 1);
  assert.strictEqual(imported.ammunition[0].weapon, 'pulse_laser');
});

// Test 6: Validate valid ship instance
test('Validate valid ship instance', () => {
  const validData = {
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    ship: {
      id: 'ship-005',
      name: 'Valid Ship',
      template: { id: 'scout', type: 'Type-S' },
      currentState: {
        structure: {
          hull: { current: 40, maximum: 40 },
          armor: { rating: 0, ablated: 0 },
          componentDamage: []
        },
        position: { x: 0, y: 0, facing: 0 },
        crew: { roster: [], casualties: {} },
        power: { available: 40, allocated: {} },
        ammunition: [],
        fuel: { current: 0, maximum: 0 }
      }
    }
  };

  const result = validateShipInstance(validData);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

// Test 7: Validate invalid ship instance (missing fields)
test('Validate detects missing required fields', () => {
  const invalidData = {
    schemaVersion: '1.0',
    ship: {
      // Missing: id, name, currentState
      template: { id: 'scout', type: 'Type-S' }
    }
  };

  const result = validateShipInstance(invalidData);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.some(e => e.includes('id')));
  assert.ok(result.errors.some(e => e.includes('name')));
});

// Test 8: Validate invalid ship instance (bad schema version)
test('Validate detects unsupported schema version', () => {
  const invalidData = {
    schemaVersion: '99.0',
    exportDate: new Date().toISOString(),
    ship: {
      id: 'ship-006',
      name: 'Future Ship',
      template: { id: 'scout', type: 'Type-S' },
      currentState: {
        structure: {
          hull: { current: 40, maximum: 40 },
          armor: { rating: 0, ablated: 0 },
          componentDamage: []
        },
        position: { x: 0, y: 0, facing: 0 }
      }
    }
  };

  const result = validateShipInstance(invalidData);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Unsupported')));
});

// Test 9: Validate detects malformed JSON
test('Validate detects malformed JSON string', () => {
  const malformedJSON = '{ invalid json }';
  const result = validateShipInstance(malformedJSON);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('JSON parse error')));
});

// Test 10: Import rejects missing schema version
test('Import rejects data without schema version', () => {
  const noVersion = {
    ship: {
      id: 'ship-007',
      name: 'No Version',
      template: { id: 'scout', type: 'Type-S' },
      currentState: {
        structure: { hull: { current: 40, maximum: 40 }, armor: { rating: 0 } },
        position: { x: 0, y: 0, facing: 0 }
      }
    }
  };

  try {
    importShipInstance(noVersion);
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('schemaVersion'));
  }
});

// Test 11: Import rejects unsupported version
test('Import rejects unsupported schema version', () => {
  const unsupportedVersion = {
    schemaVersion: '99.0',
    ship: {
      id: 'ship-008',
      name: 'Future Ship',
      template: { id: 'scout', type: 'Type-S' },
      currentState: {
        structure: { hull: { current: 40, maximum: 40 }, armor: { rating: 0 } },
        position: { x: 0, y: 0, facing: 0 }
      }
    }
  };

  try {
    importShipInstance(unsupportedVersion);
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Unsupported'));
  }
});

// Test 12: Export handles British spelling (armour)
test('Export handles British spelling for armour', () => {
  const ship = {
    id: 'ship-009',
    name: 'British Ship',
    type: 'scout',
    hull: 40,
    maxHull: 40,
    armour: 2,  // British spelling
    ablatedArmour: 1
  };

  const exported = exportShipInstance(ship);
  const imported = importShipInstance(exported);

  // Both spellings should be present
  assert.strictEqual(imported.armor, 2);
  assert.strictEqual(imported.armour, 2);
  assert.strictEqual(imported.ablatedArmor, 1);
  assert.strictEqual(imported.ablatedArmour, 1);
});

// ==================================================================
// BATTLE STATE EXPORT/IMPORT TESTS
// ==================================================================

console.log('\n--- Battle State Export/Import (8 tests) ---\n');

// Test 13: Export battle state with multiple ships
test('Export battle state with multiple ships', () => {
  const gameState = {
    factions: ['Imperial Navy', 'Pirates'],
    ships: [
      { id: 'ship-1', name: 'Defender', type: 'patrol_corvette', hull: 120, maxHull: 120, armor: 6 },
      { id: 'ship-2', name: 'Raider', type: 'corsair', hull: 80, maxHull: 80, armor: 4 }
    ],
    turn: 3,
    phase: 'combat',
    initiative: [{ id: 'ship-1', value: 12 }, { id: 'ship-2', value: 8 }],
    location: { system: 'Flammarion', sector: 'Spinward Marches' },
    combatLog: ['Turn 1: Battle begins', 'Turn 2: Defender fires']
  };

  const exported = exportBattleState(gameState, {
    battleName: 'Test Battle',
    user: 'gamemaster'
  });

  assert.strictEqual(exported.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(exported.battle.name, 'Test Battle');
  assert.strictEqual(exported.battle.factions.length, 2);
  assert.strictEqual(exported.battle.ships.length, 2);
  assert.strictEqual(exported.battle.turn.current, 3);
  assert.strictEqual(exported.battle.turn.phase, 'combat');
  assert.strictEqual(exported.exportedBy.user, 'gamemaster');
});

// Test 14: Import battle state
test('Import battle state and reconstruct game', () => {
  const gameState = {
    ships: [
      { id: 'ship-a', name: 'Alpha', type: 'scout', hull: 40, maxHull: 40, armor: 0 }
    ],
    turn: 1,
    phase: 'movement',
    combatLog: []
  };

  const exported = exportBattleState(gameState);
  const imported = importBattleState(exported);

  assert.strictEqual(imported.ships.length, 1);
  assert.strictEqual(imported.ships[0].id, 'ship-a');
  assert.strictEqual(imported.turn, 1);
  assert.strictEqual(imported.phase, 'movement');
  assert.ok(imported.importDate);
});

// Test 15: Battle state round-trip
test('Battle state round-trip preserves data', () => {
  const original = {
    factions: ['Side A', 'Side B'],
    ships: [
      { id: '1', name: 'Ship One', type: 'scout', hull: 40, maxHull: 40, armor: 0, x: 5, y: 10 },
      { id: '2', name: 'Ship Two', type: 'free_trader', hull: 60, maxHull: 60, armor: 4, x: 15, y: 20 }
    ],
    turn: 2,
    phase: 'combat',
    initiative: [{ id: '1', value: 14 }, { id: '2', value: 10 }],
    combatLog: ['Turn 1 log', 'Turn 2 log']
  };

  const exported = exportBattleState(original);
  const imported = importBattleState(exported);

  assert.strictEqual(imported.factions.length, 2);
  assert.strictEqual(imported.ships.length, 2);
  assert.strictEqual(imported.ships[0].name, 'Ship One');
  assert.strictEqual(imported.ships[1].name, 'Ship Two');
  assert.strictEqual(imported.turn, 2);
  assert.strictEqual(imported.combatLog.length, 2);
});

// Test 16: Validate valid battle state
test('Validate valid battle state', () => {
  const validData = {
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    battle: {
      ships: [],
      turn: { current: 1, phase: 'movement', initiative: [] }
    }
  };

  const result = validateBattleState(validData);
  assert.strictEqual(result.valid, true);
});

// Test 17: Validate invalid battle state (missing fields)
test('Validate battle state detects missing fields', () => {
  const invalidData = {
    schemaVersion: '1.0'
    // Missing: exportDate, battle
  };

  const result = validateBattleState(invalidData);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.length > 0);
});

// Test 18: Validate battle state with non-array ships
test('Validate detects non-array ships field', () => {
  const invalidData = {
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    battle: {
      ships: 'not an array',
      turn: { current: 1 }
    }
  };

  const result = validateBattleState(invalidData);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('array')));
});

// Test 19: Import battle state from JSON string
test('Import battle state from JSON string', () => {
  const jsonString = JSON.stringify({
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    battle: {
      ships: [],
      turn: { current: 1, phase: 'movement', initiative: [] },
      environment: {},
      history: { log: [] }
    }
  });

  const imported = importBattleState(jsonString);
  assert.strictEqual(imported.turn, 1);
  assert.strictEqual(imported.phase, 'movement');
});

// Test 20: Export battle with empty state
test('Export battle with minimal/empty state', () => {
  const emptyState = {
    ships: [],
    turn: 1
  };

  const exported = exportBattleState(emptyState);
  assert.ok(exported.battle);
  assert.strictEqual(exported.battle.ships.length, 0);
  assert.strictEqual(exported.battle.turn.current, 1);
});

// ==================================================================
// CHARACTER EXPORT/IMPORT TESTS
// ==================================================================

console.log('\n--- Character Export/Import (6 tests) ---\n');

// Test 21: Export character
test('Export character with basic data', () => {
  const character = {
    name: 'Marcus Cole',
    characteristics: {
      strength: { current: 7, base: 7, dm: 0 },
      dexterity: { current: 9, base: 9, dm: 1 }
    },
    skills: [
      { name: 'Pilot', specialty: 'starship', level: 2 }
    ]
  };

  const exported = exportCharacter(character);
  assert.strictEqual(exported.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(exported.character.name, 'Marcus Cole');
  assert.strictEqual(exported.character.skills[0].name, 'Pilot');
});

// Test 22: Import character
test('Import character and reconstruct data', () => {
  const character = {
    name: 'Susan Ivanova',
    title: 'Commander',
    characteristics: { strength: { current: 8 } },
    skills: [{ name: 'Tactics', level: 3 }]
  };

  const exported = exportCharacter(character);
  const imported = importCharacter(exported);

  assert.strictEqual(imported.name, 'Susan Ivanova');
  assert.strictEqual(imported.title, 'Commander');
  assert.strictEqual(imported.skills[0].level, 3);
});

// Test 23: Character round-trip
test('Character round-trip preserves data', () => {
  const original = {
    name: 'Test Character',
    homeworld: 'Earth',
    characteristics: {
      strength: { current: 7 },
      dexterity: { current: 8 }
    },
    skills: [
      { name: 'Gun Combat', specialty: 'slug', level: 1 },
      { name: 'Athletics', level: 2 }
    ],
    careers: [{ name: 'Navy', terms: 3 }]
  };

  const exported = exportCharacter(original);
  const imported = importCharacter(exported);

  assert.strictEqual(imported.name, original.name);
  assert.strictEqual(imported.homeworld, original.homeworld);
  assert.strictEqual(imported.skills.length, 2);
  assert.strictEqual(imported.careers[0].terms, 3);
});

// Test 24: Validate valid character
test('Validate valid character data', () => {
  const validData = {
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    character: {
      name: 'Valid Character'
    }
  };

  const result = validateCharacter(validData);
  assert.strictEqual(result.valid, true);
});

// Test 25: Validate invalid character (missing name)
test('Validate character detects missing name', () => {
  const invalidData = {
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    character: {
      // Missing name
      skills: []
    }
  };

  const result = validateCharacter(invalidData);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('name')));
});

// Test 26: Import character from JSON string
test('Import character from JSON string', () => {
  const jsonString = JSON.stringify({
    schemaVersion: '1.0',
    exportDate: new Date().toISOString(),
    character: {
      name: 'String Import Test'
    }
  });

  const imported = importCharacter(jsonString);
  assert.strictEqual(imported.name, 'String Import Test');
});

// ==================================================================
// UTILITY FUNCTION TESTS
// ==================================================================

console.log('\n--- Utility Functions (6 tests) ---\n');

// Test 27: Detect schema version
test('Detect schema version from data', () => {
  const data = { schemaVersion: '1.0', other: 'data' };
  const version = detectSchemaVersion(data);
  assert.strictEqual(version, '1.0');
});

// Test 28: Detect schema version from JSON string
test('Detect schema version from JSON string', () => {
  const jsonString = '{"schemaVersion":"1.0","data":"test"}';
  const version = detectSchemaVersion(jsonString);
  assert.strictEqual(version, '1.0');
});

// Test 29: Detect schema version returns null for invalid
test('Detect schema version returns null for invalid data', () => {
  const noVersion = { other: 'data' };
  const version = detectSchemaVersion(noVersion);
  assert.strictEqual(version, null);
});

// Test 30: Get supported versions
test('Get supported versions list', () => {
  const versions = getSupportedVersions();
  assert.ok(Array.isArray(versions));
  assert.ok(versions.includes('1.0'));
});

// Test 31: Get schema path for ship
test('Get schema path for ship type', () => {
  const path = getSchemaPath('ship');
  assert.ok(path.includes('ship-instance-export.schema.json'));
});

// Test 32: Get schema path for invalid type throws error
test('Get schema path throws error for invalid type', () => {
  try {
    getSchemaPath('invalid_type');
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Unknown schema type'));
  }
});

// ==================================================================
// ERROR HANDLING TESTS
// ==================================================================

console.log('\n--- Error Handling (4 tests) ---\n');

// Test 33: Export rejects null ship
test('Export ship rejects null data', () => {
  try {
    exportShipInstance(null);
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Invalid ship data'));
  }
});

// Test 34: Export rejects ship without ID
test('Export ship rejects missing ID', () => {
  try {
    exportShipInstance({ name: 'No ID Ship' });
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('missing required field "id"'));
  }
});

// Test 35: Import rejects malformed JSON
test('Import rejects malformed JSON string', () => {
  try {
    importShipInstance('{ invalid json }');
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Invalid JSON'));
  }
});

// Test 36: Import rejects non-object input
test('Import rejects non-object input', () => {
  try {
    importShipInstance(123);
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Invalid input'));
  }
});

// ==================================================================
// SUMMARY
// ==================================================================

console.log('\n========================================');
console.log('TEST RESULTS');
console.log('========================================');
console.log(`PASSED: ${passed}/${passed + failed}`);
console.log(`FAILED: ${failed}/${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
}
