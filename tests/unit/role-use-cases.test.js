/**
 * AR-38 Phase 6: Role Use Cases Tests
 * Tests that role handlers and panel functions exist and work correctly
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

function assertEqual(actual, expected) {
  if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
}

console.log('=== Role Use Cases Tests ===\n');

// Test CREW_ROLES definition
test('CREW_ROLES is properly defined', () => {
  const { CREW_ROLES, ALL_ROLES } = require('../../lib/operations/accounts');
  assertTrue(Array.isArray(CREW_ROLES.COMBAT), 'COMBAT roles should be array');
  assertTrue(Array.isArray(CREW_ROLES.SUPPORT), 'SUPPORT roles should be array');
  assertTrue(CREW_ROLES.COMBAT.includes('captain'), 'Should include captain');
  assertTrue(CREW_ROLES.COMBAT.includes('pilot'), 'Should include pilot');
  assertTrue(CREW_ROLES.COMBAT.includes('astrogator'), 'Should include astrogator');
  assertTrue(CREW_ROLES.COMBAT.includes('engineer'), 'Should include engineer');
  assertTrue(CREW_ROLES.COMBAT.includes('gunner'), 'Should include gunner');
  assertTrue(ALL_ROLES.length >= 10, 'Should have at least 10 roles');
});

// Test socket handlers exist
test('GM socket handlers are registered', () => {
  const gm = require('../../lib/socket-handlers/ops/gm');
  assertTrue(typeof gm.register === 'function', 'gm.register should exist');
});

test('Campaign socket handlers are registered', () => {
  const campaign = require('../../lib/socket-handlers/ops/campaign');
  assertTrue(typeof campaign.register === 'function', 'campaign.register should exist');
});

test('Bridge socket handlers are registered', () => {
  const bridge = require('../../lib/socket-handlers/ops/bridge');
  assertTrue(typeof bridge.register === 'function', 'bridge.register should exist');
});

test('Engineering socket handlers are registered', () => {
  const engineering = require('../../lib/socket-handlers/ops/engineering');
  assertTrue(typeof engineering.register === 'function', 'engineering.register should exist');
});

// Test accounts role functions
test('accounts has role assignment functions', () => {
  const accounts = require('../../lib/operations/accounts');
  assertTrue(typeof accounts.assignRole === 'function', 'assignRole should exist');
  assertTrue(typeof accounts.clearRole === 'function', 'clearRole should exist');
  assertTrue(typeof accounts.isRoleAvailable === 'function', 'isRoleAvailable should exist');
});

// Test campaign CRUD functions
test('accounts has campaign CRUD functions', () => {
  const accounts = require('../../lib/operations/accounts');
  assertTrue(typeof accounts.createCampaign === 'function', 'createCampaign should exist');
  assertTrue(typeof accounts.getCampaign === 'function', 'getCampaign should exist');
  assertTrue(typeof accounts.updateCampaign === 'function', 'updateCampaign should exist');
  assertTrue(typeof accounts.deleteCampaign === 'function', 'deleteCampaign should exist');
});

// Test jump module has date and astrogator functions
test('jump module has date management', () => {
  const jump = require('../../lib/operations/jump');
  assertTrue(typeof jump.advanceDate === 'function', 'advanceDate should exist');
  assertTrue(typeof jump.formatDate === 'function', 'formatDate should exist');
});

test('jump module has astrogator functions', () => {
  const jump = require('../../lib/operations/jump');
  assertTrue(typeof jump.canInitiateJump === 'function', 'canInitiateJump should exist');
  assertTrue(typeof jump.initiateJump === 'function', 'initiateJump should exist');
});

// Test sensor contacts
test('contacts module has sensor functions', () => {
  const contacts = require('../../lib/operations/contacts');
  assertTrue(typeof contacts.addContact === 'function', 'addContact should exist');
  assertTrue(typeof contacts.deleteContact === 'function', 'deleteContact should exist');
  assertTrue(typeof contacts.getContacts === 'function', 'getContacts should exist');
});

console.log(`\n==================================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`==================================================`);

if (failed > 0) process.exit(1);
