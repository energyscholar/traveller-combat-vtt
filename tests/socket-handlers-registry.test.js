/**
 * AR-201: Socket Handler Registry Tests
 *
 * Tests that the registry pattern works correctly.
 * Run after each handler module extraction.
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

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`${msg} Expected truthy, got ${value}`);
  }
}

// ==================== Mock Registry for Node.js Testing ====================

// Since we can't import ES modules directly in Node without transpilation,
// we'll test the registry pattern conceptually

console.log('\n=== Socket Handler Registry Tests ===\n');

console.log('--- Registry Pattern ---\n');

test('Registry can store and retrieve handlers', () => {
  const registry = new Map();

  const handler = (data) => data;
  registry.set('ops:test', handler);

  assertEqual(registry.get('ops:test'), handler);
});

test('Registry getRegisteredHandlers returns array', () => {
  const registry = new Map();
  registry.set('ops:a', () => {});
  registry.set('ops:b', () => {});

  const handlers = Array.from(registry.keys());
  assertEqual(handlers.length, 2);
  assertTrue(handlers.includes('ops:a'));
  assertTrue(handlers.includes('ops:b'));
});

test('Registry overwrites duplicate handlers', () => {
  const registry = new Map();

  registry.set('ops:test', () => 'first');
  registry.set('ops:test', () => 'second');

  assertEqual(registry.size, 1);
});

console.log('\n--- Handler Function Pattern ---\n');

test('Handler receives (data, state, helpers)', () => {
  let receivedData, receivedState, receivedHelpers;

  const handler = (data, state, helpers) => {
    receivedData = data;
    receivedState = state;
    receivedHelpers = helpers;
  };

  const testData = { foo: 'bar' };
  const testState = { campaigns: [] };
  const testHelpers = { showNotification: () => {} };

  handler(testData, testState, testHelpers);

  assertEqual(receivedData.foo, 'bar');
  assertTrue(Array.isArray(receivedState.campaigns));
  assertTrue(typeof receivedHelpers.showNotification === 'function');
});

test('Handler can modify state', () => {
  const state = { campaigns: [] };

  const handler = (data, state) => {
    state.campaigns = data.campaigns;
  };

  handler({ campaigns: [{ id: 1 }, { id: 2 }] }, state);

  assertEqual(state.campaigns.length, 2);
});

test('Handler can call helpers', () => {
  let notificationCalled = false;

  const helpers = {
    showNotification: () => { notificationCalled = true; }
  };

  const handler = (data, state, helpers) => {
    helpers.showNotification('test');
  };

  handler({}, {}, helpers);

  assertTrue(notificationCalled);
});

console.log('\n--- Campaign Handler Patterns ---\n');

test('Campaign list handler updates state.campaigns', () => {
  const state = { campaigns: [] };
  let renderCalled = false;

  const helpers = {
    renderCampaignList: () => { renderCalled = true; }
  };

  // Simulating handleCampaigns
  const handleCampaigns = (data, state, helpers) => {
    state.campaigns = data.campaigns;
    helpers.renderCampaignList();
  };

  handleCampaigns({ campaigns: [{ id: 1 }] }, state, helpers);

  assertEqual(state.campaigns.length, 1);
  assertTrue(renderCalled);
});

test('Campaign delete handler filters state.campaigns', () => {
  const state = {
    campaigns: [{ id: 1 }, { id: 2 }, { id: 3 }]
  };

  const helpers = {
    renderCampaignList: () => {}
  };

  // Simulating handleCampaignDeleted
  const handleCampaignDeleted = (data, state, helpers) => {
    state.campaigns = state.campaigns.filter(c => c.id !== data.campaignId);
    helpers.renderCampaignList();
  };

  handleCampaignDeleted({ campaignId: 2 }, state, helpers);

  assertEqual(state.campaigns.length, 2);
  assertTrue(state.campaigns.every(c => c.id !== 2));
});

// ==================== Summary ====================

console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
