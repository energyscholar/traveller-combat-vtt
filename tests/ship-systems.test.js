/**
 * Ship Systems Tests
 * Tests system damage, status effects, and repairs
 */

const shipSystems = require('../lib/operations/ship-systems');
const { db, generateId } = require('../lib/operations/database');
const campaign = require('../lib/operations/campaign');

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

function assertFalse(value, msg = '') {
  if (value) {
    throw new Error(`${msg} Expected false, got ${value}`);
  }
}

// ==================== Setup ====================

console.log('\n=== Ship Systems Tests ===\n');

let testCampaignId = generateId();
let testShipId = generateId();

// Create test campaign
db.prepare(`
  INSERT INTO campaigns (id, name, gm_name, current_date)
  VALUES (?, ?, ?, ?)
`).run(testCampaignId, 'Systems Test Campaign', 'Test GM', '1105-001 12:00');

// Create test ship
db.prepare(`
  INSERT INTO ships (id, campaign_id, name, template_id, ship_data, current_state)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  testShipId,
  testCampaignId,
  'Test Ship',
  'scout',
  JSON.stringify({ hull: 40, thrust: 2 }),
  JSON.stringify({})
);

// ==================== System Status Tests ====================

console.log('--- System Status ---\n');

test('getSystemStatuses returns all systems for undamaged ship', () => {
  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertTrue(statuses.mDrive !== undefined, 'mDrive status');
  assertTrue(statuses.powerPlant !== undefined, 'powerPlant status');
  assertTrue(statuses.sensors !== undefined, 'sensors status');
  assertTrue(statuses.jDrive !== undefined, 'jDrive status');
  assertTrue(statuses.computer !== undefined, 'computer status');
  assertTrue(statuses.armour !== undefined, 'armour status');
});

test('Undamaged ship has zero severity for all systems', () => {
  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertEqual(statuses.mDrive.totalSeverity, 0);
  assertEqual(statuses.sensors.totalSeverity, 0);
  assertEqual(statuses.powerPlant.totalSeverity, 0);
});

test('getDamagedSystems returns empty array for undamaged ship', () => {
  const ship = campaign.getShip(testShipId);
  const damaged = shipSystems.getDamagedSystems(ship);

  assertEqual(damaged.length, 0);
});

// ==================== Apply Damage Tests ====================

console.log('\n--- Apply Damage ---\n');

test('applySystemDamage adds crit to system', () => {
  const result = shipSystems.applySystemDamage(testShipId, 'mDrive', 2);

  assertTrue(result.success);
  assertEqual(result.location, 'mDrive');
  assertEqual(result.severity, 2);
  assertEqual(result.totalSeverity, 2);
});

test('Ship now shows mDrive as damaged', () => {
  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertEqual(statuses.mDrive.totalSeverity, 2);
  assertTrue(statuses.mDrive.crits.length > 0);
});

test('Multiple crits accumulate severity', () => {
  shipSystems.applySystemDamage(testShipId, 'mDrive', 1);

  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertEqual(statuses.mDrive.totalSeverity, 3); // 2 + 1
});

test('getDamagedSystems includes damaged system', () => {
  const ship = campaign.getShip(testShipId);
  const damaged = shipSystems.getDamagedSystems(ship);

  assertTrue(damaged.includes('mDrive'));
});

test('applySystemDamage rejects invalid system', () => {
  const result = shipSystems.applySystemDamage(testShipId, 'invalidSystem', 1);

  assertFalse(result.success);
  assertTrue(result.error.includes('Invalid system'));
});

test('applySystemDamage rejects invalid severity', () => {
  const result = shipSystems.applySystemDamage(testShipId, 'sensors', 7);

  assertFalse(result.success);
  assertTrue(result.error.includes('Severity must be 1-6'));
});

// ==================== Repair Tests ====================

console.log('\n--- Repair System ---\n');

test('repairSystem attempts repair on damaged system', () => {
  // First apply damage to sensors
  shipSystems.applySystemDamage(testShipId, 'sensors', 1);

  // Attempt repair with high skill
  const result = shipSystems.repairSystem(testShipId, 'sensors', 3);

  // Result should have roll info regardless of success
  assertTrue(result.roll !== undefined);
  assertTrue(result.skill !== undefined);
  assertEqual(result.location, 'sensors');
});

test('repairSystem returns error for undamaged system', () => {
  const result = shipSystems.repairSystem(testShipId, 'jDrive', 2);

  assertFalse(result.success);
  assertTrue(result.error.includes('No damage'));
});

// ==================== Clear Damage Tests ====================

console.log('\n--- Clear Damage ---\n');

test('clearSystemDamage clears single system', () => {
  // Make sure mDrive has damage
  const beforeShip = campaign.getShip(testShipId);
  const beforeStatus = shipSystems.getSystemStatuses(beforeShip);
  assertTrue(beforeStatus.mDrive.totalSeverity > 0, 'mDrive should have damage');

  // Clear mDrive damage
  const result = shipSystems.clearSystemDamage(testShipId, 'mDrive');

  assertTrue(result.success);

  // Check it's cleared
  const afterShip = campaign.getShip(testShipId);
  const afterStatus = shipSystems.getSystemStatuses(afterShip);
  assertEqual(afterStatus.mDrive.totalSeverity, 0);
});

test('clearSystemDamage clears all damage', () => {
  // Apply some damage
  shipSystems.applySystemDamage(testShipId, 'powerPlant', 2);
  shipSystems.applySystemDamage(testShipId, 'computer', 1);

  // Clear all
  const result = shipSystems.clearSystemDamage(testShipId, 'all');

  assertTrue(result.success);

  // Check everything is cleared
  const ship = campaign.getShip(testShipId);
  const damaged = shipSystems.getDamagedSystems(ship);
  assertEqual(damaged.length, 0);
});

test('clearSystemDamage rejects invalid system', () => {
  const result = shipSystems.clearSystemDamage(testShipId, 'notASystem');

  assertFalse(result.success);
});

// ==================== System Effects Tests ====================

console.log('\n--- System Effects ---\n');

test('mDrive damage applies thrust penalty', () => {
  shipSystems.clearSystemDamage(testShipId, 'all');
  shipSystems.applySystemDamage(testShipId, 'mDrive', 2);

  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertEqual(statuses.mDrive.thrustPenalty, 2);
  assertEqual(statuses.mDrive.controlDM, -2);
});

test('High severity mDrive damage disables drive', () => {
  shipSystems.clearSystemDamage(testShipId, 'all');
  shipSystems.applySystemDamage(testShipId, 'mDrive', 5);

  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertTrue(statuses.mDrive.disabled);
});

test('Sensors damage limits max range', () => {
  shipSystems.clearSystemDamage(testShipId, 'all');
  shipSystems.applySystemDamage(testShipId, 'sensors', 2);

  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertEqual(statuses.sensors.maxRange, 'medium');
});

test('jDrive any damage disables jump', () => {
  shipSystems.clearSystemDamage(testShipId, 'all');
  shipSystems.applySystemDamage(testShipId, 'jDrive', 1);

  const ship = campaign.getShip(testShipId);
  const statuses = shipSystems.getSystemStatuses(ship);

  assertTrue(statuses.jDrive.disabled);
});

// ==================== Cleanup ====================

shipSystems.clearSystemDamage(testShipId, 'all');
db.prepare('DELETE FROM ships WHERE id = ?').run(testShipId);
db.prepare('DELETE FROM campaigns WHERE id = ?').run(testCampaignId);

// ==================== Results ====================

console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
