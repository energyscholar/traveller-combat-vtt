// ========================================
// STAGE 9.2: PROPER INITIATIVE TESTS
// ========================================

const assert = require('assert');
const combat_lib = require('../../lib/combat.js');
const { ShipRegistry } = require('../../lib/ship-registry');

console.log('========================================');
console.log('STAGE 9.2: PROPER INITIATIVE TESTS');
console.log('========================================\n');

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

function assertGreaterThanOrEqual(actual, minimum, message) {
  if (actual < minimum) {
    throw new Error(`${message}\n  Expected >= ${minimum}\n  Got: ${actual}`);
  }
}

function assertLessThanOrEqual(actual, maximum, message) {
  if (actual > maximum) {
    throw new Error(`${message}\n  Expected <= ${maximum}\n  Got: ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

console.log('--- INITIATIVE CALCULATION (8 tests) ---\n');

test('Initiative includes 2D6 roll', () => {
  const ship = { id: 'scout', pilotSkill: 2, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  assertGreaterThanOrEqual(result.total, 6, 'Min: 2 (dice) + 2 (pilot) + 2 (thrust)');
  assertLessThanOrEqual(result.total, 16, 'Max: 12 (dice) + 2 (pilot) + 2 (thrust)');
  assertTrue(result.diceRoll !== undefined, 'Should have dice roll');
  assertTrue(result.pilotBonus !== undefined, 'Should have pilot bonus');
  assertTrue(result.thrustBonus !== undefined, 'Should have thrust bonus');
});

test('Initiative = 2D6 + pilot skill + thrust', () => {
  const ship = { id: 'scout', pilotSkill: 2, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  const expected = result.diceRoll + 2 + 2;
  assertEqual(result.total, expected, 'Total should equal dice + pilot + thrust');
});

test('Initiative with zero pilot skill', () => {
  const ship = { id: 'test', pilotSkill: 0, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  assertEqual(result.pilotBonus, 0, 'Zero pilot should give no bonus');
  assertGreaterThanOrEqual(result.total, 2, 'Min: 2 (dice min)');
});

test('Initiative with high pilot skill (3)', () => {
  const ship = { id: 'test', pilotSkill: 3, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  assertEqual(result.pilotBonus, 3, 'Pilot skill 3 should add +3');
  assertGreaterThanOrEqual(result.total, 7, 'Min: 2 (dice) + 3 (pilot) + 2 (thrust)');
});

test('Captain Tactics bonus applies on success', () => {
  const ship = {
    id: 'scout',
    pilotSkill: 2,
    thrust: 2,
    captain: { skill_tactics_naval: 2 }
  };

  // Mock successful tactics roll
  const result = combat_lib.rollInitiativeWithTactics(ship, { tacticsRoll: 10, effect: 2 });

  assertTrue(result.tacticsBonus >= 0, 'Tactics bonus should be >= 0 on success');
  assertTrue(result.total >= result.diceRoll + 2 + 2, 'Should have at least base bonuses');
});

test('Captain Tactics bonus does not apply on failure', () => {
  const ship = {
    id: 'scout',
    pilotSkill: 2,
    thrust: 2,
    captain: { skill_tactics_naval: 2 }
  };

  // Mock failed tactics roll
  const result = combat_lib.rollInitiativeWithTactics(ship, { tacticsRoll: 5, effect: -3 });

  assertEqual(result.tacticsBonus, 0, 'Failed tactics should give no bonus');
  assertEqual(result.total, result.diceRoll + 2 + 2, 'Should only have base bonuses');
});

test('No captain means no tactics bonus', () => {
  const ship = { id: 'scout', pilotSkill: 2, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  assertEqual(result.tacticsBonus || 0, 0, 'No captain should mean no tactics bonus');
});

test('Initiative breakdown is returned', () => {
  const ship = { id: 'scout', pilotSkill: 2, thrust: 2 };
  const result = combat_lib.rollInitiative(ship);

  assertTrue(result.diceRoll >= 2 && result.diceRoll <= 12, 'Dice roll in 2D6 range');
  assertEqual(result.pilotBonus, 2, 'Pilot bonus = skill');
  assertEqual(result.thrustBonus, 2, 'Thrust bonus = thrust');
  assertEqual(result.total, result.diceRoll + 2 + 2, 'Total sums components');
});

console.log('\n--- INITIATIVE SORTING (5 tests) ---\n');

test('Ships sorted by initiative (high to low)', () => {
  const ships = [
    { id: 'ship1', initiative: 10 },
    { id: 'ship2', initiative: 15 },
    { id: 'ship3', initiative: 8 }
  ];

  const sorted = combat_lib.sortByInitiative(ships);

  assertEqual(sorted[0].id, 'ship2', 'Highest initiative first');
  assertEqual(sorted[1].id, 'ship1', 'Middle initiative second');
  assertEqual(sorted[2].id, 'ship3', 'Lowest initiative last');
});

test('Equal initiative maintains order', () => {
  const ships = [
    { id: 'ship1', initiative: 10 },
    { id: 'ship2', initiative: 10 }
  ];

  const sorted = combat_lib.sortByInitiative(ships);

  assertEqual(sorted[0].id, 'ship1', 'First ship with tie should stay first');
  assertEqual(sorted[1].id, 'ship2', 'Second ship with tie should stay second');
});

test('Single ship returns array of one', () => {
  const ships = [{ id: 'solo', initiative: 10 }];
  const sorted = combat_lib.sortByInitiative(ships);

  assertEqual(sorted.length, 1, 'Should have 1 ship');
  assertEqual(sorted[0].id, 'solo', 'Should be the solo ship');
});

test('Empty array returns empty array', () => {
  const sorted = combat_lib.sortByInitiative([]);
  assertEqual(sorted.length, 0, 'Empty array should remain empty');
});

test('Initiative sorting does not mutate original', () => {
  const ships = [
    { id: 'ship1', initiative: 10 },
    { id: 'ship2', initiative: 15 }
  ];
  const original = [...ships];

  combat_lib.sortByInitiative(ships);

  assertEqual(ships[0].id, original[0].id, 'Original array should not be mutated');
});

console.log('\n--- TURN TRACKER WITH INITIATIVE (3 tests) ---\n');

test('Create turn tracker rolls initiative for all ships', () => {
  const ships = [
    { id: 'scout', pilotSkill: 2, thrust: 2 },
    { id: 'trader', pilotSkill: 1, thrust: 1 }
  ];

  const tracker = combat_lib.createTurnTrackerWithRolls(ships);

  assertTrue(tracker.turnOrder.length === 2, 'Should have 2 ships in order');
  assertTrue(tracker.turnOrder[0].initiative !== undefined, 'First ship should have initiative');
  assertTrue(tracker.turnOrder[1].initiative !== undefined, 'Second ship should have initiative');
  assertTrue(tracker.currentTurnIndex === 0, 'Should start at turn 0');
});

test('Turn tracker sorts ships by initiative', () => {
  const ships = [
    { id: 'scout', pilotSkill: 2, thrust: 2, initiative: 10 },
    { id: 'trader', pilotSkill: 1, thrust: 1, initiative: 15 }
  ];

  const tracker = combat_lib.createTurnTracker(ships);

  assertEqual(tracker.turnOrder[0].id, 'trader', 'Higher initiative should go first');
  assertEqual(tracker.turnOrder[1].id, 'scout', 'Lower initiative should go second');
});

test('Turn tracker with tactics rolls', () => {
  const ships = [
    { id: 'scout', pilotSkill: 2, thrust: 2, captain: { skill_tactics_naval: 2 } },
    { id: 'trader', pilotSkill: 1, thrust: 1 }
  ];

  const tracker = combat_lib.createTurnTrackerWithTactics(ships);

  assertTrue(tracker.turnOrder.length === 2, 'Should have 2 ships');
  assertTrue(tracker.turnOrder[0].initiative !== undefined, 'Should have initiative');
  // Scout might have tactics bonus if roll succeeded
});

// ========================================
// RESULTS
// ========================================
console.log('\n========================================');
console.log('STAGE 9.2 TEST RESULTS');
console.log('========================================');
console.log(`PASSED: ${passed}/16`);
console.log(`FAILED: ${failed}/16`);

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('========================================');
  console.log('Ready to implement Stage 9.2!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('========================================');
  process.exit(1);
}
