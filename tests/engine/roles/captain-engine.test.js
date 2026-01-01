/**
 * Tests for CaptainEngine
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { CaptainEngine } = require('../../../lib/engine/roles/captain-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('CaptainEngine', () => {
  let engine;
  let mockShip;
  let mockCombat;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      hull: 40,
      thrust: 2,
      thrustRemaining: 2,
      crew: {
        tactics: 2,
        leadership: 1,
        pilot: 2
      }
    };

    mockCombat = {
      range: 'Medium',
      round: 1,
      phase: 'initiative'
    };

    mockRng = {
      roll1d6: () => 4,
      roll2d6: () => 9  // Success on 8+
    };

    eventBus = new EventBus();
    engine = new CaptainEngine(mockShip, {
      combat: mockCombat,
      eventBus,
      rng: mockRng
    });
  });

  describe('constructor', () => {
    it('should set role to captain', () => {
      assert.strictEqual(engine.role, 'captain');
    });

    it('should have tactics as default action', () => {
      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'tactics');
    });
  });

  describe('tactics action', () => {
    it('should apply tactics bonus on success', () => {
      const result = engine.execute('tactics');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.action, 'tactics');
      assert.ok(result.bonus > 0);
    });

    it('should store bonus on ship', () => {
      engine.execute('tactics');
      // Effect = 9 - 8 = 1
      assert.strictEqual(mockShip.tacticsBonus, 1);
    });

    it('should give zero bonus on failure', () => {
      mockRng.roll2d6 = () => 4; // 4 + 2 = 6 < 8
      engine = new CaptainEngine(mockShip, { rng: mockRng });

      const result = engine.execute('tactics');
      assert.strictEqual(result.bonus, 0);
    });
  });

  describe('leadership action', () => {
    it('should boost crew on success', () => {
      const result = engine.execute('leadership');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.boosted, true);
      assert.ok(result.bonus >= 1);
    });

    it('should mark as applied', () => {
      engine.execute('leadership');
      assert.strictEqual(mockShip.leadershipApplied, true);
    });

    it('should not be available twice per round', () => {
      engine.execute('leadership');

      const actions = engine.getAvailableActions();
      const leadership = actions.find(a => a.id === 'leadership');
      assert.ok(!leadership);
    });
  });

  describe('coordinate action', () => {
    it('should coordinate two roles on success', () => {
      const result = engine.execute('coordinate', {
        roles: ['pilot', 'gunner']
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.coordinated, true);
      assert.deepStrictEqual(result.roles, ['pilot', 'gunner']);
    });

    it('should store coordinated roles', () => {
      engine.execute('coordinate', { roles: ['pilot', 'gunner'] });

      assert.deepStrictEqual(mockShip.coordinatedRoles, ['pilot', 'gunner']);
      assert.strictEqual(mockShip.coordinationUsed, true);
    });

    it('should fail without two roles', () => {
      const result = engine.execute('coordinate', { roles: ['pilot'] });
      assert.strictEqual(result.success, false);
    });

    it('should not be available after use', () => {
      engine.execute('coordinate', { roles: ['pilot', 'gunner'] });
      assert.strictEqual(engine.canCoordinate(), false);
    });
  });

  describe('issue_order action', () => {
    it('should record order', () => {
      const result = engine.execute('issue_order', {
        role: 'pilot',
        order: 'close range'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.role, 'pilot');
      assert.strictEqual(result.order, 'close range');
    });

    it('should track orders on ship', () => {
      engine.execute('issue_order', { role: 'pilot', order: 'evade' });
      engine.execute('issue_order', { role: 'gunner', order: 'target engines' });

      assert.strictEqual(mockShip.orders.length, 2);
    });

    it('should fail without required params', () => {
      const result = engine.execute('issue_order', { role: 'pilot' });
      assert.strictEqual(result.success, false);
    });
  });

  describe('weapons_free action', () => {
    it('should enable weapons free', () => {
      const result = engine.execute('weapons_free');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.weaponsFree, true);
      assert.strictEqual(mockShip.weaponsFree, true);
    });
  });

  describe('weapons_hold action', () => {
    it('should disable weapons', () => {
      mockShip.weaponsFree = true;
      const result = engine.execute('weapons_hold');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.weaponsFree, false);
      assert.strictEqual(mockShip.weaponsFree, false);
    });
  });

  describe('evasive_all action', () => {
    it('should order ship-wide evasive', () => {
      const result = engine.execute('evasive_all');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.ordered, true);
      assert.strictEqual(mockShip.evasiveOrder, true);
    });
  });

  describe('ram action', () => {
    beforeEach(() => {
      mockCombat.range = 'Close';
    });

    it('should ram target at close range', () => {
      const target = { id: 'enemy', name: 'Pirate', hull: 30 };
      const result = engine.execute('ram', { target });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.action, 'ram');
      assert.ok(result.hit);
    });

    it('should deal damage to both ships on hit', () => {
      const target = { id: 'enemy', name: 'Pirate', hull: 30 };
      engine.execute('ram', { target });

      // Both ships should take damage
      assert.ok(target.hull < 30);
      assert.ok(mockShip.hull < 40);
    });

    it('should not be available at medium range', () => {
      mockCombat.range = 'Medium';
      assert.strictEqual(engine.canRam(), false);
    });

    it('should fail without target', () => {
      const result = engine.execute('ram');
      assert.strictEqual(result.success, false);
    });
  });

  describe('resetForRound', () => {
    it('should reset captain state', () => {
      mockShip.leadershipApplied = true;
      mockShip.coordinationUsed = true;
      mockShip.coordinatedRoles = ['pilot', 'gunner'];
      mockShip.tacticsBonus = 2;

      engine.resetForRound();

      assert.strictEqual(mockShip.leadershipApplied, false);
      assert.strictEqual(mockShip.coordinationUsed, false);
      assert.strictEqual(mockShip.coordinatedRoles, null);
      assert.strictEqual(mockShip.tacticsBonus, 0);
    });
  });

  describe('getAvailableActions', () => {
    it('should include command actions', () => {
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(ids.includes('tactics'));
      assert.ok(ids.includes('leadership'));
      assert.ok(ids.includes('coordinate'));
      assert.ok(ids.includes('issue_order'));
      assert.ok(ids.includes('weapons_free'));
      assert.ok(ids.includes('weapons_hold'));
    });

    it('should exclude ram at wrong range', () => {
      mockCombat.range = 'Long';
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('ram'));
    });
  });
});
