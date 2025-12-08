/**
 * AR-38 Phase 9: Subsector Map Visual Parity Tests
 * Tests that subsector map has TravellerMap-like styling
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

console.log('=== Subsector Visual Parity Tests ===\n');

const fs = require('fs');
const content = fs.readFileSync('public/operations/modules/subsector-map.js', 'utf8');

test('subsector-map has TravellerMap color scheme', () => {
  assertTrue(content.includes("background: '#000000'"), 'Should have black background');
  assertTrue(content.includes('imperial'), 'Should have imperial color');
  assertTrue(content.includes('nonAligned'), 'Should have non-aligned color');
  assertTrue(content.includes('amber'), 'Should have amber zone color');
  assertTrue(content.includes('red'), 'Should have red zone color');
});

test('subsector-map has display style support', () => {
  assertTrue(content.includes('displayStyle'), 'Should have displayStyle property');
  assertTrue(content.includes('STYLE_PRESETS'), 'Should have STYLE_PRESETS');
  assertTrue(content.includes('setDisplayStyle'), 'Should have setDisplayStyle function');
});

test('subsector-map has all TravellerMap styles', () => {
  assertTrue(content.includes("poster:"), 'Should have poster style');
  assertTrue(content.includes("atlas:"), 'Should have atlas style');
  assertTrue(content.includes("candy:"), 'Should have candy style');
  assertTrue(content.includes("terminal:"), 'Should have terminal style');
});

test('subsector-map has hex grid rendering', () => {
  assertTrue(content.includes('drawHex'), 'Should have drawHex function');
  assertTrue(content.includes('hexToPixel'), 'Should have hexToPixel function');
  assertTrue(content.includes('HEX_SIZE'), 'Should have HEX_SIZE constant');
});

test('subsector-map has system rendering', () => {
  assertTrue(content.includes('renderSectorMap'), 'Should have renderSectorMap function');
  assertTrue(content.includes('systemDot'), 'Should have system dot styling');
  assertTrue(content.includes('starport'), 'Should render starport');
});

test('subsector-map has allegiance colors', () => {
  assertTrue(content.includes("allegiance === 'Im'"), 'Should color Imperial systems');
  assertTrue(content.includes("allegiance === 'Na'"), 'Should color Non-aligned systems');
});

test('subsector-map has zone coloring', () => {
  assertTrue(content.includes("zone === 'A'"), 'Should check for Amber zone');
  assertTrue(content.includes("zone === 'R'"), 'Should check for Red zone');
});

test('subsector-map has base indicators', () => {
  assertTrue(content.includes('systemNaval'), 'Should have naval base color');
  assertTrue(content.includes('systemScout'), 'Should have scout base color');
  assertTrue(content.includes("bases.includes('N')"), 'Should check for naval base');
  assertTrue(content.includes("bases.includes('S')"), 'Should check for scout base');
});

console.log(`\n==================================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`==================================================`);

if (failed > 0) process.exit(1);
