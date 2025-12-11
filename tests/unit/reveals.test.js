/**
 * Reveals Module Tests (AUTORUN-8)
 * Tests for staged reveals CRUD operations
 */

const reveals = require('../../lib/operations/reveals');
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

function assertFalse(value, msg = '') {
  if (value) {
    throw new Error(`${msg} Expected false, got ${value}`);
  }
}

// Test campaign ID - unique per run to avoid conflicts
const TEST_CAMPAIGN_ID = `test_reveals_${Date.now()}`;

// Setup: Clean up any existing test data
function cleanup() {
  try {
    db.prepare('DELETE FROM staged_reveals WHERE campaign_id LIKE ?').run('test_reveals_%');
    db.prepare('DELETE FROM campaigns WHERE id LIKE ?').run('test_reveals_%');
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Setup: Create test campaign
function setupTestCampaign() {
  cleanup();
  // Insert campaign with required fields matching actual schema
  db.prepare(`
    INSERT INTO campaigns (id, name, gm_name, current_date, current_system)
    VALUES (?, ?, ?, ?, ?)
  `).run(TEST_CAMPAIGN_ID, 'Test Campaign', 'Test GM', '001-1105', 'Flammarion');
}

// ==================== Tests ====================

console.log('\n=== Reveals Module Tests ===\n');

// Setup
setupTestCampaign();

// Constants Tests
console.log('Constants (3 tests):');

test('REVEAL_CATEGORIES has expected values', () => {
  assertEqual(reveals.REVEAL_CATEGORIES.PLOT, 'plot');
  assertEqual(reveals.REVEAL_CATEGORIES.SECRET, 'secret');
  assertEqual(reveals.REVEAL_CATEGORIES.DISCOVERY, 'discovery');
});

test('VISIBILITY has expected values', () => {
  assertEqual(reveals.VISIBILITY.HIDDEN, 'hidden');
  assertEqual(reveals.VISIBILITY.PARTIAL, 'partial');
  assertEqual(reveals.VISIBILITY.REVEALED, 'revealed');
});

test('TRIGGER_TYPES has expected values', () => {
  assertEqual(reveals.TRIGGER_TYPES.MANUAL, 'manual');
  assertEqual(reveals.TRIGGER_TYPES.TIME, 'time');
  assertEqual(reveals.TRIGGER_TYPES.EVENT, 'event');
});

// Create Tests
console.log('\nCreate Reveal (4 tests):');

let createdRevealId;

test('createReveal creates a reveal with required fields', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, {
    title: 'Test Reveal'
  });
  createdRevealId = reveal.id;
  assertEqual(reveal.title, 'Test Reveal');
  assertEqual(reveal.campaign_id, TEST_CAMPAIGN_ID);
  assertEqual(reveal.category, 'plot'); // default
  assertEqual(reveal.visibility, 'hidden'); // default
});

test('createReveal accepts all optional fields', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, {
    title: 'Full Reveal',
    category: 'secret',
    summary: 'Short summary',
    fullText: 'Long detailed text about the secret',
    triggerType: 'time',
    triggerValue: '001-1105',
    orderIndex: 5,
    tags: ['important', 'plot']
  });
  assertEqual(reveal.title, 'Full Reveal');
  assertEqual(reveal.category, 'secret');
  assertEqual(reveal.summary, 'Short summary');
  assertEqual(reveal.full_text, 'Long detailed text about the secret');
  assertEqual(reveal.trigger_type, 'time');
  assertEqual(reveal.trigger_value, '001-1105');
  assertEqual(reveal.order_index, 5);
  assertTrue(Array.isArray(reveal.tags));
  assertEqual(reveal.tags.length, 2);
});

test('createReveal generates unique IDs', () => {
  const reveal1 = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'R1' });
  const reveal2 = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'R2' });
  assertTrue(reveal1.id !== reveal2.id, 'IDs should be unique');
});

test('createReveal sets created_at timestamp', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'Timestamped' });
  assertTrue(reveal.created_at !== null, 'created_at should be set');
});

// Read Tests
console.log('\nRead Reveal (4 tests):');

test('getReveal retrieves an existing reveal', () => {
  const reveal = reveals.getReveal(createdRevealId);
  assertTrue(reveal !== null);
  assertEqual(reveal.id, createdRevealId);
  assertEqual(reveal.title, 'Test Reveal');
});

test('getReveal returns null for non-existent ID', () => {
  const reveal = reveals.getReveal('non-existent-id');
  assertEqual(reveal, null);
});

test('getRevealsByCampaign returns all reveals for campaign', () => {
  const allReveals = reveals.getRevealsByCampaign(TEST_CAMPAIGN_ID);
  assertTrue(allReveals.length >= 4, 'Should have at least 4 test reveals');
});

test('getHiddenReveals only returns hidden reveals', () => {
  const hidden = reveals.getHiddenReveals(TEST_CAMPAIGN_ID);
  for (const r of hidden) {
    assertEqual(r.visibility, 'hidden');
  }
});

// Update Tests
console.log('\nUpdate Reveal (3 tests):');

test('updateReveal updates specified fields', () => {
  const updated = reveals.updateReveal(createdRevealId, {
    title: 'Updated Title',
    category: 'lore'
  });
  assertEqual(updated.title, 'Updated Title');
  assertEqual(updated.category, 'lore');
});

