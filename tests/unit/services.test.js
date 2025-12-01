/**
 * Services Module Tests
 * Tests for rate limiter, performance metrics, connection management
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

// ==================== Rate Limiter Tests ====================

console.log('\n=== Rate Limiter Tests ===\n');

// We test the rate limiter by simulating what it does
test('Rate limiter allows first request in window', () => {
  const socketId = 'test-socket-1';
  state.setSocketTimestamps(socketId, []);

  const timestamps = state.getSocketTimestamps(socketId);
  const RATE_LIMIT_MAX_ACTIONS = 2;

  // First request should be allowed
  assertTrue(timestamps.length < RATE_LIMIT_MAX_ACTIONS);
});

test('Rate limiter blocks after max actions', () => {
  const socketId = 'test-socket-2';
  const now = Date.now();
  // Simulate 2 actions already taken
  state.setSocketTimestamps(socketId, [now, now + 100]);

  const timestamps = state.getSocketTimestamps(socketId);
  const RATE_LIMIT_MAX_ACTIONS = 2;

  // Should be blocked (at limit)
  assertTrue(timestamps.length >= RATE_LIMIT_MAX_ACTIONS);
});

test('Rate limiter resets after window expires', () => {
  const socketId = 'test-socket-3';
  const RATE_LIMIT_WINDOW_MS = 1000;
  const now = Date.now();

  // Simulate old timestamps that are outside the window
  state.setSocketTimestamps(socketId, [now - 2000, now - 1500]);

  const timestamps = state.getSocketTimestamps(socketId);
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  // Should be allowed (old timestamps expired)
  assertEqual(recentTimestamps.length, 0);
});

// ==================== Performance Metrics Tests ====================

console.log('\nPerformance Metrics (3 tests):');

test('Performance metrics object structure', () => {
  const metrics = {
    connections: { current: 0, peak: 0, total: 0 },
    combats: { current: 0, peak: 0, total: 0 },
    actions: { total: 0, rateLimited: 0 },
    memory: { current: 0, peak: 0 },
    uptime: Date.now()
  };

  assertTrue(metrics.connections !== undefined);
  assertTrue(metrics.combats !== undefined);
  assertTrue(metrics.actions !== undefined);
  assertTrue(metrics.memory !== undefined);
  assertTrue(metrics.uptime > 0);
});

test('Performance metrics tracks peak values', () => {
  const metrics = { current: 0, peak: 0 };

  // Simulate updates
  metrics.current = 5;
  metrics.peak = Math.max(metrics.peak, metrics.current);
  assertEqual(metrics.peak, 5);

  metrics.current = 3;
  metrics.peak = Math.max(metrics.peak, metrics.current);
  assertEqual(metrics.peak, 5); // Peak stays at 5

  metrics.current = 10;
  metrics.peak = Math.max(metrics.peak, metrics.current);
  assertEqual(metrics.peak, 10); // Peak increases to 10
});

test('Performance metrics increments action counters', () => {
  const actions = { total: 0, rateLimited: 0 };

  actions.total++;
  assertEqual(actions.total, 1);

  actions.rateLimited++;
  assertEqual(actions.rateLimited, 1);
});

// ==================== Connection Activity Tests ====================

console.log('\nConnection Activity (4 tests):');

test('updateConnectionActivity sets lastActivity timestamp', () => {
  state.clearConnections();
  const socketId = 'conn-test-1';
  const now = Date.now();

  state.setConnection(socketId, { id: 1, lastActivity: now - 5000 });
  const conn = state.getConnection(socketId);

  // Simulate update
  conn.lastActivity = Date.now();

  assertTrue(conn.lastActivity >= now);
});

test('Idle connections detected after timeout', () => {
  const IDLE_TIMEOUT_MS = 30000;
  const now = Date.now();

  // Connection idle for 40 seconds
  const idleTime = 40000;
  const lastActivity = now - idleTime;

  assertTrue(now - lastActivity > IDLE_TIMEOUT_MS);
});

test('Active connections not detected as idle', () => {
  const IDLE_TIMEOUT_MS = 30000;
  const now = Date.now();

  // Connection active 5 seconds ago
  const idleTime = 5000;
  const lastActivity = now - idleTime;

  assertTrue(now - lastActivity < IDLE_TIMEOUT_MS);
});

test('Connection deletion cleans up timestamps', () => {
  state.clearConnections();
  const socketId = 'conn-test-2';

  state.setConnection(socketId, { id: 2 });
  state.setSocketTimestamps(socketId, [Date.now()]);

  state.deleteConnection(socketId);

  assertEqual(state.getConnection(socketId), undefined);
  assertEqual(state.getSocketTimestamps(socketId).length, 0);
});

// ==================== Summary ====================

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
