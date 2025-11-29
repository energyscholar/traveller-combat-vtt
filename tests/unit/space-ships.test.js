// Stage 8.1: Space Ship & Character Stats Tests
// TDD: Write tests FIRST, implement SECOND

const {
  calculateStatDM,
  getShipRegistry,
  createStandardCrew,
  validateShipName,
  calculateCritThresholds
} = require('../../lib/combat');

// Initialize ship registry
const registry = getShipRegistry();

// Helper to create ship instance for testing (provides crew/stance/criticals)
function getTestShip(shipId) {
  return registry.createShipInstance(shipId);
}

console.log('========================================');
console.log('STAGE 8.1: SPACE SHIPS & CHARACTER STATS');
console.log('========================================\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    passCount++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  ${error.message}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertArrayEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

console.log('--- CHARACTER STATS (10 tests) ---\n');

test('Stat DM calculation: DEX 3 = -1', () => {
  assertEqual(calculateStatDM(3), -1, 'DEX 3 should give DM -1');
});

test('Stat DM calculation: DEX 6 = 0', () => {
  assertEqual(calculateStatDM(6), 0, 'DEX 6 should give DM 0');
});

test('Stat DM calculation: DEX 9 = +1', () => {
  assertEqual(calculateStatDM(9), 1, 'DEX 9 should give DM +1');
});

test('Stat DM calculation: DEX 12 = +2', () => {
  assertEqual(calculateStatDM(12), 2, 'DEX 12 should give DM +2');
});

test('Stat DM calculation: DEX 15 = +3', () => {
  assertEqual(calculateStatDM(15), 3, 'DEX 15 should give DM +3');
});

test('Stat DM calculation: DEX 0 = -2', () => {
  assertEqual(calculateStatDM(0), -2, 'DEX 0 should give DM -2');
});

test('Character has full Traveller stats', () => {
  const crew = createStandardCrew('scout');
  const pilot = crew.find(c => c.role === 'pilot');

  assertTrue(pilot.stats, 'Should have stats object');
  assertTrue(pilot.stats.str !== undefined, 'Should have STR');
  assertTrue(pilot.stats.dex !== undefined, 'Should have DEX');
  assertTrue(pilot.stats.int !== undefined, 'Should have INT');
  assertTrue(pilot.stats.edu !== undefined, 'Should have EDU');
  assertTrue(pilot.stats.end !== undefined, 'Should have END');
  assertTrue(pilot.stats.soc !== undefined, 'Should have SOC');
});

test('Character has extended skills (tactics_naval, sensors, marine)', () => {
  const crew = createStandardCrew('scout');
  const pilot = crew.find(c => c.role === 'pilot');

  assertTrue(pilot.skills.tactics_naval !== undefined, 'Should have tactics_naval');
  assertTrue(pilot.skills.sensors !== undefined, 'Should have sensors');
  assertTrue(pilot.skills.marine !== undefined, 'Should have marine');
  assertTrue(pilot.skills.engineering !== undefined, 'Should have engineering');
});

test('Character has preferences object', () => {
  const crew = createStandardCrew('scout');
  const gunner = crew.find(c => c.role === 'gunner');

  assertTrue(gunner.preferences, 'Should have preferences object');
  assertTrue(gunner.preferences.defaultTurret !== undefined, 'Should have defaultTurret');
  assertTrue(gunner.preferences.defaultTarget !== undefined, 'Should have defaultTarget');
});

test('Stats validation (1-15 range)', () => {
  const crew = createStandardCrew('scout');
  const pilot = crew.find(c => c.role === 'pilot');

  Object.values(pilot.stats).forEach(stat => {
    assertTrue(stat >= 1 && stat <= 15, `Stat should be 1-15, got ${stat}`);
  });
});

console.log('\n--- SHIP MODEL (12 tests) ---\n');

test('Scout ship has required fields', () => {
  const scout = registry.getShip('scout');

  assertTrue(scout.id, 'Should have id');
  assertTrue(scout.type, 'Should have type');
  assertTrue(scout.name, 'Should have name');
  assertTrue(scout.hull !== undefined, 'Should have hull');
  assertTrue(scout.maxHull !== undefined, 'Should have maxHull');
  assertTrue(scout.armour !== undefined, 'Should have armour');
  assertTrue(scout.thrust !== undefined, 'Should have thrust');
});

test('Scout has turrets array', () => {
  const scout = registry.getShip('scout');

  assertTrue(Array.isArray(scout.turrets), 'Should have turrets array');
  assertTrue(scout.turrets.length > 0, 'Should have at least one turret');
});

test('Scout has crew assignment slots', () => {
  const scout = getTestShip('scout');

  assertTrue(scout.crew, 'Should have crew object');
  assertTrue(scout.crew.pilot !== undefined, 'Should have pilot slot');
  assertTrue(scout.crew.captain !== undefined, 'Should have captain slot');
  assertTrue(scout.crew.engineer !== undefined, 'Should have engineer slot');
  assertTrue(scout.crew.sensors !== undefined, 'Should have sensors slot');
  assertTrue(Array.isArray(scout.crew.gunners), 'Should have gunners array');
  assertTrue(Array.isArray(scout.crew.marines), 'Should have marines array');
});

test('Scout has stance', () => {
  const scout = getTestShip('scout');

  assertTrue(scout.stance, 'Should have stance');
  assertTrue(['hostile', 'friendly', 'neutral', 'disabled', 'destroyed'].includes(scout.stance),
    `Stance should be valid, got ${scout.stance}`);
});

test('Scout has criticals array', () => {
  const scout = getTestShip('scout');

  assertTrue(Array.isArray(scout.criticals), 'Should have criticals array');
  assertEqual(scout.criticals.length, 0, 'Should start with no crits');
});

test('Scout has crit thresholds pre-calculated', () => {
  const scout = registry.getShip('scout');

  assertTrue(Array.isArray(scout.critThresholds), 'Should have critThresholds array');
  assertTrue(scout.critThresholds.length > 0, 'Should have at least one threshold');

  // Thresholds should be at 90%, 80%, 70%... of maxHull
  const expected90 = Math.floor(scout.maxHull * 0.9);
  assertEqual(scout.critThresholds[0], expected90, `First threshold should be 90% of hull`);
});

test('Scout definition: hull=40, armour=4, thrust=2', () => {
  const scout = registry.getShip('scout');

  assertEqual(scout.maxHull, 40, 'Scout should have 40 hull');
  assertEqual(scout.hull, 40, 'Scout should start at full hull');
  assertEqual(scout.armour, 4, 'Scout should have 4 armour');
  assertEqual(scout.thrust, 2, 'Scout should have 2 thrust');
});

test('Scout has 1 triple turret with pulse_laser', () => {
  const scout = registry.getShip('scout');

  assertEqual(scout.turrets.length, 1, 'Scout should have 1 turret');
  assertEqual(scout.turrets[0].type, 'triple', 'Turret should be triple');
  assertTrue(scout.turrets[0].weapons.includes('pulse_laser'), 'Should have pulse_laser');
  assertTrue(scout.turrets[0].weapons.includes('sandcaster'), 'Should have sandcaster (stubbed)');
  assertTrue(scout.turrets[0].weapons.includes('missile_rack'), 'Should have missile_rack (stubbed)');
});

test('Free Trader definition: hull=80, armour=2, thrust=1', () => {
  const trader = registry.getShip('free_trader');

  assertEqual(trader.maxHull, 80, 'Free Trader should have 80 hull');
  assertEqual(trader.hull, 80, 'Free Trader should start at full hull');
  assertEqual(trader.armour, 2, 'Free Trader should have 2 armour');
  assertEqual(trader.thrust, 1, 'Free Trader should have 1 thrust');
});

test('Free Trader has 2 single turrets with beam_laser', () => {
  const trader = registry.getShip('free_trader');

  assertEqual(trader.turrets.length, 2, 'Free Trader should have 2 turrets');
  assertEqual(trader.turrets[0].type, 'single', 'Turret should be single');
  assertEqual(trader.turrets[1].type, 'single', 'Turret should be single');
  assertTrue(trader.turrets[0].weapons.includes('beam_laser'), 'Turret 1 should have beam_laser');
  assertTrue(trader.turrets[1].weapons.includes('beam_laser'), 'Turret 2 should have beam_laser');
});

test('Ship type validation', () => {
  assertTrue(registry.getShip('scout'), 'Scout should exist');
  assertTrue(registry.getShip('free_trader'), 'Free Trader should exist');
});

test('calculateCritThresholds generates correct array', () => {
  const thresholds = calculateCritThresholds(40);

  // For 40 hull: [36, 32, 28, 24, 20, 16, 12, 8, 4]
  assertArrayEqual(thresholds, [36, 32, 28, 24, 20, 16, 12, 8, 4],
    'Should generate 10% thresholds');
});

console.log('\n--- DEFAULT CREW (6 tests) ---\n');

test('Scout default crew: 1 pilot, 1 gunner, 1 engineer', () => {
  const crew = createStandardCrew('scout');

  const pilot = crew.filter(c => c.role === 'pilot');
  const gunner = crew.filter(c => c.role === 'gunner');
  const engineer = crew.filter(c => c.role === 'engineer');

  assertEqual(pilot.length, 1, 'Should have 1 pilot');
  assertEqual(gunner.length, 1, 'Should have 1 gunner');
  assertEqual(engineer.length, 1, 'Should have 1 engineer');
});

test('Free Trader default crew: 1 pilot, 2 gunners, 1 engineer', () => {
  const crew = createStandardCrew('free_trader');

  const pilot = crew.filter(c => c.role === 'pilot');
  const gunners = crew.filter(c => c.role === 'gunner');
  const engineer = crew.filter(c => c.role === 'engineer');

  assertEqual(pilot.length, 1, 'Should have 1 pilot');
  assertEqual(gunners.length, 2, 'Should have 2 gunners');
  assertEqual(engineer.length, 1, 'Should have 1 engineer');
});

test('Default crew has standard competence (skill 1-2)', () => {
  const crew = createStandardCrew('scout');
  const pilot = crew.find(c => c.role === 'pilot');

  assertTrue(pilot.skills.pilot >= 1 && pilot.skills.pilot <= 2,
    `Pilot skill should be 1-2, got ${pilot.skills.pilot}`);
});

test('Standard crew generation for any ship type', () => {
  const scoutCrew = createStandardCrew('scout');
  const traderCrew = createStandardCrew('free_trader');

  assertTrue(scoutCrew.length > 0, 'Scout should have crew');
  assertTrue(traderCrew.length > 0, 'Trader should have crew');
});

test('Crew has unique IDs', () => {
  const crew = createStandardCrew('scout');
  const ids = crew.map(c => c.id);
  const uniqueIds = new Set(ids);

  assertEqual(ids.length, uniqueIds.size, 'All crew should have unique IDs');
});

test('validateShipName sanitizes input (XSS protection)', () => {
  const clean = validateShipName('Deep Hope');
  assertEqual(clean, 'Deep Hope', 'Should allow clean names');

  const sanitized = validateShipName('<script>alert("xss")</script>');
  assertTrue(!sanitized.includes('<'), 'Should strip HTML tags');
  assertTrue(!sanitized.includes('>'), 'Should strip HTML tags');

  const long = validateShipName('A'.repeat(100));
  assertTrue(long.length <= 50, 'Should limit to 50 chars');
});

// Test summary
console.log('\n========================================');
console.log('STAGE 8.1 TEST RESULTS');
console.log('========================================');
console.log(`PASSED: ${passCount}/28`);
console.log(`FAILED: ${failCount}/28`);

if (failCount === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('========================================');
  console.log('Ready to implement Stage 8.1!');
} else {
  console.log(`\n❌ ${failCount} TEST(S) FAILED`);
  console.log('Fix the implementation before proceeding.');
  process.exit(1);
}
