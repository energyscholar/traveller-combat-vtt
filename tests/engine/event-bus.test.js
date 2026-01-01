/**
 * Event Bus Tests
 * Run with: node tests/engine/event-bus.test.js
 */

const { EventBus, EventTypes } = require('../../lib/engine/event-bus');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
  console.log('PASS:', message);
}

console.log('========================================');
console.log('EVENT BUS UNIT TESTS');
console.log('========================================\n');

// Test 1: Basic subscribe/publish
console.log('Test 1: Subscribe and publish');
{
  const bus = new EventBus();
  let received = null;

  bus.subscribe('test:event', (event) => {
    received = event;
  });

  bus.publish('test:event', { foo: 'bar' });

  assert(received !== null, 'Subscriber was called');
  assert(received.type === 'test:event', 'Event type correct');
  assert(received.data.foo === 'bar', 'Event data correct');
}

// Test 2: Multiple subscribers
console.log('\nTest 2: Multiple subscribers');
{
  const bus = new EventBus();
  let count = 0;

  bus.subscribe('test:event', () => count++);
  bus.subscribe('test:event', () => count++);
  bus.subscribe('test:event', () => count++);

  bus.publish('test:event', {});

  assert(count === 3, 'All subscribers called');
}

// Test 3: Event isolation
console.log('\nTest 3: Event isolation');
{
  const bus = new EventBus();
  let aCount = 0;
  let bCount = 0;

  bus.subscribe('event:a', () => aCount++);
  bus.subscribe('event:b', () => bCount++);

  bus.publish('event:a', {});

  assert(aCount === 1, 'Event A subscriber called');
  assert(bCount === 0, 'Event B subscriber not called');
}

// Test 4: Unsubscribe
console.log('\nTest 4: Unsubscribe');
{
  const bus = new EventBus();
  let count = 0;

  const unsub = bus.subscribe('test:event', () => count++);

  bus.publish('test:event', {});
  assert(count === 1, 'First publish received');

  unsub();

  bus.publish('test:event', {});
  assert(count === 1, 'After unsubscribe, not called');
}

// Test 5: Event logging
console.log('\nTest 5: Event logging');
{
  const bus = new EventBus();

  bus.publish('event:a', { x: 1 });
  bus.publish('event:b', { x: 2 });
  bus.publish('event:c', { x: 3 });

  assert(bus.eventCount === 3, 'All events logged');
}

// Test 6: Sequential IDs
console.log('\nTest 6: Sequential IDs');
{
  const bus = new EventBus();

  const e1 = bus.publish('event:a', {});
  const e2 = bus.publish('event:b', {});
  const e3 = bus.publish('event:c', {});

  assert(e1.id === 0, 'First event ID is 0');
  assert(e2.id === 1, 'Second event ID is 1');
  assert(e3.id === 2, 'Third event ID is 2');
}

// Test 7: Log size limit
console.log('\nTest 7: Log size limit');
{
  const bus = new EventBus({ maxLogSize: 5 });

  for (let i = 0; i < 10; i++) {
    bus.publish('test:event', { i });
  }

  assert(bus.eventCount === 5, 'Log size limited to 5');
  assert(bus.eventLog[0].data.i === 5, 'Oldest events dropped');
}

// Test 8: Replay
console.log('\nTest 8: Event replay');
{
  const bus = new EventBus();

  bus.publish('event:a', { x: 1 });
  bus.publish('event:b', { x: 2 });
  bus.publish('event:c', { x: 3 });

  const allEvents = bus.replay();
  assert(allEvents.length === 3, 'All events replayed');

  const fromId2 = bus.replay(2);
  assert(fromId2.length === 1, 'Replay from ID 2 returns 1 event');
  assert(fromId2[0].data.x === 3, 'Replayed event has correct data');
}

// Test 9: Replay with type filter
console.log('\nTest 9: Replay with type filter');
{
  const bus = new EventBus();

  bus.publish('attack:resolved', { damage: 5 });
  bus.publish('damage:applied', { amount: 5 });
  bus.publish('attack:resolved', { damage: 3 });
  bus.publish('phase:changed', { phase: 'attack' });

  const attacks = bus.replay(0, 'attack:resolved');

  assert(attacks.length === 2, 'Filtered to attack events');
  assert(attacks[0].data.damage === 5, 'First attack correct');
  assert(attacks[1].data.damage === 3, 'Second attack correct');
}

// Test 10: Wildcard subscriber
console.log('\nTest 10: Wildcard subscriber');
{
  const bus = new EventBus();
  const events = [];

  bus.subscribe('*', (event) => events.push(event.type));

  bus.publish('event:a', {});
  bus.publish('event:b', {});
  bus.publish('event:c', {});

  assert(events.length === 3, 'Wildcard received all events');
  assert(events[0] === 'event:a', 'First event type correct');
}

// Test 11: Subscribe many
console.log('\nTest 11: Subscribe many');
{
  const bus = new EventBus();
  const events = [];

  const unsub = bus.subscribeMany({
    'event:a': () => events.push('a'),
    'event:b': () => events.push('b'),
    'event:c': () => events.push('c')
  });

  bus.publish('event:b', {});
  bus.publish('event:a', {});

  assert(events.length === 2, 'Multiple subscriptions work');

  unsub();

  bus.publish('event:c', {});
  assert(events.length === 2, 'Unsubscribe all works');
}

// Test 12: Error handling in subscribers
console.log('\nTest 12: Error handling in subscribers');
{
  const bus = new EventBus();
  let secondCalled = false;

  bus.subscribe('test:event', () => {
    throw new Error('Handler error');
  });
  bus.subscribe('test:event', () => {
    secondCalled = true;
  });

  // Should not throw
  bus.publish('test:event', {});

  assert(secondCalled, 'Second handler called despite first throwing');
}

// Test 13: Reset
console.log('\nTest 13: Reset');
{
  const bus = new EventBus();
  let count = 0;

  bus.subscribe('test:event', () => count++);
  bus.publish('test:event', {});
  bus.publish('test:event', {});

  assert(count === 2, 'Before reset: 2 calls');
  assert(bus.eventCount === 2, 'Before reset: 2 events');

  bus.reset();

  bus.publish('test:event', {});

  assert(count === 2, 'After reset: handlers cleared');
  assert(bus.eventCount === 1, 'After reset: log cleared');
}

// Test 14: Subscriber count
console.log('\nTest 14: Subscriber count');
{
  const bus = new EventBus();

  bus.subscribe('event:a', () => {});
  bus.subscribe('event:a', () => {});
  bus.subscribe('event:b', () => {});

  assert(bus.subscriberCount('event:a') === 2, 'Event A has 2 subscribers');
  assert(bus.subscriberCount('event:b') === 1, 'Event B has 1 subscriber');
  assert(bus.subscriberCount('event:c') === 0, 'Event C has 0 subscribers');
}

// Test 15: EventTypes constants
console.log('\nTest 15: EventTypes constants');
{
  assert(EventTypes.ATTACK_RESOLVED === 'attack:resolved', 'ATTACK_RESOLVED defined');
  assert(EventTypes.DAMAGE_APPLIED === 'damage:applied', 'DAMAGE_APPLIED defined');
  assert(EventTypes.SHIP_DESTROYED === 'ship:destroyed', 'SHIP_DESTROYED defined');
  assert(EventTypes.PHASE_CHANGED === 'phase:changed', 'PHASE_CHANGED defined');
}

console.log('\n========================================');
console.log('ALL EVENT BUS TESTS PASSED');
console.log('========================================');
