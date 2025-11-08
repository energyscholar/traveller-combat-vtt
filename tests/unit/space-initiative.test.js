// Stage 8.3: Initiative & Turn Order Tests
// TDD: Write tests FIRST, implement SECOND

const {
  calculateInitiative,
  sortByInitiative,
  createTurnTracker,
  advanceTurn,
  isRoundComplete,
  resetRound
} = require('../../lib/combat');

const { TestRunner, assertEqual, assertTrue, assertFalse, assertArrayEqual } = require('../test-helpers');

const runner = new TestRunner('Stage 8.3: Initiative & Turn Order');

function test(description, fn) {
  runner.test(description, fn);
}

runner.section('INITIATIVE CALCULATION');

test('Initiative = Pilot skill + Thrust rating', () => {
  const ship = {
    pilotSkill: 2,
    thrust: 3
  };

  const initiative = calculateInitiative(ship);
  assertEqual(initiative, 5); // 2 + 3
});

test('Higher thrust gives higher initiative', () => {
  const fastShip = { pilotSkill: 1, thrust: 4 };
  const slowShip = { pilotSkill: 1, thrust: 1 };

  const fast = calculateInitiative(fastShip);
  const slow = calculateInitiative(slowShip);

  assertTrue(fast > slow);
});

test('Higher pilot skill gives higher initiative', () => {
  const skilledPilot = { pilotSkill: 3, thrust: 2 };
  const novicePilot = { pilotSkill: 0, thrust: 2 };

  const skilled = calculateInitiative(skilledPilot);
  const novice = calculateInitiative(novicePilot);

  assertTrue(skilled > novice);
});

test('Zero values handled correctly', () => {
  const ship = { pilotSkill: 0, thrust: 0 };
  const initiative = calculateInitiative(ship);
  assertEqual(initiative, 0);
});

test('Initiative stored on ship object', () => {
  const ship = { id: 'ship1', pilotSkill: 2, thrust: 3 };
  const initiative = calculateInitiative(ship);

  ship.initiative = initiative;
  assertEqual(ship.initiative, 5);
});

runner.section('TURN ORDER SORTING');

test('Ships sorted by initiative (high to low)', () => {
  const ships = [
    { id: 'slow', initiative: 2 },
    { id: 'fast', initiative: 5 },
    { id: 'medium', initiative: 3 }
  ];

  const sorted = sortByInitiative(ships);

  assertEqual(sorted[0].id, 'fast');   // 5
  assertEqual(sorted[1].id, 'medium'); // 3
  assertEqual(sorted[2].id, 'slow');   // 2
});

test('Equal initiative sorted by ID (consistent)', () => {
  const ships = [
    { id: 'ship_b', initiative: 3 },
    { id: 'ship_a', initiative: 3 }
  ];

  const sorted = sortByInitiative(ships);

  // Should be consistent (alphabetical by ID as tiebreaker)
  assertEqual(sorted[0].id, 'ship_a');
  assertEqual(sorted[1].id, 'ship_b');
});

test('Does not mutate original array', () => {
  const ships = [
    { id: 'ship1', initiative: 2 },
    { id: 'ship2', initiative: 5 }
  ];

  const original = [...ships];
  sortByInitiative(ships);

  assertEqual(ships[0].id, original[0].id);
});

runner.section('TURN TRACKING');

test('Create turn tracker for ships', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);

  assertEqual(tracker.currentTurn, 0);
  assertEqual(tracker.round, 1);
  assertEqual(tracker.turnOrder.length, 2);
  assertArrayEqual(tracker.acted, []);
});

test('Advance turn updates current ship', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  advanceTurn(tracker);

  assertEqual(tracker.currentTurn, 1);
  assertTrue(tracker.acted.includes('ship1'));
});

test('Advancing past last ship increments round', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  advanceTurn(tracker); // ship1 acts
  advanceTurn(tracker); // ship2 acts

  assertEqual(tracker.round, 2);
  assertEqual(tracker.currentTurn, 0);
  // acted array persists until resetRound is called
  assertEqual(tracker.acted.length, 2);
});

test('Get current ship from tracker', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  const currentShip = tracker.turnOrder[tracker.currentTurn];

  assertEqual(currentShip.id, 'ship1');
});

runner.section('ROUND COMPLETION');

test('Round not complete if ships remaining', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  advanceTurn(tracker); // ship1 acts

  assertFalse(isRoundComplete(tracker));
});

test('Round complete when all ships acted', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  advanceTurn(tracker); // ship1 acts
  advanceTurn(tracker); // ship2 acts

  assertTrue(isRoundComplete(tracker));
});

test('Reset round clears acted list', () => {
  const ships = [
    { id: 'ship1', initiative: 5 },
    { id: 'ship2', initiative: 3 }
  ];

  const tracker = createTurnTracker(ships);
  advanceTurn(tracker);

  resetRound(tracker);

  assertEqual(tracker.currentTurn, 0);
  assertArrayEqual(tracker.acted, []);
});

runner.finish();
