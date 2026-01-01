/**
 * Star System Generator Tests
 * Run with: node tests/engine/starsystem-generator.test.js
 * @see AR-240
 */

const {
  StarSystemGenerator,
  CELESTIAL_TYPES,
  STELLAR_TYPES,
  PLANET_COUNT_TABLE
} = require('../../lib/engine/starsystem-generator');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    failed++;
    return false;
  }
  console.log('PASS:', message);
  passed++;
  return true;
}

console.log('========================================');
console.log('STAR SYSTEM GENERATOR UNIT TESTS');
console.log('========================================\n');

// Test 1: Constructor
console.log('--- Constructor ---\n');
{
  const gen = new StarSystemGenerator();
  const val = gen.rng();
  assert(val >= 0 && val < 1, 'Default RNG produces 0-1 values');
}

{
  const gen1 = new StarSystemGenerator({ seed: 'test123' });
  const gen2 = new StarSystemGenerator({ seed: 'test123' });
  const v1 = gen1.rng();
  const v2 = gen2.rng();
  assert(v1 === v2, 'Seeded RNG produces reproducible values');
}

{
  const gen1 = new StarSystemGenerator({ seed: 'alpha' });
  const gen2 = new StarSystemGenerator({ seed: 'beta' });
  assert(gen1.rng() !== gen2.rng(), 'Different seeds produce different values');
}

// Test 2: Dice rolling
console.log('\n--- Dice Rolling ---\n');
{
  const gen = new StarSystemGenerator({ seed: 'dice' });
  let valid = true;
  for (let i = 0; i < 20; i++) {
    const val = gen.roll(6);
    if (val < 1 || val > 6) valid = false;
  }
  assert(valid, 'roll(6) returns 1-6');
}

{
  const gen = new StarSystemGenerator({ seed: '2d6test' });
  let valid = true;
  for (let i = 0; i < 20; i++) {
    const val = gen.roll2d6();
    if (val < 2 || val > 12) valid = false;
  }
  assert(valid, 'roll2d6() returns 2-12');
}

{
  const gen = new StarSystemGenerator({ seed: 'percent' });
  let valid = true;
  for (let i = 0; i < 20; i++) {
    const val = gen.rollPercent();
    if (val < 1 || val > 100) valid = false;
  }
  assert(valid, 'rollPercent() returns 1-100');
}

// Test 3: Planet count rolling
console.log('\n--- Planet Count ---\n');
{
  const gen = new StarSystemGenerator({ seed: 'planets' });
  const count = gen.rollPlanetCount('G');
  assert(count >= 1 && count <= 10, `Planet count for G star is valid (got ${count})`);
}

{
  // M/K stars should average more planets (run many trials)
  let mTotal = 0, aTotal = 0;
  for (let i = 0; i < 50; i++) {
    const genM = new StarSystemGenerator({ seed: `mstar${i}` });
    const genA = new StarSystemGenerator({ seed: `astar${i}` });
    mTotal += genM.rollPlanetCount('M');
    aTotal += genA.rollPlanetCount('A');
  }
  assert(mTotal > aTotal, `M stars have more planets than A stars (M avg: ${mTotal / 50}, A avg: ${aTotal / 50})`);
}

{
  // Binary systems have fewer planets
  let singleTotal = 0, binaryTotal = 0;
  for (let i = 0; i < 50; i++) {
    const gen = new StarSystemGenerator({ seed: `binary${i}` });
    singleTotal += gen.rollPlanetCount('G', false);
    binaryTotal += gen.rollPlanetCount('G', true);
  }
  assert(binaryTotal < singleTotal, 'Binary systems have fewer planets');
}

// Test 4: Full system generation
console.log('\n--- System Generation ---\n');
{
  const gen = new StarSystemGenerator({ seed: 'sol' });
  const system = gen.generate('G2');

  assert(system.stellarType === 'G2', 'Stellar type preserved');
  assert(system.primaryType === 'G', 'Primary type extracted');
  assert(Array.isArray(system.companions), 'Has companions array');
  assert(Array.isArray(system.planets), 'Has planets array');
  assert(Array.isArray(system.belts), 'Has belts array');
  assert(system.features.oortCloud, 'Has Oort cloud feature');
}

{
  const gen = new StarSystemGenerator({ seed: 'fields' });
  const system = gen.generate('K5');
  let valid = true;
  for (const planet of system.planets) {
    if (!planet.type || typeof planet.orbitAU !== 'number' || !planet.name) {
      valid = false;
    }
  }
  assert(valid, 'All planets have required fields');
}

{
  const gen = new StarSystemGenerator({ seed: 'orbits' });
  const system = gen.generate('G0');
  let ordered = true;
  for (let i = 1; i < system.planets.length; i++) {
    if (system.planets[i].orbitAU <= system.planets[i - 1].orbitAU) {
      ordered = false;
    }
  }
  assert(ordered, 'Planet orbits are in ascending order');
}

// Test 5: Stellar companions
console.log('\n--- Stellar Companions ---\n');
{
  let binaryCount = 0;
  const trials = 100;
  for (let i = 0; i < trials; i++) {
    const gen = new StarSystemGenerator({ seed: `binary${i}` });
    const companions = gen.rollStellarCompanion('G');
    if (companions.length > 0) binaryCount++;
  }
  const rate = binaryCount / trials;
  assert(rate > 0.3 && rate < 0.7, `Binary rate ~50% (got ${(rate * 100).toFixed(1)}%)`);
}

