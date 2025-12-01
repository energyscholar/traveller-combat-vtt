/**
 * State Module Tests
 * Tests for connection, combat, and game state management
 */

const state = require('../../lib/state');

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

// ==================== Tests ====================

console.log('\n=== State Module Tests ===\n');

// Connection State Tests
console.log('Connection State (5 tests):');

test('getConnectionCount returns 0 initially', () => {
  state.resetConnectionCount();
  assertEqual(state.getConnectionCount(), 0);
});

test('incrementConnectionCount increments and returns new value', () => {
  state.resetConnectionCount();
  assertEqual(state.incrementConnectionCount(), 1);
  assertEqual(state.incrementConnectionCount(), 2);
  assertEqual(state.getConnectionCount(), 2);
});

test('connections Map stores and retrieves data', () => {
  state.clearConnections();
  state.setConnection('socket1', { id: 1, ship: 'scout' });
  const conn = state.getConnection('socket1');
  assertEqual(conn.id, 1);
  assertEqual(conn.ship, 'scout');
});

test('deleteConnection removes connection and rate limit data', () => {
  state.clearConnections();
  state.setConnection('socket2', { id: 2 });
  state.setSocketTimestamps('socket2', [Date.now()]);
  assertTrue(state.deleteConnection('socket2'));
  assertEqual(state.getConnection('socket2'), undefined);
  assertEqual(state.getSocketTimestamps('socket2').length, 0);
});

test('action timestamps track rate limiting data', () => {
  const socketId = 'socket3';
  const now = Date.now();
  state.setSocketTimestamps(socketId, [now, now + 100]);
  const timestamps = state.getSocketTimestamps(socketId);
  assertEqual(timestamps.length, 2);
});

// Combat State Tests
console.log('\nCombat State (4 tests):');

test('activeCombats Map stores and retrieves combats', () => {
  state.clearCombats();
  state.setCombat('combat1', { player1: 'a', player2: 'b' });
  const combat = state.getCombat('combat1');
  assertEqual(combat.player1, 'a');
  assertEqual(combat.player2, 'b');
});

test('updateCombatActivity updates lastActivity timestamp', () => {
  state.clearCombats();
  state.setCombat('combat2', { startTime: Date.now() });
  state.updateCombatActivity('combat2');
  const combat = state.getCombat('combat2');
  assertTrue(combat.lastActivity > 0);
});

test('trimCombatHistory keeps only last N rounds', () => {
  const combat = { history: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  state.trimCombatHistory(combat);
  assertEqual(combat.history.length, state.COMBAT_HISTORY_LIMIT);
  assertEqual(combat.history[0], 3); // First 2 trimmed
});

test('deleteCombat removes combat', () => {
  state.clearCombats();
  state.setCombat('combat3', {});
  assertTrue(state.deleteCombat('combat3'));
  assertEqual(state.getCombat('combat3'), undefined);
});

// Game State Tests
console.log('\nGame State (4 tests):');

test('shipState has scout and free_trader', () => {
  const shipState = state.getShipState();
  assertTrue(shipState.scout !== undefined);
  assertTrue(shipState.free_trader !== undefined);
  assertTrue(shipState.scout.hull > 0);
  assertTrue(shipState.free_trader.hull > 0);
});

test('gameState tracks rounds and turns', () => {
  const gameState = state.getGameState();
  assertTrue(gameState.currentRound !== undefined);
  assertTrue(gameState.initiative !== undefined);
  assertTrue(gameState.roundHistory !== undefined);
});

test('resetShipStates restores hull and position', () => {
  const shipState = state.getShipState();
  shipState.scout.hull = 5; // Damage it
  shipState.scout.position = { q: 0, r: 0 }; // Move it
  state.resetShipStates();
  assertEqual(shipState.scout.hull, shipState.scout.maxHull);
  assertEqual(shipState.scout.position.q, 2); // Reset position
});

test('resetGameState clears rounds and turns', () => {
  const gameState = state.getGameState();
  gameState.currentRound = 5;
  gameState.currentTurn = 'scout';
  gameState.roundHistory = [1, 2, 3];
  state.resetGameState();
  assertEqual(gameState.currentRound, 0);
  assertEqual(gameState.currentTurn, null);
  assertEqual(gameState.roundHistory.length, 0);
});

// ==================== Summary ====================

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
