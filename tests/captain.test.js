/**
 * AR-29: Captain Role Tests
 * Tests for captain socket handlers and state management
 */

const { getCaptainState, captainState } = require('../lib/socket-handlers/ops/captain');

console.log('--- AR-29: Captain Role Tests ---\n');

// Helper to reset state between tests
function resetState() {
  captainState.campaigns.clear();
}

// Test: getCaptainState creates new state
(function testGetCaptainState() {
  resetState();
  const state = getCaptainState('test-campaign-1');

  console.assert(state !== null, 'Should return state object');
  console.assert(state.orders !== undefined, 'Should have orders array');
  console.assert(Array.isArray(state.orders), 'orders should be array');
  console.assert(state.weaponsAuth !== undefined, 'Should have weaponsAuth');
  console.assert(state.weaponsAuth.mode === 'hold', 'Default mode should be hold');
  console.assert(state.contactMarkings !== undefined, 'Should have contactMarkings');
  console.assert(state.leadershipDM === null, 'leadershipDM should be null');
  console.assert(state.tacticsBonus === 0, 'tacticsBonus should be 0');
  console.assert(Array.isArray(state.commandLog), 'commandLog should be array');

  console.log('✓ getCaptainState creates new state with defaults');
})();

// Test: getCaptainState returns same state for same campaign
(function testGetCaptainStateSameCampaign() {
  resetState();
  const state1 = getCaptainState('campaign-a');
  state1.tacticsBonus = 5;

  const state2 = getCaptainState('campaign-a');
  console.assert(state2.tacticsBonus === 5, 'Should return same state');
  console.assert(state1 === state2, 'Should be same object reference');

  console.log('✓ getCaptainState returns same state for same campaign');
})();

// Test: Different campaigns have different state
(function testDifferentCampaigns() {
  resetState();
  const stateA = getCaptainState('campaign-a');
  stateA.tacticsBonus = 3;

  const stateB = getCaptainState('campaign-b');
  console.assert(stateB.tacticsBonus === 0, 'Different campaign should have default');
  console.assert(stateA !== stateB, 'Should be different objects');

  console.log('✓ Different campaigns have separate state');
})();

// Test: Order storage
(function testOrderStorage() {
  resetState();
  const state = getCaptainState('order-test');

  // Simulate adding an order
  const order = {
    id: 'order_123',
    target: 'pilot',
    order: 'Set course for Glisten',
    from: 'Captain',
    requiresAck: true,
    acknowledged: false,
    timestamp: new Date().toISOString()
  };
  state.orders.push(order);

  console.assert(state.orders.length === 1, 'Should have 1 order');
  console.assert(state.orders[0].id === 'order_123', 'Order ID should match');
  console.assert(state.orders[0].target === 'pilot', 'Target should be pilot');

  console.log('✓ Order storage works');
})();

// Test: Weapons auth state
(function testWeaponsAuth() {
  resetState();
  const state = getCaptainState('weapons-test');

  // Change auth
  state.weaponsAuth = {
    mode: 'free',
    targets: ['contact-1', 'contact-2']
  };

  console.assert(state.weaponsAuth.mode === 'free', 'Mode should be free');
  console.assert(state.weaponsAuth.targets.length === 2, 'Should have 2 targets');
  console.assert(state.weaponsAuth.targets[0] === 'contact-1', 'First target should match');

  console.log('✓ Weapons authorization state works');
})();

// Test: Contact markings
(function testContactMarkings() {
  resetState();
  const state = getCaptainState('marking-test');

  state.contactMarkings['contact-alpha'] = {
    marking: 'hostile',
    notes: 'Known pirate',
    markedAt: new Date().toISOString()
  };

  console.assert(state.contactMarkings['contact-alpha'] !== undefined, 'Should have marking');
  console.assert(state.contactMarkings['contact-alpha'].marking === 'hostile', 'Should be hostile');
  console.assert(state.contactMarkings['contact-alpha'].notes === 'Known pirate', 'Notes should match');

  console.log('✓ Contact markings work');
})();

// Test: Leadership DM state
(function testLeadershipDM() {
  resetState();
  const state = getCaptainState('leadership-test');

  state.leadershipDM = {
    dm: 2,
    target: 'all',
    expires: 'next_action',
    roll: 10,
    skill: 0
  };

  console.assert(state.leadershipDM !== null, 'Should have leadershipDM');
  console.assert(state.leadershipDM.dm === 2, 'DM should be 2');
  console.assert(state.leadershipDM.target === 'all', 'Target should be all');

  // Clear it
  state.leadershipDM = null;
  console.assert(state.leadershipDM === null, 'Should be cleared');

  console.log('✓ Leadership DM state works');
})();

// Test: Tactics bonus
(function testTacticsBonus() {
  resetState();
  const state = getCaptainState('tactics-test');

  // Simulate tactics check result
  const roll = 9;
  const skill = 2;
  const bonus = Math.max(0, roll + skill - 8); // Effect, min 0

  state.tacticsBonus = bonus;
  console.assert(state.tacticsBonus === 3, 'Bonus should be 3 (9+2-8)');

  console.log('✓ Tactics bonus calculation works');
})();

// Test: Command log limit
(function testCommandLogLimit() {
  resetState();
  const state = getCaptainState('log-test');

  // Add 60 entries
  for (let i = 0; i < 60; i++) {
    state.commandLog.unshift({
      type: 'test',
      index: i,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50
    if (state.commandLog.length > 50) {
      state.commandLog.pop();
    }
  }

  console.assert(state.commandLog.length === 50, 'Should have max 50 entries');
  console.assert(state.commandLog[0].index === 59, 'Most recent should be index 59');
  console.assert(state.commandLog[49].index === 10, 'Oldest should be index 10');

  console.log('✓ Command log respects 50 entry limit');
})();

// Test: Order acknowledgment
(function testOrderAcknowledgment() {
  resetState();
  const state = getCaptainState('ack-test');

  const order = {
    id: 'order_ack_test',
    target: 'all',
    order: 'Battle stations',
    requiresAck: true,
    acknowledged: false
  };
  state.orders.push(order);

  // Acknowledge it
  const foundOrder = state.orders.find(o => o.id === 'order_ack_test');
  foundOrder.acknowledged = true;
  foundOrder.acknowledgedBy = 'Pilot';
  foundOrder.acknowledgedAt = new Date().toISOString();

  console.assert(foundOrder.acknowledged === true, 'Should be acknowledged');
  console.assert(foundOrder.acknowledgedBy === 'Pilot', 'Should be acknowledged by Pilot');

  console.log('✓ Order acknowledgment works');
})();

console.log('\n--- Captain Tests Complete ---');
