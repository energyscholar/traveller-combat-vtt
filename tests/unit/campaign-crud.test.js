/**
 * Campaign CRUD Tests (AR-37)
 * Tests for campaign create, read, update, delete operations
 */

const accounts = require('../../lib/operations/accounts');
const { db } = require('../../lib/operations/database');

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

function assertFalse(value, msg = '') {
  if (value) {
    throw new Error(`${msg} Expected false, got ${value}`);
  }
}

// Cleanup test campaigns
function cleanup() {
  try {
    db.prepare("DELETE FROM campaigns WHERE name LIKE 'Test Campaign%'").run();
    db.prepare("DELETE FROM campaigns WHERE name LIKE '%AR37%'").run();
  } catch (e) {
    // Ignore cleanup errors
  }
}

// ==================== Tests ====================

console.log('\n=== Campaign CRUD Tests ===\n');

cleanup();

let testCampaignId;

// CREATE Tests
console.log('--- Create ---\n');

test('createCampaign creates campaign with name and GM', () => {
  const campaign = accounts.createCampaign('Test Campaign AR37', 'Test GM');
  testCampaignId = campaign.id;
  assertEqual(campaign.name, 'Test Campaign AR37');
  assertEqual(campaign.gm_name, 'Test GM');
  assertTrue(campaign.id.length > 0);
});

test('createCampaign sets default date', () => {
  const campaign = accounts.getCampaign(testCampaignId);
  assertTrue(campaign.current_date !== null);
});

test('createCampaign generates unique IDs', () => {
  const c1 = accounts.createCampaign('Test Campaign AR37 Two', 'GM');
  const c2 = accounts.createCampaign('Test Campaign AR37 Three', 'GM');
  assertTrue(c1.id !== c2.id);
  // Cleanup
  db.prepare('DELETE FROM campaigns WHERE id IN (?, ?)').run(c1.id, c2.id);
});

// READ Tests
console.log('\n--- Read ---\n');

test('getCampaign retrieves by ID', () => {
  const campaign = accounts.getCampaign(testCampaignId);
  assertEqual(campaign.name, 'Test Campaign AR37');
});

test('getCampaign returns null for invalid ID', () => {
  const result = accounts.getCampaign('nonexistent');
  assertEqual(result, undefined);
});

test('getCampaignByCode retrieves by partial code', () => {
  const code = testCampaignId.substring(0, 8).toLowerCase();
  const campaign = accounts.getCampaignByCode(code);
  assertEqual(campaign.id, testCampaignId);
});

test('getAllCampaigns returns array', () => {
  const campaigns = accounts.getAllCampaigns();
  assertTrue(Array.isArray(campaigns));
  assertTrue(campaigns.length > 0);
});

// UPDATE Tests
console.log('\n--- Update ---\n');

test('updateCampaign updates name', () => {
  const updated = accounts.updateCampaign(testCampaignId, { name: 'Updated Name AR37' });
  assertEqual(updated.name, 'Updated Name AR37');
});

test('updateCampaign updates current_date', () => {
  const updated = accounts.updateCampaign(testCampaignId, { current_date: '1105-200 14:00' });
  assertEqual(updated.current_date, '1105-200 14:00');
});

test('updateCampaign updates current_system', () => {
  const updated = accounts.updateCampaign(testCampaignId, { current_system: 'Efate' });
  assertEqual(updated.current_system, 'Efate');
});

test('updateCampaign ignores disallowed fields', () => {
  const before = accounts.getCampaign(testCampaignId);
  accounts.updateCampaign(testCampaignId, { id: 'hacked', gm_name: 'Hacker' });
  const after = accounts.getCampaign(testCampaignId);
  assertEqual(after.id, before.id);
  assertEqual(after.gm_name, before.gm_name);
});

// DUPLICATE Tests
console.log('\n--- Duplicate ---\n');

test('duplicateCampaign creates copy with new ID', () => {
  const copy = accounts.duplicateCampaign(testCampaignId);
  assertTrue(copy.id !== testCampaignId);
  assertTrue(copy.name.includes('(Copy)'));
  assertEqual(copy.current_system, 'Efate');
  // Cleanup
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(copy.id);
});

test('duplicateCampaign throws for invalid ID', () => {
  let threw = false;
  try {
    accounts.duplicateCampaign('nonexistent');
  } catch (e) {
    threw = true;
    assertTrue(e.message.includes('not found'));
  }
  assertTrue(threw, 'Should throw error');
});

// DELETE Tests
console.log('\n--- Delete ---\n');

test('deleteCampaign removes campaign', () => {
  const temp = accounts.createCampaign('Test Campaign AR37 Delete', 'GM');
  accounts.deleteCampaign(temp.id);
  assertEqual(accounts.getCampaign(temp.id), undefined);
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
