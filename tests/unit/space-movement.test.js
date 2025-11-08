// ========================================
// STAGE 9.1: MOVEMENT & THRUST TESTS
// ========================================

const assert = require('assert');

// Import space combat functions
const combat_lib = require('../../lib/combat.js');
const { ShipRegistry } = require('../../lib/ship-registry');

console.log('========================================');
console.log('STAGE 9.1: MOVEMENT & THRUST TESTS');
console.log('========================================\n');

// Test counter
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Got: ${actual}`);
  }
}

function assertGreaterThan(actual, minimum, message) {
  if (actual <= minimum) {
    throw new Error(`${message}\n  Expected > ${minimum}\n  Got: ${actual}`);
  }
}

function assertLessThanOrEqual(actual, maximum, message) {
  if (actual > maximum) {
    throw new Error(`${message}\n  Expected <= ${maximum}\n  Got: ${actual}`);
  }
}

console.log('--- THRUST ALLOCATION (8 tests) ---\n');

test('Scout has thrust 2', () => {
  const registry = new ShipRegistry();
  const scout = registry.getShip('scout');
  assertEqual(scout.thrust, 2, 'Scout should have thrust 2');
});

test('Free Trader has thrust 1', () => {
  const registry = new ShipRegistry();
  const trader = registry.getShip('free_trader');
  assertEqual(trader.thrust, 1, 'Free Trader should have thrust 1');
});

test('Ship starts with full thrust available', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  const available = combat_lib.getAvailableThrust(state);
  assertEqual(available, 2, 'Full thrust should be available');
});

test('Thrust reduces after movement', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  combat_lib.useThrust(state, 1);
  assertEqual(state.thrustUsed, 1, 'Thrust used should increment');
  assertEqual(combat_lib.getAvailableThrust(state), 1, 'Available thrust should reduce');
});

test('Cannot use more thrust than available', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  const result = combat_lib.canUseThrust(state, 3);
  assertEqual(result, false, 'Cannot use 3 thrust when only 2 available');
});

test('Can use thrust equal to available', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  const result = combat_lib.canUseThrust(state, 2);
  assertEqual(result, true, 'Can use thrust equal to available');
});

test('Thrust resets at start of turn', () => {
  const state = { thrust: 2, thrustUsed: 2 };
  combat_lib.resetThrust(state);
  assertEqual(state.thrustUsed, 0, 'Thrust used should reset to 0');
  assertEqual(combat_lib.getAvailableThrust(state), 2, 'Full thrust available after reset');
});

test('Thrust tracking persists across actions', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  combat_lib.useThrust(state, 1);
  combat_lib.useThrust(state, 1);
  assertEqual(state.thrustUsed, 2, 'Multiple thrust uses should accumulate');
  assertEqual(combat_lib.getAvailableThrust(state), 0, 'No thrust remaining');
});

console.log('\n--- RANGE BAND MOVEMENT (10 tests) ---\n');

test('Range bands have distance values', () => {
  const ranges = combat_lib.getRangeBands();
  assertEqual(ranges.Adjacent, 0, 'Adjacent = 0');
  assertEqual(ranges.Close, 1, 'Close = 1');
  assertEqual(ranges.Short, 2, 'Short = 2');
  assertEqual(ranges.Medium, 3, 'Medium = 3');
  assertEqual(ranges.Long, 4, 'Long = 4');
  assertEqual(ranges['Very Long'], 5, 'Very Long = 5');
  assertEqual(ranges.Distant, 6, 'Distant = 6');
});

test('Calculate range change cost (Close to Medium)', () => {
  const cost = combat_lib.calculateRangeChangeCost('Close', 'Medium');
  assertEqual(cost, 2, 'Close (1) to Medium (3) costs 2 thrust');
});

test('Calculate range change cost (Medium to Close)', () => {
  const cost = combat_lib.calculateRangeChangeCost('Medium', 'Close');
  assertEqual(cost, 2, 'Medium (3) to Close (1) costs 2 thrust (absolute)');
});

test('Calculate range change cost (Adjacent to Distant)', () => {
  const cost = combat_lib.calculateRangeChangeCost('Adjacent', 'Distant');
  assertEqual(cost, 6, 'Adjacent (0) to Distant (6) costs 6 thrust');
});

test('Same range costs 0 thrust', () => {
  const cost = combat_lib.calculateRangeChangeCost('Medium', 'Medium');
  assertEqual(cost, 0, 'Same range should cost 0');
});

test('Can move if thrust available', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  const cost = combat_lib.calculateRangeChangeCost('Close', 'Medium');
  const canMove = combat_lib.canUseThrust(state, cost);
  assertEqual(canMove, true, 'Should be able to move with sufficient thrust');
});

test('Cannot move if insufficient thrust', () => {
  const state = { thrust: 2, thrustUsed: 0 };
  const cost = combat_lib.calculateRangeChangeCost('Adjacent', 'Distant');
  const canMove = combat_lib.canUseThrust(state, cost);
  assertEqual(canMove, false, 'Cannot move 6 bands with only 2 thrust');
});

test('Move range updates combat state', () => {
  const state = { range: 'Medium', thrust: 2, thrustUsed: 0 };
  const result = combat_lib.moveToRange(state, 'Close');
  assertEqual(result.success, true, 'Move should succeed');
  assertEqual(state.range, 'Close', 'Range should update');
  assertEqual(state.thrustUsed, 2, 'Thrust should be consumed');
});

test('Move fails if insufficient thrust', () => {
  const state = { range: 'Adjacent', thrust: 2, thrustUsed: 0 };
  const result = combat_lib.moveToRange(state, 'Distant');
  assertEqual(result.success, false, 'Move should fail');
  assertEqual(state.range, 'Adjacent', 'Range should not change');
  assertEqual(state.thrustUsed, 0, 'Thrust should not be consumed');
});

test('Move to invalid range fails', () => {
  const state = { range: 'Medium', thrust: 2, thrustUsed: 0 };
  const result = combat_lib.moveToRange(state, 'InvalidRange');
  assertEqual(result.success, false, 'Invalid range should fail');
  assertEqual(state.range, 'Medium', 'Range should not change');
});

console.log('\n--- MOVEMENT VALIDATION (6 tests) ---\n');

test('Validate range name (valid)', () => {
  const valid = combat_lib.isValidRange('Medium');
  assertEqual(valid, true, 'Medium is valid range');
});

test('Validate range name (invalid)', () => {
  const valid = combat_lib.isValidRange('SuperLong');
  assertEqual(valid, false, 'SuperLong is not valid range');
});

test('Validate range name (case sensitive)', () => {
  const valid = combat_lib.isValidRange('medium');
  assertEqual(valid, false, 'Range names are case sensitive');
});

test('Get all valid range names', () => {
  const ranges = combat_lib.getValidRangeNames();
  assertEqual(ranges.length, 7, 'Should have 7 range bands');
  assertEqual(ranges[0], 'Adjacent', 'First range is Adjacent');
  assertEqual(ranges[6], 'Distant', 'Last range is Distant');
});

test('Get range distance value', () => {
  const distance = combat_lib.getRangeDistance('Medium');
  assertEqual(distance, 3, 'Medium range distance is 3');
});

test('Get range distance for invalid range returns null', () => {
  const distance = combat_lib.getRangeDistance('Invalid');
  assertEqual(distance, null, 'Invalid range returns null');
});

// ========================================
// RESULTS
// ========================================
console.log('\n========================================');
console.log('STAGE 9.1 TEST RESULTS');
console.log('========================================');
console.log(`PASSED: ${passed}/24`);
console.log(`FAILED: ${failed}/24`);

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('========================================');
  console.log('Ready to implement Stage 9.1!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('========================================');
  process.exit(1);
}
