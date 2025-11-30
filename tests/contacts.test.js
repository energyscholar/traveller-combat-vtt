/**
 * Contacts System Tests
 * Tests sensor contact CRUD operations and visibility
 */

const contacts = require('../lib/operations/contacts');
const { db, generateId } = require('../lib/operations/database');

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

function assertExists(value, msg = '') {
  if (value === null || value === undefined) {
    throw new Error(`${msg} Value is null/undefined`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`${msg} Expected true, got ${value}`);
  }
}

// ==================== Setup ====================

console.log('\n=== Contacts System Tests ===\n');
console.log('--- Contacts CRUD ---\n');

let testCampaignId = generateId();

// Create test campaign
db.prepare(`
  INSERT INTO campaigns (id, name, gm_name, current_date)
  VALUES (?, ?, ?, ?)
`).run(testCampaignId, 'Contact Test Campaign', 'Test GM', '1105-001 12:00');

// ==================== CRUD Tests ====================

test('addContact creates contact with defaults', () => {
  const contact = contacts.addContact(testCampaignId, {
    name: 'Test Ship',
    type: 'ship'
  });
  assertExists(contact);
  assertEqual(contact.name, 'Test Ship');
  assertEqual(contact.type, 'ship');
  assertEqual(contact.signature, 'normal');
  assertEqual(contact.range_band, 'adjacent');  // Default range_km=0 is adjacent
});

test('addContact calculates range band correctly', () => {
  const contact = contacts.addContact(testCampaignId, {
    name: 'Close Contact',
    type: 'debris',
    range_km: 5
  });
  assertEqual(contact.range_band, 'close');
});

test('getContact retrieves by ID', () => {
  const created = contacts.addContact(testCampaignId, {
    name: 'Retrieve Test',
    type: 'station'
  });
  const retrieved = contacts.getContact(created.id);
  assertEqual(retrieved.id, created.id);
  assertEqual(retrieved.name, 'Retrieve Test');
});

test('getContactsByCampaign returns all contacts', () => {
  // Clear existing
  contacts.clearCampaignContacts(testCampaignId);

  contacts.addContact(testCampaignId, { name: 'Contact 1' });
  contacts.addContact(testCampaignId, { name: 'Contact 2' });
  contacts.addContact(testCampaignId, { name: 'Contact 3' });

  const all = contacts.getContactsByCampaign(testCampaignId);
  assertEqual(all.length, 3);
});

test('updateContact updates fields correctly', () => {
  contacts.clearCampaignContacts(testCampaignId);
  const contact = contacts.addContact(testCampaignId, {
    name: 'Before Update',
    range_km: 100
  });

  const updated = contacts.updateContact(contact.id, {
    name: 'After Update',
    range_km: 5000
  });

  assertEqual(updated.name, 'After Update');
  assertEqual(updated.range_km, 5000);
  assertEqual(updated.range_band, 'medium');  // 5000 <= 10000 is medium
});

test('deleteContact removes contact', () => {
  const contact = contacts.addContact(testCampaignId, {
    name: 'To Delete'
  });

  const deleted = contacts.deleteContact(contact.id);
  assertTrue(deleted);

  const retrieved = contacts.getContact(contact.id);
  assertEqual(retrieved, null);
});

test('clearCampaignContacts removes all contacts', () => {
  contacts.clearCampaignContacts(testCampaignId);
  contacts.addContact(testCampaignId, { name: 'Clear 1' });
  contacts.addContact(testCampaignId, { name: 'Clear 2' });

  const cleared = contacts.clearCampaignContacts(testCampaignId);
  assertTrue(cleared > 0);

  const remaining = contacts.getContactsByCampaign(testCampaignId);
  assertEqual(remaining.length, 0);
});

// ==================== Visibility Tests ====================

console.log('\n--- Contacts Visibility ---\n');

const testShipId = 'test-ship-123';

test('getVisibleContacts returns all contacts when visible_to is all', () => {
  contacts.clearCampaignContacts(testCampaignId);

  contacts.addContact(testCampaignId, {
    name: 'Visible to All',
    visible_to: 'all'
  });

  const visible = contacts.getVisibleContacts(testCampaignId, testShipId);
  assertEqual(visible.length, 1);
  assertEqual(visible[0].name, 'Visible to All');
});

test('getVisibleContacts filters by ship ID', () => {
  contacts.clearCampaignContacts(testCampaignId);

  contacts.addContact(testCampaignId, {
    name: 'Only Ship 1',
    visible_to: 'ship-1'
  });
  contacts.addContact(testCampaignId, {
    name: 'Only Ship 2',
    visible_to: 'ship-2'
  });
  contacts.addContact(testCampaignId, {
    name: 'Visible to All',
    visible_to: 'all'
  });

  const ship1Contacts = contacts.getVisibleContacts(testCampaignId, 'ship-1');
  assertEqual(ship1Contacts.length, 2); // ship-1 specific + all

  const ship2Contacts = contacts.getVisibleContacts(testCampaignId, 'ship-2');
  assertEqual(ship2Contacts.length, 2); // ship-2 specific + all
});

// ==================== Range Band Tests ====================

console.log('\n--- Range Band Calculation ---\n');

test('getRangeBand returns adjacent for 0-1km', () => {
  assertEqual(contacts.getRangeBand(0), 'adjacent');
  assertEqual(contacts.getRangeBand(1), 'adjacent');
});

test('getRangeBand returns close for 1-10km', () => {
  assertEqual(contacts.getRangeBand(5), 'close');
  assertEqual(contacts.getRangeBand(10), 'close');
});

test('getRangeBand returns short for 10-1250km', () => {
  assertEqual(contacts.getRangeBand(100), 'short');
  assertEqual(contacts.getRangeBand(1250), 'short');
});

test('getRangeBand returns medium for 1250-10000km', () => {
  assertEqual(contacts.getRangeBand(5000), 'medium');
  assertEqual(contacts.getRangeBand(10000), 'medium');
});

test('getRangeBand returns long for 10000-25000km', () => {
  assertEqual(contacts.getRangeBand(15000), 'long');
  assertEqual(contacts.getRangeBand(25000), 'long');
});

test('getRangeBand returns veryLong for 25000-50000km', () => {
  assertEqual(contacts.getRangeBand(30000), 'veryLong');
  assertEqual(contacts.getRangeBand(50000), 'veryLong');
});

test('getRangeBand returns distant for >50000km', () => {
  assertEqual(contacts.getRangeBand(100000), 'distant');
  assertEqual(contacts.getRangeBand(1000000), 'distant');
});

// ==================== Cleanup ====================

contacts.clearCampaignContacts(testCampaignId);
db.prepare('DELETE FROM campaigns WHERE id = ?').run(testCampaignId);

// ==================== Results ====================

console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
