/**
 * Tests for BaseRoleEngine
 *
 * Tests the shared action execution pattern used by all role engines.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { BaseRoleEngine } = require('../../../lib/engine/roles/base-role-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('BaseRoleEngine', () => {
  let engine;
  let mockShip;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      crew: {
        pilot: 2,
        gunnery: 1,
        tactics: 3,
        engineer: 1,
        electronics: 2,
        mechanic: 0
      }
    };

    // Deterministic RNG for testing
    mockRng = {
      roll1d6: () => 3,
      roll2d6: () => 7
    };

    eventBus = new EventBus();
    engine = new BaseRoleEngine('test', mockShip, { eventBus, rng: mockRng });
  });

  describe('constructor', () => {
    it('should initialize with role and ship', () => {
      assert.strictEqual(engine.role, 'test');
      assert.strictEqual(engine.ship, mockShip);
    });

    it('should create EventBus if not provided', () => {
      const e = new BaseRoleEngine('test', mockShip);
      assert.ok(e.eventBus instanceof EventBus);
    });

    it('should use provided EventBus', () => {
      assert.strictEqual(engine.eventBus, eventBus);
    });

    it('should use provided RNG', () => {
      assert.strictEqual(engine.rng, mockRng);
    });

    it('should define default skip action', () => {
      assert.ok(engine.actions.skip);
      assert.strictEqual(engine.actions.skip.label, 'Skip');
    });
  });

  describe('execute', () => {
    it('should execute skip action successfully', () => {
      const result = engine.execute('skip');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.skipped, true);
    });

    it('should return error for unknown action', () => {
      const result = engine.execute('nonexistent');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown action'));
    });

    it('should emit event on successful execution', () => {
      let emittedEvent = null;
      eventBus.subscribe('test:skip', (e) => { emittedEvent = e; });

      engine.execute('skip');

      assert.ok(emittedEvent);
      assert.strictEqual(emittedEvent.data.role, 'test');
      assert.strictEqual(emittedEvent.data.action, 'skip');
      assert.strictEqual(emittedEvent.data.ship, mockShip);
    });

    it('should respect canExecute check', () => {
      // Add action with canExecute that returns false
      engine.actions.blocked = {
        label: 'Blocked',
        canExecute: () => false,
        disabledReason: 'Not allowed',
        execute: () => ({ success: true })
      };

      const result = engine.execute('blocked');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Not allowed');
    });

    it('should pass params to action', () => {
      let receivedParams = null;
      engine.actions.paramTest = {
        label: 'Param Test',
        execute: (params) => {
          receivedParams = params;
          return { success: true };
        }
      };

      engine.execute('paramTest', { target: 'enemy', mode: 'fast' });
      assert.deepStrictEqual(receivedParams, { target: 'enemy', mode: 'fast' });
    });
  });

  describe('getAvailableActions', () => {
    beforeEach(() => {
      engine.actions = {
        available: {
          label: 'Available',
          description: 'Can execute',
          isDefault: true,
          execute: () => ({ success: true })
        },
        blocked: {
          label: 'Blocked',
          description: 'Cannot execute',
          canExecute: () => false,
          execute: () => ({ success: true })
        },
        conditional: {
          label: 'Conditional',
          description: 'Sometimes available',
          canExecute: () => true,
          execute: () => ({ success: true })
        }
      };
    });

    it('should return only available actions', () => {
      const actions = engine.getAvailableActions();
      assert.strictEqual(actions.length, 2);
      assert.ok(actions.find(a => a.id === 'available'));
      assert.ok(actions.find(a => a.id === 'conditional'));
      assert.ok(!actions.find(a => a.id === 'blocked'));
    });

    it('should include action metadata', () => {
      const actions = engine.getAvailableActions();
      const available = actions.find(a => a.id === 'available');
      assert.strictEqual(available.label, 'Available');
      assert.strictEqual(available.description, 'Can execute');
      assert.strictEqual(available.isDefault, true);
    });
  });

  describe('getAllActions', () => {
    beforeEach(() => {
      engine.actions = {
        available: {
          label: 'Available',
          execute: () => ({ success: true })
        },
        blocked: {
          label: 'Blocked',
          canExecute: () => false,
          disabledReason: 'Not allowed',
          execute: () => ({ success: true })
        }
      };
    });

    it('should return all actions with availability status', () => {
      const actions = engine.getAllActions();
      assert.strictEqual(actions.length, 2);

      const available = actions.find(a => a.id === 'available');
      assert.strictEqual(available.available, true);
      assert.strictEqual(available.disabledReason, null);

      const blocked = actions.find(a => a.id === 'blocked');
      assert.strictEqual(blocked.available, false);
      assert.strictEqual(blocked.disabledReason, 'Not allowed');
    });
  });

  describe('getDefaultAction', () => {
    it('should return default action if available', () => {
      engine.actions = {
        normal: {
          label: 'Normal',
          execute: () => ({ success: true })
        },
        defaultAction: {
          label: 'Default',
          isDefault: true,
          execute: () => ({ success: true })
        }
      };

      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'defaultAction');
    });

    it('should return null if no default', () => {
      engine.actions = {
        normal: {
          label: 'Normal',
          execute: () => ({ success: true })
        }
      };

      const def = engine.getDefaultAction();
      assert.strictEqual(def, null);
    });

    it('should not return blocked default', () => {
      engine.actions = {
        blockedDefault: {
          label: 'Blocked Default',
          isDefault: true,
          canExecute: () => false,
          execute: () => ({ success: true })
        }
      };

      const def = engine.getDefaultAction();
      assert.strictEqual(def, null);
    });
  });

  describe('performSkillCheck', () => {
    it('should use roll from RNG', () => {
      const result = engine.performSkillCheck('pilot');
      assert.strictEqual(result.roll, 7); // mockRng.roll2d6 returns 7
    });

    it('should get skill level from ship crew', () => {
      const result = engine.performSkillCheck('pilot');
      assert.strictEqual(result.skillLevel, 2);
    });

    it('should apply modifiers', () => {
      const result = engine.performSkillCheck('pilot', 8, [
        { name: 'Range', value: -2 },
        { name: 'Target size', value: 1 }
      ]);
      assert.strictEqual(result.totalDM, -1);
      assert.strictEqual(result.total, 7 + 2 + (-1)); // roll + skill + modifiers
    });

    it('should determine success against difficulty', () => {
      // roll 7 + pilot 2 = 9 vs 8 = success
      const success = engine.performSkillCheck('pilot', 8);
      assert.strictEqual(success.success, true);
      assert.strictEqual(success.effect, 1);

      // roll 7 + pilot 2 = 9 vs 10 = fail
      const fail = engine.performSkillCheck('pilot', 10);
      assert.strictEqual(fail.success, false);
      assert.strictEqual(fail.effect, -1);
    });

    it('should return 0 for unknown skill', () => {
      const result = engine.performSkillCheck('nonexistent');
      assert.strictEqual(result.skillLevel, 0);
    });
  });

  describe('getSkillLevel', () => {
    it('should get skill from crew', () => {
      assert.strictEqual(engine.getSkillLevel('pilot'), 2);
      assert.strictEqual(engine.getSkillLevel('tactics'), 3);
      assert.strictEqual(engine.getSkillLevel('mechanic'), 0);
    });

    it('should return 0 for missing skill', () => {
      assert.strictEqual(engine.getSkillLevel('unknown'), 0);
    });

    it('should handle missing crew object', () => {
      engine.ship.crew = undefined;
      assert.strictEqual(engine.getSkillLevel('pilot'), 0);
    });
  });

  describe('getState', () => {
    it('should return state snapshot', () => {
      engine.combat = { phase: 'attack', round: 3 };

      const state = engine.getState();
      assert.strictEqual(state.role, 'test');
      assert.strictEqual(state.shipId, 'ship-1');
      assert.strictEqual(state.shipName, 'Test Ship');
      assert.strictEqual(state.phase, 'attack');
      assert.strictEqual(state.round, 3);
      assert.ok(Array.isArray(state.availableActions));
    });

    it('should handle null combat state', () => {
      engine.combat = null;

      const state = engine.getState();
      assert.strictEqual(state.phase, null);
      assert.strictEqual(state.round, null);
    });
  });

  describe('subscribe', () => {
    it('should delegate to eventBus', () => {
      let called = false;
      engine.subscribe('test:skip', () => { called = true; });
      engine.execute('skip');
      assert.strictEqual(called, true);
    });

    it('should return unsubscribe function', () => {
      let callCount = 0;
      const unsub = engine.subscribe('test:skip', () => { callCount++; });

      engine.execute('skip');
      assert.strictEqual(callCount, 1);

      unsub();
      engine.execute('skip');
      assert.strictEqual(callCount, 1);
    });
  });
});

describe('Subclass Pattern', () => {
  class TestRoleEngine extends BaseRoleEngine {
    constructor(ship, options = {}) {
      super('testRole', ship, options);
    }

    defineActions() {
      const base = super.defineActions();
      return {
        ...base,
        customAction: {
          label: 'Custom Action',
          description: 'Test custom action',
          isDefault: true,
          execute: () => ({ success: true, custom: 'data' })
        },
        conditionalAction: {
          label: 'Conditional',
          canExecute: () => this.ship.power > 0,
          disabledReason: 'Insufficient power',
          execute: () => ({ success: true })
        }
      };
    }
  }

  it('should inherit base actions', () => {
    const engine = new TestRoleEngine({ id: 'test', power: 100 });
    assert.ok(engine.actions.skip);
    assert.ok(engine.actions.customAction);
  });

  it('should execute custom actions', () => {
    const engine = new TestRoleEngine({ id: 'test', power: 100 });
    const result = engine.execute('customAction');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.custom, 'data');
  });

  it('should emit events with correct role', () => {
    const eventBus = new EventBus();
    const engine = new TestRoleEngine({ id: 'test', power: 100 }, { eventBus });

    let emitted = null;
    eventBus.subscribe('testRole:customAction', (e) => { emitted = e; });

    engine.execute('customAction');
    assert.ok(emitted);
    assert.strictEqual(emitted.data.role, 'testRole');
  });

  it('should respect conditional canExecute referencing this', () => {
    const engineWithPower = new TestRoleEngine({ id: 'test', power: 100 });
    const result1 = engineWithPower.execute('conditionalAction');
    assert.strictEqual(result1.success, true);

    const engineNoPower = new TestRoleEngine({ id: 'test', power: 0 });
    const result2 = engineNoPower.execute('conditionalAction');
    assert.strictEqual(result2.success, false);
    assert.strictEqual(result2.error, 'Insufficient power');
  });
});
