/**
 * AR-38 Phase 8: Places Feature Tests
 * Tests Places overlay functionality and view cycling
 */

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

function assertTrue(condition, msg) {
  if (!condition) throw new Error(msg || 'Expected truthy value');
}

console.log('=== Places Feature Tests ===\n');

// Note: Full browser tests would use puppeteer
// These are structural tests for the module

test('system-map module exists and has required exports', () => {
  // Check that the file can be loaded (would need ES module support for full test)
  const fs = require('fs');
  const content = fs.readFileSync('public/operations/modules/system-map.js', 'utf8');
  assertTrue(content.includes('function goToPlace'), 'goToPlace should exist');
  assertTrue(content.includes('function showPlacesOverlay'), 'showPlacesOverlay should exist');
  assertTrue(content.includes('function hidePlacesOverlay'), 'hidePlacesOverlay should exist');
  assertTrue(content.includes('getPlacesOverlayState'), 'getPlacesOverlayState should exist');
});

test('goToPlace has view cycling logic', () => {
  const fs = require('fs');
  const content = fs.readFileSync('public/operations/modules/system-map.js', 'utf8');
  assertTrue(content.includes('lastSelectedPlaceId'), 'Should track last selected place');
  assertTrue(content.includes('viewVariantIndex'), 'Should track view variant');
  assertTrue(content.includes('VIEW_ZOOM_LEVELS'), 'Should have zoom levels array');
});

test('VIEW_ZOOM_LEVELS has multiple levels', () => {
  const fs = require('fs');
  const content = fs.readFileSync('public/operations/modules/system-map.js', 'utf8');
  // Check that it has at least 3 zoom levels
  const match = content.match(/VIEW_ZOOM_LEVELS = \[([\d., ]+)\]/);
  assertTrue(match, 'VIEW_ZOOM_LEVELS should be defined');
  const levels = match[1].split(',').map(s => parseFloat(s.trim()));
  assertTrue(levels.length >= 3, 'Should have at least 3 zoom levels');
});

test('centerOnBodyWithVariant accepts zoom multiplier', () => {
  const fs = require('fs');
  const content = fs.readFileSync('public/operations/modules/system-map.js', 'utf8');
  assertTrue(content.includes('centerOnBodyWithVariant(body, zoomMultiplier)'),
    'Should have centerOnBodyWithVariant with zoomMultiplier param');
});

test('Places overlay has correct HTML structure', () => {
  const fs = require('fs');
  const content = fs.readFileSync('public/operations/modules/system-map.js', 'utf8');
  assertTrue(content.includes('class="place-item"'), 'Should have place-item class');
  assertTrue(content.includes('data-place-id='), 'Should have data-place-id attribute');
  assertTrue(content.includes('places-close'), 'Should have close button');
});

console.log(`\n==================================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`==================================================`);

if (failed > 0) process.exit(1);
