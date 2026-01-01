/**
 * Tests for EngineerEngine
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { EngineerEngine } = require('../../../lib/engine/roles/engineer-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('EngineerEngine', () => {
  let engine;
  let mockShip;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      hull: 30,
      maxHull: 40,
      power: 80,
      maxPower: 100,
      crew: { engineer: 2 },
      systems: {
        mDrive: { hits: 0 },
        powerPlant: { hits: 0 },
        sensors: { hits: 0 }
      }
    };

    mockRng = {
      roll1d6: () => 4,
      roll2d6: () => 9  // Success on 8+
    };

    eventBus = new EventBus();
    engine = new EngineerEngine(mockShip, { eventBus, rng: mockRng });
  });

  describe('constructor', () => {
    it('should set role to engineer', () => {
      assert.strictEqual(engine.role, 'engineer');
    });

    it('should have boost_power as default action', () => {
      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'boost_power');
    });
  });

  describe('boost_power action', () => {
    it('should increase power by 10% on success', () => {
      const result = engine.execute('boost_power');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.boosted, true);
      assert.strictEqual(result.boostAmount, 10);
      assert.strictEqual(mockShip.power, 90);
    });

    it('should mark ship as boosted', () => {
      engine.execute('boost_power');
      assert.strictEqual(mockShip.powerBoosted, true);
    });

    it('should fail check on low roll', () => {
      mockRng.roll2d6 = () => 4; // 4 + 2 = 6 < 8
      engine = new EngineerEngine(mockShip, { rng: mockRng });

      const result = engine.execute('boost_power');
      assert.strictEqual(result.boosted, false);
    });

    it('should not exceed 120% max power', () => {
      mockShip.power = 115;
      const result = engine.execute('boost_power');

      assert.ok(mockShip.power <= 120);
    });

    it('should not be available after boost', () => {
      engine.execute('boost_power');
      assert.strictEqual(engine.canBoostPower(), false);
    });
  });

  describe('damage_control action', () => {
    beforeEach(() => {
      mockShip.systems.mDrive = { hits: 2 };
    });

    it('should repair damaged system on success', () => {
      const result = engine.execute('damage_control', { system: 'mDrive' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.repaired, true);
      assert.strictEqual(result.system, 'mDrive');
    });

    it('should reduce system damage by 1', () => {
      engine.execute('damage_control', { system: 'mDrive' });
      assert.strictEqual(mockShip.systems.mDrive.hits, 1);
    });

    it('should auto-select most critical system', () => {
      mockShip.systems.sensors = { hits: 3 };  // More damaged
      const result = engine.execute('damage_control');

      assert.strictEqual(result.system, 'sensors');
    });

    it('should fail when no damaged systems', () => {
      mockShip.systems.mDrive.hits = 0;
      const result = engine.execute('damage_control');

      assert.strictEqual(result.success, false);
    });

    it('should not be available when no damage', () => {
      mockShip.systems = { mDrive: { hits: 0 } };
      assert.strictEqual(engine.hasDamagedSystems(), false);
    });
  });

  describe('emergency_power action', () => {
    it('should boost power immediately', () => {
      const result = engine.execute('emergency_power');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.boostAmount, 20);
      assert.strictEqual(mockShip.power, 100);
    });

    it('should add stress to power plant', () => {
      engine.execute('emergency_power');
      assert.strictEqual(mockShip.powerPlantStress, 1);
    });

    it('should accumulate stress', () => {
      engine.execute('emergency_power');
      engine.execute('emergency_power');
      assert.strictEqual(mockShip.powerPlantStress, 2);
    });

    it('should not be available at max stress', () => {
      mockShip.powerPlantStress = 3;
      assert.strictEqual(engine.canEmergencyPower(), false);
    });
  });

  describe('repair_hull action', () => {
    it('should restore hull on success', () => {
      const result = engine.execute('repair_hull');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.repaired, true);
      assert.strictEqual(result.hullRestored, 4); // mockRng returns 4
    });

    it('should update ship hull', () => {
      engine.execute('repair_hull');
      assert.strictEqual(mockShip.hull, 34); // 30 + 4
    });

    it('should not exceed max hull', () => {
      mockShip.hull = 39;
      engine.execute('repair_hull');
      assert.strictEqual(mockShip.hull, 40);
    });

    it('should not be available at max hull', () => {
      mockShip.hull = mockShip.maxHull;
      assert.strictEqual(engine.hasHullDamage(), false);
    });
  });

  describe('redistribute_power action', () => {
    beforeEach(() => {
      mockShip.powerAllocations = {
        weapons: 30,
        shields: 20,
        engines: 50
      };
    });

    it('should transfer power between systems', () => {
      const result = engine.execute('redistribute_power', {
        from: 'weapons',
        to: 'shields',
        amount: 10
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(mockShip.powerAllocations.weapons, 20);
      assert.strictEqual(mockShip.powerAllocations.shields, 30);
    });

    it('should fail with insufficient power', () => {
      const result = engine.execute('redistribute_power', {
        from: 'weapons',
        to: 'shields',
        amount: 50
      });

      assert.strictEqual(result.success, false);
    });

    it('should require all parameters', () => {
      const result = engine.execute('redistribute_power', { from: 'weapons' });
      assert.strictEqual(result.success, false);
    });
  });

  describe('getAvailableActions', () => {
    it('should include all actions for undamaged ship', () => {
      mockShip.systems.mDrive = { hits: 1 }; // Add some damage
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(ids.includes('boost_power'));
      assert.ok(ids.includes('damage_control'));
      assert.ok(ids.includes('emergency_power'));
      assert.ok(ids.includes('repair_hull'));
      assert.ok(ids.includes('redistribute_power'));
    });

    it('should exclude damage_control when no damage', () => {
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('damage_control'));
    });
  });

  describe('criticals array handling', () => {
    it('should detect damage from criticals array', () => {
      mockShip.criticals = [{ system: 'jDrive', severity: 2 }];
      assert.ok(engine.hasDamagedSystems());

      const damaged = engine.getDamagedSystems();
      assert.ok(damaged.includes('jDrive'));
    });

    it('should repair criticals', () => {
      mockShip.criticals = [{ system: 'jDrive', severity: 2 }];

      engine.execute('damage_control', { system: 'jDrive' });

      assert.strictEqual(mockShip.criticals[0].severity, 1);
    });
  });
});
