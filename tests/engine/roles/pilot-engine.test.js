/**
 * Tests for PilotEngine
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { PilotEngine, RANGE_BANDS, THRUST_PER_RANGE } = require('../../../lib/engine/roles/pilot-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('PilotEngine', () => {
  let engine;
  let mockShip;
  let mockCombat;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      thrust: 2,
      thrustRemaining: 2,
      crew: { pilot: 2 }
    };

    mockCombat = {
      range: 'Medium',
      round: 1,
      phase: 'manoeuvre'
    };

    mockRng = {
      roll1d6: () => 3,
      roll2d6: () => 7
    };

    eventBus = new EventBus();
    engine = new PilotEngine(mockShip, {
      combat: mockCombat,
      eventBus,
      rng: mockRng
    });
  });

  describe('constructor', () => {
    it('should set role to pilot', () => {
      assert.strictEqual(engine.role, 'pilot');
    });

    it('should have maintain as default action', () => {
      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'maintain');
    });
  });

  describe('maintain action', () => {
    it('should succeed with no thrust cost', () => {
      const result = engine.execute('maintain');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.action, 'maintain');
      assert.strictEqual(result.range, 'Medium');
    });

    it('should emit event', () => {
      let emitted = null;
      eventBus.subscribe('pilot:maintain', (e) => { emitted = e; });

      engine.execute('maintain');
      assert.ok(emitted);
      assert.strictEqual(emitted.data.action, 'maintain');
    });
  });

  describe('close action', () => {
    it('should reduce range by one band', () => {
      mockCombat.range = 'Long';
      const result = engine.execute('close');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.oldRange, 'Long');
      assert.strictEqual(result.newRange, 'Medium');
      assert.strictEqual(mockCombat.range, 'Medium');
    });

    it('should consume thrust', () => {
      mockCombat.range = 'Long';
      engine.execute('close');

      assert.strictEqual(mockShip.thrustRemaining, 2 - THRUST_PER_RANGE);
    });

    it('should fail at closest range', () => {
      mockCombat.range = 'Adjacent';
      const result = engine.execute('close');

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('closest range'));
    });

    it('should fail without thrust', () => {
      mockShip.thrustRemaining = 0;
      mockCombat.range = 'Long';
      const result = engine.execute('close');

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('thrust'));
    });

    it('should not be available at Adjacent', () => {
      mockCombat.range = 'Adjacent';
      assert.strictEqual(engine.canCloseRange(), false);
    });
  });

  describe('open action', () => {
    it('should increase range by one band', () => {
      mockCombat.range = 'Medium';
      const result = engine.execute('open');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.oldRange, 'Medium');
      assert.strictEqual(result.newRange, 'Long');
    });

    it('should fail at maximum range', () => {
      mockCombat.range = 'Distant';
      const result = engine.execute('open');

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('maximum range'));
    });
  });

  describe('evade action', () => {
    it('should enable evasive maneuvers', () => {
      const result = engine.execute('evade');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.defensePenalty, -2);
      assert.strictEqual(result.attackPenalty, -1);
      assert.strictEqual(mockShip.evasiveManeuvers, true);
    });

    it('should consume thrust', () => {
      engine.execute('evade');
      assert.strictEqual(mockShip.thrustRemaining, 1);
    });

    it('should fail without thrust', () => {
      mockShip.thrustRemaining = 0;
      const result = engine.execute('evade');

      assert.strictEqual(result.success, false);
    });
  });

  describe('flee action', () => {
    it('should attempt skill check at Long range', () => {
      mockCombat.range = 'Long';
      const result = engine.execute('flee');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.action, 'flee');
      assert.ok(result.check);
    });

    it('should escape on successful check', () => {
      mockCombat.range = 'Long';
      // roll 7 + pilot 2 = 9 >= 8 = success
      const result = engine.execute('flee');

      assert.strictEqual(result.escaped, true);
      assert.strictEqual(mockShip.fled, true);
    });

    it('should fail escape on failed check', () => {
      mockCombat.range = 'Long';
      mockRng.roll2d6 = () => 4; // 4 + 2 = 6 < 8
      engine = new PilotEngine(mockShip, { combat: mockCombat, rng: mockRng });

      const result = engine.execute('flee');
      assert.strictEqual(result.escaped, false);
    });

    it('should not be available at close range', () => {
      mockCombat.range = 'Close';
      assert.strictEqual(engine.canFlee(), false);
    });

    it('should be available at Very Long range', () => {
      mockCombat.range = 'Very Long';
      assert.strictEqual(engine.canFlee(), true);
    });
  });

  describe('getAvailableActions', () => {
    it('should include all actions when at medium range with thrust', () => {
      mockCombat.range = 'Medium';
      mockShip.thrustRemaining = 2;

      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(ids.includes('maintain'));
      assert.ok(ids.includes('close'));
      assert.ok(ids.includes('open'));
      assert.ok(ids.includes('evade'));
      assert.ok(ids.includes('skip'));
    });

    it('should exclude flee when not at Long range', () => {
      mockCombat.range = 'Medium';
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('flee'));
    });

    it('should exclude movement when no thrust', () => {
      mockShip.thrustRemaining = 0;
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('close'));
      assert.ok(!ids.includes('open'));
      assert.ok(!ids.includes('evade'));
    });
  });

  describe('RANGE_BANDS constant', () => {
    it('should have correct order', () => {
      assert.deepStrictEqual(RANGE_BANDS, [
        'Adjacent', 'Close', 'Short', 'Medium', 'Long', 'Very Long', 'Distant'
      ]);
    });
  });

  describe('thrust management', () => {
    it('should initialize thrustRemaining from thrust', () => {
      delete mockShip.thrustRemaining;
      mockShip.thrust = 3;
      engine = new PilotEngine(mockShip, { combat: mockCombat });

      assert.strictEqual(engine.getThrustAvailable(), 3);
    });

    it('should track thrust across multiple actions', () => {
      mockShip.thrust = 3;
      mockShip.thrustRemaining = 3;
      mockCombat.range = 'Long';

      engine.execute('close'); // -1 thrust
      assert.strictEqual(engine.getThrustAvailable(), 2);

      engine.execute('evade'); // -1 thrust
      assert.strictEqual(engine.getThrustAvailable(), 1);
    });
  });
});
