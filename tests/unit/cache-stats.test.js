/**
 * Cache Statistics Tests (AR-37)
 * Tests cache hit rate tracking
 */

const cache = require('../../lib/operations/system-cache');

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

console.log('\n=== Cache Statistics Tests ===\n');

// Reset before tests
cache.resetCacheStats();

test('getCacheHitStats returns stats object', () => {
  const stats = cache.getCacheHitStats();
  assertTrue(typeof stats === 'object');
  assertTrue('hits' in stats);
  assertTrue('misses' in stats);
  assertTrue('requests' in stats);
  assertTrue('hitRate' in stats);
});

test('resetCacheStats clears all counters', () => {
  cache.resetCacheStats();
  const stats = cache.getCacheHitStats();
  assertEqual(stats.hits, 0);
  assertEqual(stats.misses, 0);
  assertEqual(stats.requests, 0);
});

test('getCachedSystem increments miss on miss', () => {
  cache.resetCacheStats();
  cache.getCachedSystem('NonExistent', '0101');
  const stats = cache.getCacheHitStats();
  assertEqual(stats.misses, 1);
  assertEqual(stats.requests, 1);
});

test('hitRate calculates correctly', () => {
  cache.resetCacheStats();
  // Force 3 misses
  cache.getCachedSystem('Test', '0101');
  cache.getCachedSystem('Test', '0102');
  cache.getCachedSystem('Test', '0103');
  const stats = cache.getCacheHitStats();
  assertEqual(stats.hitRate, '0.0%');
});

console.log('\n==================================================');
console.log(`PASSED: ${passed}/${passed + failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
