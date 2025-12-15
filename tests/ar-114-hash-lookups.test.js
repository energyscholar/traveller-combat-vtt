/**
 * AR-114: Hash-Based System Lookups
 *
 * Tests O(1) lookup performance for star system index
 */

const starSystemLoader = require('../lib/operations/star-system-loader');

function runTests() {
  console.log('=== AR-114: Hash-Based Lookup Tests ===\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  // Clear cache before tests
  starSystemLoader.clearCache();

  test('getSystem returns system by ID', () => {
    const system = starSystemLoader.getSystem('flammarion');
    assert(system !== null, 'Should find flammarion');
    assert(system.name === 'Flammarion', `Expected Flammarion, got ${system.name}`);
  });

  test('getSystem returns null for unknown ID', () => {
    const system = starSystemLoader.getSystem('nonexistent-system-xyz');
    assert(system === null, 'Should return null for unknown system');
  });

  test('getSystemByHex returns system by hex coordinate', () => {
    const system = starSystemLoader.getSystemByHex('0930');
    assert(system !== null, 'Should find system at 0930');
    assert(system.name === 'Flammarion', `Expected Flammarion at 0930, got ${system?.name}`);
  });

  test('getSystemByHex returns null for unknown hex', () => {
    const system = starSystemLoader.getSystemByHex('9999');
    assert(system === null, 'Should return null for unknown hex');
  });

  test('getSystemByName returns system (case-insensitive)', () => {
    const lower = starSystemLoader.getSystemByName('flammarion');
    const upper = starSystemLoader.getSystemByName('FLAMMARION');
    const mixed = starSystemLoader.getSystemByName('FlAmMaRiOn');

    assert(lower !== null, 'lowercase lookup should work');
    assert(upper !== null, 'uppercase lookup should work');
    assert(mixed !== null, 'mixed case lookup should work');
    assert(lower.id === upper.id, 'All cases should return same system');
  });

  test('getSystemByName handles whitespace', () => {
    const system = starSystemLoader.getSystemByName('  flammarion  ');
    assert(system !== null, 'Should trim whitespace');
  });

  test('getSystemByName returns null for unknown name', () => {
    const system = starSystemLoader.getSystemByName('Unknown System XYZ');
    assert(system === null, 'Should return null for unknown name');
  });

  test('getSystemByName returns null for null/empty', () => {
    assert(starSystemLoader.getSystemByName(null) === null, 'null should return null');
    assert(starSystemLoader.getSystemByName('') === null, 'empty string should return null');
  });

  test('systemExists returns true for known system', () => {
    assert(starSystemLoader.systemExists('flammarion') === true, 'flammarion should exist');
  });

  test('systemExists returns false for unknown system', () => {
    assert(starSystemLoader.systemExists('nonexistent') === false, 'unknown should not exist');
  });

  test('clearCache clears all caches including hash maps', () => {
    // Load something first
    starSystemLoader.getSystem('flammarion');

    // Clear
    starSystemLoader.clearCache();

    // Should still work after clear (rebuilds on access)
    const system = starSystemLoader.getSystem('flammarion');
    assert(system !== null, 'Should rebuild cache after clear');
  });

  test('Multiple lookups are consistent', () => {
    const byId = starSystemLoader.getSystem('flammarion');
    const byHex = starSystemLoader.getSystemByHex('0930');
    const byName = starSystemLoader.getSystemByName('Flammarion');

    assert(byId.id === byHex.id, 'ID and hex lookup should match');
    assert(byId.id === byName.id, 'ID and name lookup should match');
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(50));

  return { passed, failed };
}

module.exports = { runTests };

// Run if executed directly
if (require.main === module) {
  const result = runTests();
  process.exit(result.failed > 0 ? 1 : 0);
}
