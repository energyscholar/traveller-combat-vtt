/**
 * AR-28: System Cache Tests
 * Tests for TravellerMap data caching service
 */

const systemCache = require('../lib/operations/system-cache');

// Test data
const SAMPLE_SEC_LINE = 'Caladbolg     1815 B365776-A  N  Ag Ri           A  903 Im K2 V          ';
const SAMPLE_SYSTEM = {
  name: 'Caladbolg',
  hex: '1815',
  uwp: 'B365776-A',
  starport: 'B',
  techLevel: 10,
  bases: 'N',
  tradeCodes: 'Ag Ri',
  zone: 'A',
  pbg: '903',
  allegiance: 'Im',
  stellar: 'K2 V'
};

console.log('--- System Cache Tests ---\n');

// Test: parseSecLine
(function testParseSecLine() {
  const result = systemCache.parseSecLine(SAMPLE_SEC_LINE);

  console.assert(result !== null, 'parseSecLine should return object');
  console.assert(result.name === 'Caladbolg', `Expected name 'Caladbolg', got '${result.name}'`);
  console.assert(result.hex === '1815', `Expected hex '1815', got '${result.hex}'`);
  console.assert(result.uwp === 'B365776-A', `Expected uwp 'B365776-A', got '${result.uwp}'`);
  console.assert(result.starport === 'B', `Expected starport 'B', got '${result.starport}'`);
  console.assert(result.techLevel === 10, `Expected techLevel 10, got ${result.techLevel}`);

  console.log('✓ parseSecLine parses SEC format correctly');
})();

// Test: parseSecLine with invalid input
(function testParseSecLineInvalid() {
  console.assert(systemCache.parseSecLine(null) === null, 'null should return null');
  console.assert(systemCache.parseSecLine('') === null, 'empty string should return null');
  console.assert(systemCache.parseSecLine('# Comment') === null, 'comment should return null');
  console.assert(systemCache.parseSecLine('Short') === null, 'short line should return null');

  console.log('✓ parseSecLine handles invalid input');
})();

// Test: hexDistance
(function testHexDistance() {
  // Same hex
  console.assert(systemCache.hexDistance('1815', '1815') === 0, 'Same hex should be 0');

  // Adjacent hexes
  console.assert(systemCache.hexDistance('1815', '1814') === 1, '1815 to 1814 should be 1');
  console.assert(systemCache.hexDistance('1815', '1816') === 1, '1815 to 1816 should be 1');
  console.assert(systemCache.hexDistance('1815', '1715') === 1, '1815 to 1715 should be 1');
  console.assert(systemCache.hexDistance('1815', '1915') === 1, '1815 to 1915 should be 1');

  // Farther hexes
  const dist2 = systemCache.hexDistance('1815', '1617');
  console.assert(dist2 >= 2 && dist2 <= 3, `1815 to 1617 should be 2-3, got ${dist2}`);

  console.log('✓ hexDistance calculates hex distances');
})();

// Test: getCacheStatus when not running
(function testCacheStatusIdle() {
  const status = systemCache.getCacheStatus();

  console.assert(status.running === false, 'Should not be running initially');
  console.assert(typeof status.processed === 'number', 'processed should be number');
  console.assert(typeof status.total === 'number', 'total should be number');

  console.log('✓ getCacheStatus returns idle status');
})();

// Test: getCacheStats
(function testCacheStats() {
  const stats = systemCache.getCacheStats();

  console.assert(typeof stats.total === 'number', 'total should be number');
  console.assert(Array.isArray(stats.bySector), 'bySector should be array');

  console.log('✓ getCacheStats returns statistics');
})();

// Test: cacheSystem and getCachedSystem
(function testCacheAndRetrieve() {
  const testSystem = {
    hex: '9999',
    name: 'TestSystem',
    uwp: 'A000000-0',
    tradeCodes: 'Ba Va',
    starport: 'A',
    techLevel: 0,
    bases: '',
    zone: '',
    pbg: '000',
    allegiance: 'Na',
    stellar: 'M0 V'
  };

  // Cache it
  const cached = systemCache.cacheSystem('Test Sector', testSystem);
  console.assert(cached === true, 'cacheSystem should return true');

  // Retrieve it
  const retrieved = systemCache.getCachedSystem('Test Sector', '9999');
  console.assert(retrieved !== null, 'Should retrieve cached system');
  console.assert(retrieved.name === 'TestSystem', 'Name should match');
  console.assert(retrieved.hex === '9999', 'Hex should match');

  console.log('✓ cacheSystem and getCachedSystem work');
})();

// Test: isCached
(function testIsCached() {
  // Should be cached from previous test
  const cached = systemCache.isCached('Test Sector', '9999');
  console.assert(cached === true, 'Test system should be cached');

  // Non-existent should not be cached
  const notCached = systemCache.isCached('Fake Sector', '0000');
  console.assert(notCached === false, 'Non-existent should not be cached');

  console.log('✓ isCached detects cached systems');
})();

// Test: clearCache
(function testClearCache() {
  // Add a fresh system to clear
  systemCache.cacheSystem('ClearTest', { hex: '0001', name: 'ToClear' });
  console.assert(systemCache.getCachedSystem('ClearTest', '0001') !== null, 'Should exist before clear');

  // Clear specific sector
  const result = systemCache.clearCache('ClearTest');
  console.assert(typeof result.deleted === 'number', 'Should return deleted count');
  console.assert(result.deleted >= 1, 'Should have deleted at least 1');

  // Verify it's gone
  const retrieved = systemCache.getCachedSystem('ClearTest', '0001');
  console.assert(retrieved == null, 'System should be cleared');

  console.log('✓ clearCache removes cached data');
})();

// Test: stopCaching when not running (should be safe)
(function testStopCachingWhenIdle() {
  const result = systemCache.stopCaching('test');
  console.assert(result.success === true, 'stopCaching should succeed even when idle');

  console.log('✓ stopCaching safe when not running');
})();

console.log('\n--- System Cache Tests Complete ---');
