/**
 * AI Decision Tests
 * Tests for AI opponent decision-making logic
 */

const {
  RANGE_BANDS,
  findAvailableWeapons,
  chooseWeaponForRange
} = require('../../lib/combat/ai/decisions');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`${msg} Expected true, got ${value}`);
  }
}

function assertNull(value, msg = '') {
  if (value !== null) {
    throw new Error(`${msg} Expected null, got ${value}`);
  }
}

// ==================== AI Decision Tests ====================

console.log('\n=== AI Decision Tests ===\n');

console.log('Range Bands (2 tests):');

test('RANGE_BANDS has correct order', () => {
  assertEqual(RANGE_BANDS[0], 'Adjacent');
  assertEqual(RANGE_BANDS[4], 'Long');
  assertEqual(RANGE_BANDS.length, 7);
});

test('Long range starts at index 4', () => {
  const rangeIndex = RANGE_BANDS.indexOf('Long');
  assertEqual(rangeIndex, 4);
});

console.log('\nfindAvailableWeapons (4 tests):');

test('findAvailableWeapons returns null for empty ship', () => {
  const result = findAvailableWeapons(null, {});
  assertNull(result.missileWeapon);
  assertNull(result.laserWeapon);
});

test('findAvailableWeapons finds laser weapon', () => {
  const shipData = {
    weapons: [
      { id: 'BeamLaser', name: 'Beam Laser' }
    ]
  };
  const aiData = { ammo: {} };
  const result = findAvailableWeapons(shipData, aiData);
  assertNull(result.missileWeapon);
  assertTrue(result.laserWeapon !== null);
  assertEqual(result.laserWeapon.weapon, 0);
});

test('findAvailableWeapons finds missile with ammo', () => {
  const shipData = {
    weapons: [
      { id: 'missiles', name: 'Missiles' }
    ]
  };
  const aiData = { ammo: { missiles: 5 } };
  const result = findAvailableWeapons(shipData, aiData);
  assertTrue(result.missileWeapon !== null);
  assertEqual(result.missileWeapon.weapon, 0);
});

test('findAvailableWeapons skips missile with no ammo', () => {
  const shipData = {
    weapons: [
      { id: 'missiles', name: 'Missiles' }
    ]
  };
  const aiData = { ammo: { missiles: 0 } };
  const result = findAvailableWeapons(shipData, aiData);
  assertNull(result.missileWeapon);
});

console.log('\nchooseWeaponForRange (4 tests):');

test('chooseWeaponForRange picks missiles at Long range', () => {
  const missileWeapon = { turret: 0, weapon: 0 };
  const laserWeapon = { turret: 0, weapon: 1 };
  const aiData = { ammo: { missiles: 5 } };

  const result = chooseWeaponForRange('Long', missileWeapon, laserWeapon, aiData);
  assertEqual(result, missileWeapon);
});

test('chooseWeaponForRange picks laser at Close range', () => {
  const missileWeapon = { turret: 0, weapon: 0 };
  const laserWeapon = { turret: 0, weapon: 1 };
  const aiData = { ammo: { missiles: 5 } };

  const result = chooseWeaponForRange('Close', missileWeapon, laserWeapon, aiData);
  assertEqual(result, laserWeapon);
});

test('chooseWeaponForRange falls back to laser without missiles', () => {
  const laserWeapon = { turret: 0, weapon: 1 };
  const aiData = { ammo: {} };

  const result = chooseWeaponForRange('Long', null, laserWeapon, aiData);
  assertEqual(result, laserWeapon);
});

test('chooseWeaponForRange returns null if no weapons', () => {
  const result = chooseWeaponForRange('Medium', null, null, {});
  assertNull(result);
});

// ==================== Summary ====================

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
