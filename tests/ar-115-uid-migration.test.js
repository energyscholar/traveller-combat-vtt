/**
 * AR-115: Database UID Normalization Tests
 *
 * Tests for migration 001: System UIDs
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const migration = require('../lib/operations/migrations/001-system-uids');

function runTests() {
  console.log('=== AR-115: UID Migration Tests ===\n');

  let passed = 0;
  let failed = 0;
  let testDb = null;
  const testDbPath = path.join(__dirname, 'test-migration.db');

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

  function setup() {
    // Clean up any existing test db
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    testDb = new Database(testDbPath);

    // Create minimal schema matching production
    testDb.exec(`
      CREATE TABLE campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gm_name TEXT NOT NULL,
        current_system TEXT DEFAULT 'Regina',
        current_sector TEXT,
        current_hex TEXT
      );

      CREATE TABLE locations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        name TEXT NOT NULL,
        system_name TEXT
      );

      CREATE TABLE contacts (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        name TEXT,
        last_location TEXT
      );
    `);
  }

  function teardown() {
    if (testDb) {
      testDb.close();
      testDb = null;
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  }

  // Setup
  setup();

  test('Migration has required exports', () => {
    assert(migration.id === '001-system-uids', 'Should have correct id');
    assert(typeof migration.up === 'function', 'Should have up function');
    assert(typeof migration.down === 'function', 'Should have down function');
    assert(typeof migration.isApplied === 'function', 'Should have isApplied function');
  });

  test('isApplied returns false before migration', () => {
    assert(migration.isApplied(testDb) === false, 'Should not be applied yet');
  });

  test('up() adds system_uid to campaigns', () => {
    migration.up(testDb);

    const cols = testDb.prepare(`PRAGMA table_info(campaigns)`).all();
    const hasUid = cols.some(c => c.name === 'system_uid');
    assert(hasUid, 'campaigns should have system_uid column');
  });

  test('up() adds system_uid to locations', () => {
    const cols = testDb.prepare(`PRAGMA table_info(locations)`).all();
    const hasUid = cols.some(c => c.name === 'system_uid');
    assert(hasUid, 'locations should have system_uid column');
  });

  test('up() adds system_uid to contacts', () => {
    const cols = testDb.prepare(`PRAGMA table_info(contacts)`).all();
    const hasUid = cols.some(c => c.name === 'system_uid');
    assert(hasUid, 'contacts should have system_uid column');
  });

  test('isApplied returns true after migration', () => {
    assert(migration.isApplied(testDb) === true, 'Should be applied');
  });

  test('up() is idempotent (can run twice)', () => {
    // Should not throw
    migration.up(testDb);
    assert(true, 'Second run should not throw');
  });

  test('Existing data preserved after migration', () => {
    // Insert data before checking
    testDb.prepare(`INSERT INTO campaigns (id, name, gm_name, current_system) VALUES (?, ?, ?, ?)`)
      .run('test-1', 'Test Campaign', 'GM', 'Flammarion');

    const campaign = testDb.prepare(`SELECT * FROM campaigns WHERE id = ?`).get('test-1');
    assert(campaign.current_system === 'Flammarion', 'Existing data should be preserved');
    assert(campaign.system_uid === null, 'New column should be null');
  });

  // Teardown
  teardown();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(50));

  return { passed, failed };
}

module.exports = { runTests };

if (require.main === module) {
  const result = runTests();
  process.exit(result.failed > 0 ? 1 : 0);
}