// Test 6: Debris belts
console.log('\n--- Debris Belts ---\n');
{
  let innerCount = 0, outerCount = 0;
  const trials = 100;
  for (let i = 0; i < trials; i++) {
    const gen = new StarSystemGenerator({ seed: `belt${i}` });
    const planets = gen.generatePlanets(5, 'G');
    const belts = gen.generateDebrisBelts(planets);

    if (belts.some(b => b.type === CELESTIAL_TYPES.DEBRIS_FIELD)) innerCount++;
    if (belts.some(b => b.type === CELESTIAL_TYPES.KUIPER_BELT)) outerCount++;
  }
  const innerRate = innerCount / trials;
  const outerRate = outerCount / trials;
  assert(innerRate > 0.1 && innerRate < 0.4, `Inner belt rate ~25% (got ${(innerRate * 100).toFixed(1)}%)`);
  assert(outerRate > 0.05 && outerRate < 0.3, `Outer belt rate ~17% (got ${(outerRate * 100).toFixed(1)}%)`);
}

// Test 7: Brown dwarf (rare)
console.log('\n--- Brown Dwarf ---\n');
{
  const gen = new StarSystemGenerator({ seed: 'bd' });
  const bd = gen.generateBrownDwarf();
  assert(bd.massJupiter >= 13 && bd.massJupiter <= 80, `Brown dwarf mass valid (got ${bd.massJupiter} Mj)`);
  assert(bd.type === 'brown_dwarf', 'Brown dwarf type correct');
}

{
  let bdCount = 0;
  const trials = 300;
  for (let i = 0; i < trials; i++) {
    const gen = new StarSystemGenerator({ seed: `bdrate${i}` });
    const system = gen.generate('G2');
    if (system.companions.some(c => c.type === 'brown_dwarf')) bdCount++;
  }
  const rate = bdCount / trials;
  assert(rate < 0.05, `Brown dwarf rate ~1% (got ${(rate * 100).toFixed(1)}%)`);
}

// Test 8: Trojan populations
console.log('\n--- Trojan Populations ---\n');
{
  const gen = new StarSystemGenerator({ seed: 'trojan' });
  const gasGiants = [
    { name: 'Jupiter', type: CELESTIAL_TYPES.GAS_GIANT, orbitAU: 5.2 }
  ];
  const trojans = gen.generateTrojanPopulations(gasGiants);

  // May or may not have trojans (40% chance), but if present, should be pairs
  if (trojans.length > 0) {
    assert(trojans.length % 2 === 0, 'Trojans come in L4/L5 pairs');
    assert(trojans.some(t => t.lagrangePoint === 'L4'), 'Has L4 trojans');
    assert(trojans.some(t => t.lagrangePoint === 'L5'), 'Has L5 trojans');
  } else {
    console.log('PASS: No trojans generated (40% chance per giant)');
    passed++;
  }
}

// Test 9: Hex-based generation
console.log('\n--- Hex-Based Generation ---\n');
{
  const gen1 = new StarSystemGenerator();
  const gen2 = new StarSystemGenerator();

  const sys1 = gen1.generateForHex('0101', 'G2');
  const sys2 = gen2.generateForHex('0101', 'G2');

  assert(sys1.planets.length === sys2.planets.length, 'Same hex produces same planet count');
  assert(sys1.companions.length === sys2.companions.length, 'Same hex produces same companion count');
}

{
  const gen = new StarSystemGenerator();
  const sys1 = gen.generateForHex('0101', 'G2');
  const sys2 = gen.generateForHex('0102', 'G2');

  // Check if at least some difference (not all exactly matching)
  let matchCount = 0;
  for (let i = 0; i < 10; i++) {
    const g = new StarSystemGenerator();
    const a = g.generateForHex(`01${i}1`, 'G2');
    const b = g.generateForHex(`01${i}2`, 'G2');
    if (a.planets.length === b.planets.length) matchCount++;
  }
  assert(matchCount < 10, 'Different hexes produce different systems');
}

// Test 10: Constants
console.log('\n--- Constants ---\n');
{
  assert(CELESTIAL_TYPES.PLANET, 'Has PLANET type');
  assert(CELESTIAL_TYPES.GAS_GIANT, 'Has GAS_GIANT type');
  assert(CELESTIAL_TYPES.DEBRIS_FIELD, 'Has DEBRIS_FIELD type');
  assert(CELESTIAL_TYPES.KUIPER_BELT, 'Has KUIPER_BELT type');
  assert(CELESTIAL_TYPES.BROWN_DWARF, 'Has BROWN_DWARF type');
}

{
  assert(STELLAR_TYPES.G, 'Has G stellar type');
  assert(STELLAR_TYPES.M, 'Has M stellar type');
  assert(STELLAR_TYPES.G.planetMod === 0, 'G star has neutral planet modifier');
  assert(STELLAR_TYPES.M.planetMod > 0, 'M star has positive planet modifier');
}

{
  let allPresent = true;
  for (let i = 2; i <= 12; i++) {
    if (!PLANET_COUNT_TABLE[i]) allPresent = false;
  }
  assert(allPresent, 'PLANET_COUNT_TABLE has entries for 2-12');
}

// Summary
console.log('\n========================================');
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
