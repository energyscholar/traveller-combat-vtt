/**
 * Characters Module Tests (AUTORUN-9)
 * Tests for character CRUD and parsers
 */

const characters = require('../../lib/operations/characters');
const { db, generateId } = require('../../lib/operations/database');

// Test utilities
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

function assertDeepEqual(actual, expected, msg = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Test campaign ID
const TEST_CAMPAIGN_ID = `test_chars_${Date.now()}`;

// Setup/cleanup
function cleanup() {
  try {
    db.prepare('DELETE FROM characters WHERE campaign_id LIKE ?').run('test_chars_%');
    db.prepare('DELETE FROM campaigns WHERE id LIKE ?').run('test_chars_%');
  } catch (e) {
    // Ignore cleanup errors
  }
}

function setupTestCampaign() {
  cleanup();
  db.prepare(`
    INSERT INTO campaigns (id, name, gm_name, current_date, current_system)
    VALUES (?, ?, ?, ?, ?)
  `).run(TEST_CAMPAIGN_ID, 'Test Campaign', 'Test GM', '001-1105', 'Regina');
}

// ==================== Tests ====================

console.log('\n=== Characters Module Tests ===\n');

// Setup
setupTestCampaign();

// UPP Parser Tests
console.log('UPP Parser (6 tests):');

test('parseUPP parses basic UPP string', () => {
  const stats = characters.parseUPP('789A87');
  assertEqual(stats.str, 7);
  assertEqual(stats.dex, 8);
  assertEqual(stats.end, 9);
  assertEqual(stats.int, 10); // A = 10
  assertEqual(stats.edu, 8);
  assertEqual(stats.soc, 7);
});

test('parseUPP handles lowercase', () => {
  const stats = characters.parseUPP('789a87');
  assertEqual(stats.int, 10);
});

test('parseUPP parses 7-char UPP with PSI', () => {
  const stats = characters.parseUPP('789A87C');
  assertEqual(stats.psi, 12); // C = 12
});

test('parseUPP handles dashes and spaces', () => {
  const stats = characters.parseUPP('789-A87');
  assertEqual(stats.str, 7);
  assertEqual(stats.int, 10);
});

test('parseUPP returns null for invalid input', () => {
  assertEqual(characters.parseUPP(''), null);
  assertEqual(characters.parseUPP('12345'), null); // too short
  assertEqual(characters.parseUPP(null), null);
});

test('toUPP converts stats back to string', () => {
  const stats = { str: 7, dex: 8, end: 9, int: 10, edu: 8, soc: 7 };
  assertEqual(characters.toUPP(stats), '789A87');
});

// Skills Parser Tests
console.log('\nSkills Parser (5 tests):');

test('parseSkills handles dash format', () => {
  const skills = characters.parseSkills('Pilot-2, Gunnery-1, Vacc Suit-1');
  assertEqual(skills['Pilot'], 2);
  assertEqual(skills['Gunnery'], 1);
  assertEqual(skills['Vacc Suit'], 1);
});

test('parseSkills handles colon format', () => {
  const skills = characters.parseSkills('Pilot: 2, Gunnery: 1');
  assertEqual(skills['Pilot'], 2);
  assertEqual(skills['Gunnery'], 1);
});

test('parseSkills handles space format', () => {
  const skills = characters.parseSkills('Pilot 2, Gunnery 1');
  assertEqual(skills['Pilot'], 2);
  assertEqual(skills['Gunnery'], 1);
});

test('parseSkills handles parentheses format', () => {
  const skills = characters.parseSkills('Pilot (2), Gunnery (1)');
  assertEqual(skills['Pilot'], 2);
  assertEqual(skills['Gunnery'], 1);
});

test('parseSkills normalizes skill names', () => {
  const skills = characters.parseSkills('PILOT-2, gunnery-1');
  assertEqual(skills['Pilot'], 2);
  assertEqual(skills['Gunnery'], 1);
});

// Character CRUD Tests
console.log('\nCharacter CRUD (6 tests):');

let testCharId;

test('createCharacter creates a character', () => {
  const char = characters.createCharacter(TEST_CAMPAIGN_ID, {
    name: 'Marcus Cole',
    species: 'Human',
    stats: { str: 7, dex: 8, end: 9, int: 10, edu: 8, soc: 7 },
    skills: { Pilot: 2, Gunnery: 1 },
    credits: 10000
  });
  testCharId = char.id;
  assertEqual(char.name, 'Marcus Cole');
  assertEqual(char.str, 7);
  assertEqual(char.int, 10);
  assertEqual(char.skills.Pilot, 2);
  assertEqual(char.credits, 10000);
});

test('getCharacter retrieves character with parsed fields', () => {
  const char = characters.getCharacter(testCharId);
  assertTrue(char !== null);
  assertEqual(char.name, 'Marcus Cole');
  assertEqual(char.upp, '789A87');
  assertTrue(typeof char.skills === 'object');
});

test('getCharactersByCampaign returns all characters', () => {
  characters.createCharacter(TEST_CAMPAIGN_ID, { name: 'Second Character' });
  const chars = characters.getCharactersByCampaign(TEST_CAMPAIGN_ID);
  assertTrue(chars.length >= 2);
});

test('updateCharacter updates fields', () => {
  const updated = characters.updateCharacter(testCharId, {
    name: 'Marcus Cole Jr',
    credits: 50000
  });
  assertEqual(updated.name, 'Marcus Cole Jr');
  assertEqual(updated.credits, 50000);
});

test('exportCharacter returns clean JSON', () => {
  const exported = characters.exportCharacter(testCharId);
  assertTrue(exported.name === 'Marcus Cole Jr');
  assertTrue(exported.upp === '789A87');
  assertTrue(exported.skills.Pilot === 2);
  assertTrue(exported.id === undefined); // No internal ID
});

test('deleteCharacter removes character', () => {
  const result = characters.deleteCharacter(testCharId);
  assertTrue(result);
  assertEqual(characters.getCharacter(testCharId), null);
});

// Cleanup
cleanup();

// ==================== Summary ====================
console.log('\n==================================================');
console.log(`PASSED: ${passed}/${passed + failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
