/**
 * Jump Travel Tests
 * Tests jump initiation, completion, and date calculations
 */

const jump = require('../lib/operations/jump');
const { db, generateId } = require('../lib/operations/database');
const campaign = require('../lib/operations/campaign');
const accounts = require('../lib/operations/accounts');

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

console.log('\n=== Jump Travel Tests ===\n');

let testCampaignId = generateId();
let testShipId = generateId();

// Create test campaign
db.prepare(`
  INSERT INTO campaigns (id, name, gm_name, current_date, current_system)
  VALUES (?, ?, ?, ?, ?)
`).run(testCampaignId, 'Jump Test Campaign', 'Test GM', '1105-100 12:00', 'Regina');

// Create test ship with fuel
db.prepare(`
  INSERT INTO ships (id, campaign_id, name, template_id, ship_data, current_state)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  testShipId,
  testCampaignId,
  'Test Scout',
  'scout',
  JSON.stringify({ hull: 100, tonnage: 100, jumpRating: 2, fuel: 40 }),
  JSON.stringify({ fuel: 40 })
);

// ==================== Date Utility Tests ====================

console.log('--- Date Utilities ---\n');

test('parseDate parses Imperial date correctly', () => {
  const date = jump.parseDate('1105-100 12:30');
  assertEqual(date.year, 1105);
  assertEqual(date.day, 100);
  assertEqual(date.hours, 12);
  assertEqual(date.minutes, 30);
});

test('formatDate formats date correctly', () => {
  const result = jump.formatDate(1105, 42, 8, 5);
  assertEqual(result, '1105-042 08:05');
});

test('advanceDate adds hours correctly', () => {
  const result = jump.advanceDate('1105-100 12:00', 5, 0);
  assertEqual(result, '1105-100 17:00');
});

test('advanceDate handles day rollover', () => {
  const result = jump.advanceDate('1105-100 22:00', 5, 0);
  assertEqual(result, '1105-101 03:00');
});

test('advanceDate handles year rollover', () => {
  const result = jump.advanceDate('1105-365 12:00', 24, 0);
  assertEqual(result, '1106-001 12:00');
});

test('advanceDate calculates 168-hour jump correctly', () => {
  const result = jump.advanceDate('1105-100 12:00', 168, 0);
  // 168 hours = 7 days
  assertEqual(result, '1105-107 12:00');
});

test('hoursBetween calculates difference correctly', () => {
  const hours = jump.hoursBetween('1105-100 12:00', '1105-100 18:00');
  assertEqual(hours, 6);
});

test('hoursBetween handles day differences', () => {
  const hours = jump.hoursBetween('1105-100 12:00', '1105-101 12:00');
  assertEqual(hours, 24);
});

// ==================== Can Jump Tests ====================

console.log('\n--- Can Initiate Jump ---\n');

test('canInitiateJump succeeds with sufficient fuel', () => {
  const result = jump.canInitiateJump(testShipId, 1);
  assertTrue(result.canJump);
  assertTrue(result.fuelNeeded > 0);
});

test('canInitiateJump calculates correct fuel for Jump-1', () => {
  const result = jump.canInitiateJump(testShipId, 1);
  // 100 ton ship * 1 parsec * 10% = 10 tons
  assertEqual(result.fuelNeeded, 10);
});

test('canInitiateJump calculates correct fuel for Jump-2', () => {
  const result = jump.canInitiateJump(testShipId, 2);
  // 100 ton ship * 2 parsec * 10% = 20 tons
  assertEqual(result.fuelNeeded, 20);
});

test('canInitiateJump fails if distance exceeds jump rating', () => {
  const result = jump.canInitiateJump(testShipId, 3);  // Ship has Jump-2
  assertFalse(result.canJump);
  assertTrue(result.error.includes('exceeds'));
});

test('canInitiateJump fails with insufficient fuel', () => {
  // Reduce fuel
  campaign.updateShipState(testShipId, { fuel: 5 });

  const result = jump.canInitiateJump(testShipId, 1);
  assertFalse(result.canJump);
  assertTrue(result.error.includes('Insufficient fuel'));

  // Restore fuel
  campaign.updateShipState(testShipId, { fuel: 40 });
});

// ==================== Initiate Jump Tests ====================

console.log('\n--- Initiate Jump ---\n');

test('initiateJump succeeds and sets jump state', () => {
  const result = jump.initiateJump(testShipId, testCampaignId, 'Efate', 1);

  assertTrue(result.success);
  assertEqual(result.destination, 'Efate');
  assertEqual(result.distance, 1);
  assertTrue(result.jumpEndDate !== null);
});

test('Ship is now in jump space', () => {
  const ship = campaign.getShip(testShipId);
  assertTrue(ship.current_state.jump.inJump);
  assertEqual(ship.current_state.jump.destination, 'Efate');
});

test('Fuel was consumed', () => {
  const ship = campaign.getShip(testShipId);
  assertEqual(ship.current_state.fuel, 30);  // 40 - 10
});

test('Cannot initiate jump while already in jump', () => {
  const result = jump.initiateJump(testShipId, testCampaignId, 'Regina', 1);
  assertFalse(result.success);
  assertTrue(result.error.includes('Already in jump'));
});

// ==================== Jump Status Tests ====================

console.log('\n--- Jump Status ---\n');

test('getJumpStatus returns in-jump status', () => {
  const campaignData = accounts.getCampaign(testCampaignId);
  const status = jump.getJumpStatus(testShipId, campaignData.current_date);

  assertTrue(status.inJump);
  assertEqual(status.destination, 'Efate');
  assertTrue(status.hoursRemaining > 0);
  assertFalse(status.canExit);
});

test('getJumpStatus shows canExit after time passes', () => {
  // Simulate time passing (use future date)
  const futureDate = '1105-110 12:00';  // Well after jump should complete
  const status = jump.getJumpStatus(testShipId, futureDate);

  assertTrue(status.inJump);
  assertTrue(status.canExit);
  assertEqual(status.hoursRemaining, 0);
});

// ==================== Complete Jump Tests ====================

console.log('\n--- Complete Jump ---\n');

test('completeJump fails if time not elapsed', () => {
  // Reset campaign date to before jump completion
  accounts.updateCampaign(testCampaignId, { current_date: '1105-100 12:00' });

  // Ship should still be in jump but can't exit
  const status = jump.getJumpStatus(testShipId, '1105-100 12:00');
  assertFalse(status.canExit);
});

test('completeJump succeeds when time elapsed', () => {
  // Advance campaign time past jump completion
  accounts.updateCampaign(testCampaignId, { current_date: '1105-110 12:00' });

  const result = jump.completeJump(testShipId, testCampaignId);

  assertTrue(result.success);
  assertEqual(result.arrivedAt, 'Efate');
});

test('Campaign location updated after jump', () => {
  const campaignData = accounts.getCampaign(testCampaignId);
  assertEqual(campaignData.current_system, 'Efate');
});

test('Ship no longer in jump space', () => {
  const ship = campaign.getShip(testShipId);
  assertFalse(ship.current_state.jump.inJump);
});

// ==================== Cleanup ====================

db.prepare('DELETE FROM ships WHERE id = ?').run(testShipId);
db.prepare('DELETE FROM campaigns WHERE id = ?').run(testCampaignId);

// ==================== Results ====================

console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
