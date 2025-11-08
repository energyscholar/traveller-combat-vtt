// Stage 8.5: Hull Damage & Criticals Tests
// TDD: Write tests FIRST, implement SECOND

const {
  checkCriticalHit,
  applyCriticalEffect,
  getCriticalSeverity,
  CRITICAL_LOCATIONS
} = require('../../lib/combat');

const { TestRunner, assertEqual, assertTrue, assertFalse } = require('../test-helpers');

const runner = new TestRunner('Stage 8.5: Hull Damage & Criticals');

function test(description, fn) {
  runner.test(description, fn);
}

runner.section('CRITICAL HIT DETECTION');

test('Critical at 90% hull threshold', () => {
  const ship = { hull: 18, maxHull: 20, critThresholds: [18, 16, 14, 12, 10, 8, 6, 4, 2] };
  const result = checkCriticalHit(ship, 20); // Was 20, now 18

  assertTrue(result.isCritical);
  assertEqual(result.threshold, 18);
});

test('Critical at 50% hull threshold', () => {
  const ship = { hull: 10, maxHull: 20, critThresholds: [18, 16, 14, 12, 10, 8, 6, 4, 2] };
  const result = checkCriticalHit(ship, 12); // Was 12, now 10

  assertTrue(result.isCritical);
  assertEqual(result.threshold, 10);
});

test('No critical if above threshold', () => {
  const ship = { hull: 19, maxHull: 20, critThresholds: [18, 16, 14, 12, 10, 8, 6, 4, 2] };
  const result = checkCriticalHit(ship, 20); // Was 20, now 19

  assertFalse(result.isCritical);
});

test('No critical if already below threshold', () => {
  const ship = { hull: 17, maxHull: 20, critThresholds: [18, 16, 14, 12, 10, 8, 6, 4, 2] };
  const result = checkCriticalHit(ship, 17); // Already at 17

  assertFalse(result.isCritical);
});

test('Multiple thresholds crossed in one hit', () => {
  const ship = { hull: 8, maxHull: 20, critThresholds: [18, 16, 14, 12, 10, 8, 6, 4, 2] };
  const result = checkCriticalHit(ship, 20); // Was 20, dropped to 8 (crossed multiple)

  assertTrue(result.isCritical);
  assertTrue(result.thresholdsCrossed >= 1);
});

runner.section('CRITICAL EFFECTS');

test('Critical has location', () => {
  const critical = applyCriticalEffect();

  assertTrue(critical.location !== undefined);
  assertTrue(CRITICAL_LOCATIONS.includes(critical.location));
});

test('Critical severity: Minor at high hull', () => {
  const ship = { hull: 18, maxHull: 20 };
  const severity = getCriticalSeverity(ship);

  assertEqual(severity, 'minor');
});

test('Critical severity: Major at medium hull', () => {
  const ship = { hull: 8, maxHull: 20 }; // 40% = major
  const severity = getCriticalSeverity(ship);

  assertEqual(severity, 'major');
});

test('Critical severity: Catastrophic at low hull', () => {
  const ship = { hull: 2, maxHull: 20 };
  const severity = getCriticalSeverity(ship);

  assertEqual(severity, 'catastrophic');
});

test('Critical has description', () => {
  const critical = applyCriticalEffect();

  assertTrue(critical.effect !== undefined);
  assertTrue(critical.effect.length > 0);
});

runner.section('CRITICAL TRACKING');

test('Critical added to ship criticals array', () => {
  const ship = { hull: 18, maxHull: 20, criticals: [] };
  const critical = applyCriticalEffect();

  ship.criticals.push(critical);
  assertEqual(ship.criticals.length, 1);
  assertEqual(ship.criticals[0].location, critical.location);
});

test('Multiple criticals accumulate', () => {
  const ship = { hull: 10, maxHull: 20, criticals: [] };

  ship.criticals.push(applyCriticalEffect());
  ship.criticals.push(applyCriticalEffect());

  assertEqual(ship.criticals.length, 2);
});

test('Criticals persist across rounds', () => {
  const ship = {
    hull: 10,
    maxHull: 20,
    criticals: [
      { location: 'hull', effect: 'Breach', severity: 'major' }
    ]
  };

  assertEqual(ship.criticals.length, 1);
  assertEqual(ship.criticals[0].location, 'hull');
});

runner.finish();