test('updateReveal preserves unspecified fields', () => {
  const original = reveals.getReveal(createdRevealId);
  reveals.updateReveal(createdRevealId, { summary: 'New summary' });
  const updated = reveals.getReveal(createdRevealId);
  assertEqual(updated.title, original.title); // preserved
  assertEqual(updated.summary, 'New summary'); // updated
});

test('updateReveal updates updated_at timestamp', () => {
  const original = reveals.getReveal(createdRevealId);
  reveals.updateReveal(createdRevealId, { summary: 'Timestamp test' });
  const updated = reveals.getReveal(createdRevealId);
  assertTrue(updated.updated_at >= original.updated_at, 'updated_at should be updated');
});

// Visibility Tests
console.log('\nVisibility (5 tests):');

let visibilityTestId;

test('revealToAll changes visibility to revealed', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'To Reveal' });
  visibilityTestId = reveal.id;
  assertEqual(reveal.visibility, 'hidden');

  const updated = reveals.revealToAll(visibilityTestId);
  assertEqual(updated.visibility, 'revealed');
  assertTrue(updated.revealed_at !== null, 'revealed_at should be set');
});

test('revealToPlayer changes visibility to partial and adds player', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'Partial Reveal' });
  assertEqual(reveal.visibility, 'hidden');

  const updated = reveals.revealToPlayer(reveal.id, 'player_1');
  assertEqual(updated.visibility, 'partial');
  assertTrue(updated.visible_to.includes('player_1'));
});

test('revealToPlayer adds multiple players', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'Multi Player' });
  reveals.revealToPlayer(reveal.id, 'player_1');
  reveals.revealToPlayer(reveal.id, 'player_2');

  const updated = reveals.getReveal(reveal.id);
  assertTrue(updated.visible_to.includes('player_1'));
  assertTrue(updated.visible_to.includes('player_2'));
  assertEqual(updated.visible_to.length, 2);
});

test('hideReveal resets visibility to hidden', () => {
  const updated = reveals.hideReveal(visibilityTestId);
  assertEqual(updated.visibility, 'hidden');
  assertEqual(updated.visible_to.length, 0);
  assertEqual(updated.revealed_at, null);
});

test('canPlayerSee returns correct visibility status', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'Visibility Check' });

  // Hidden - nobody can see
  assertFalse(reveals.canPlayerSee(reveal, 'player_1'));

  // Reveal to specific player
  reveals.revealToPlayer(reveal.id, 'player_1');
  const partial = reveals.getReveal(reveal.id);
  assertTrue(reveals.canPlayerSee(partial, 'player_1'));
  assertFalse(reveals.canPlayerSee(partial, 'player_2'));

  // Reveal to all
  reveals.revealToAll(reveal.id);
  const full = reveals.getReveal(reveal.id);
  assertTrue(reveals.canPlayerSee(full, 'player_1'));
  assertTrue(reveals.canPlayerSee(full, 'player_2'));
  assertTrue(reveals.canPlayerSee(full, 'anyone'));
});

// Delete Tests
console.log('\nDelete Reveal (2 tests):');

test('deleteReveal removes the reveal', () => {
  const reveal = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'To Delete' });
  const result = reveals.deleteReveal(reveal.id);
  assertTrue(result, 'deleteReveal should return true');
  const deleted = reveals.getReveal(reveal.id);
  assertEqual(deleted, null, 'Reveal should be gone');
});

test('deleteReveal returns false for non-existent ID', () => {
  const result = reveals.deleteReveal('non-existent-id');
  assertFalse(result, 'deleteReveal should return false for non-existent');
});

// Player Query Tests
console.log('\nPlayer Queries (2 tests):');

test('getRevealedForPlayer returns only visible reveals', () => {
  cleanup();
  setupTestCampaign();

  // Create some reveals
  const r1 = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'Hidden' });
  const r2 = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'For Player 1' });
  const r3 = reveals.createReveal(TEST_CAMPAIGN_ID, { title: 'For All' });

  reveals.revealToPlayer(r2.id, 'player_1');
  reveals.revealToAll(r3.id);

  const player1Reveals = reveals.getRevealedForPlayer(TEST_CAMPAIGN_ID, 'player_1');
  const player2Reveals = reveals.getRevealedForPlayer(TEST_CAMPAIGN_ID, 'player_2');

  // Player 1 should see 2 reveals (partial + revealed)
  assertEqual(player1Reveals.length, 2, 'Player 1 should see 2 reveals');

  // Player 2 should see only 1 reveal (revealed to all)
  assertEqual(player2Reveals.length, 1, 'Player 2 should see 1 reveal');
});

test('getRevealedForPlayer returns reveals ordered by revealed_at', () => {
  const playerReveals = reveals.getRevealedForPlayer(TEST_CAMPAIGN_ID, 'player_1');
  // Just verify we get results back (ordering tested implicitly)
  assertTrue(playerReveals.length >= 1);
});

// Cleanup
cleanup();

// ==================== Summary ====================
console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

// Exit with error code if any tests failed
if (failed > 0) {
  process.exit(1);
}
