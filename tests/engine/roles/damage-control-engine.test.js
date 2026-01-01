/**
 * Tests for DamageControlEngine
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { DamageControlEngine } = require('../../../lib/engine/roles/damage-control-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('DamageControlEngine', () => {
  let engine;
  let mockShip;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      hull: 25,
      maxHull: 40,
      crew: { mechanic: 2 },
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
    engine = new DamageControlEngine(mockShip, { eventBus, rng: mockRng });
  });

  describe('constructor', () => {
    it('should set role to damage_control', () => {
      assert.strictEqual(engine.role, 'damage_control');
    });

    it('should have repair_hull as default action', () => {
      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'repair_hull');
    });
  });

  describe('repair_hull action', () => {
    it('should restore hull on success', () => {
      const result = engine.execute('repair_hull');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.repaired, true);
      assert.ok(result.hullRestored > 0);
    });

    it('should include effect bonus', () => {
      // Effect = 9 - 8 = 1, roll = 4, total = 5
      const result = engine.execute('repair_hull');
      assert.strictEqual(result.hullRestored, 5);
    });

    it('should update ship hull', () => {
      engine.execute('repair_hull');
      assert.strictEqual(mockShip.hull, 30); // 25 + 5
    });

    it('should not exceed max hull', () => {
      mockShip.hull = 38;
      engine.execute('repair_hull');
      assert.strictEqual(mockShip.hull, 40);
    });

    it('should not be available at max hull', () => {
      mockShip.hull = mockShip.maxHull;
      assert.strictEqual(engine.hasHullDamage(), false);
    });
  });

  describe('repair_system action', () => {
    beforeEach(() => {
      mockShip.systems.mDrive = { hits: 2 };
    });

    it('should repair damaged system', () => {
      const result = engine.execute('repair_system', { system: 'mDrive' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.repaired, true);
      assert.strictEqual(result.system, 'mDrive');
    });

    it('should reduce system damage', () => {
      engine.execute('repair_system', { system: 'mDrive' });
      assert.strictEqual(mockShip.systems.mDrive.hits, 1);
    });

    it('should auto-select priority system', () => {
      mockShip.systems.powerPlant = { hits: 1 };
      mockShip.systems.mDrive = { hits: 2 };

      // Power plant has higher priority
      const result = engine.execute('repair_system');
      assert.strictEqual(result.system, 'powerPlant');
    });

    it('should fail when no damaged systems', () => {
      mockShip.systems = { mDrive: { hits: 0 } };
      const result = engine.execute('repair_system');
      assert.strictEqual(result.success, false);
    });

    it('should handle higher difficulty for severe damage', () => {
      mockShip.systems.mDrive = { hits: 3, disabled: true };
      mockRng.roll2d6 = () => 7; // Would pass difficulty 8, but not 12

      engine = new DamageControlEngine(mockShip, { rng: mockRng });
      const result = engine.execute('repair_system', { system: 'mDrive' });

      // Severity 3 = difficulty 12, should fail
      assert.strictEqual(result.repaired, false);
    });
  });

  describe('firefighting action', () => {
    beforeEach(() => {
      mockShip.fires = [
        { location: 'engineering', intensity: 2 }
      ];
    });

    it('should reduce fire intensity', () => {
      const result = engine.execute('firefighting');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.location, 'engineering');
      assert.strictEqual(mockShip.fires[0].intensity, 1);
    });

    it('should extinguish at intensity 1', () => {
      mockShip.fires[0].intensity = 1;
      const result = engine.execute('firefighting');

      assert.strictEqual(result.extinguished, true);
      assert.strictEqual(mockShip.fires.length, 0);
    });

    it('should not be available without fires', () => {
      mockShip.fires = [];
      assert.strictEqual(engine.hasActiveFires(), false);
    });
  });

  describe('seal_breach action', () => {
    beforeEach(() => {
      mockShip.breaches = [
        { location: 'cargo_bay', size: 'small' }
      ];
    });

    it('should seal breach on success', () => {
      const result = engine.execute('seal_breach', { location: 'cargo_bay' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sealed, true);
      assert.strictEqual(mockShip.breaches.length, 0);
    });

    it('should seal first breach without location', () => {
      const result = engine.execute('seal_breach');
      assert.strictEqual(result.sealed, true);
    });

    it('should not be available without breaches', () => {
      mockShip.breaches = [];
      assert.strictEqual(engine.hasBreaches(), false);
    });
  });

  describe('emergency_bulkhead action', () => {
    it('should seal section', () => {
      const result = engine.execute('emergency_bulkhead', {
        section: 'engineering'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sealed, true);
      assert.ok(mockShip.sealedSections.includes('engineering'));
    });

    it('should not duplicate sealed sections', () => {
      engine.execute('emergency_bulkhead', { section: 'engineering' });
      engine.execute('emergency_bulkhead', { section: 'engineering' });

      assert.strictEqual(mockShip.sealedSections.length, 1);
    });

    it('should fail without section', () => {
      const result = engine.execute('emergency_bulkhead');
      assert.strictEqual(result.success, false);
    });
  });

  describe('damage_assessment action', () => {
    beforeEach(() => {
      mockShip.systems.mDrive = { hits: 2 };
      mockShip.systems.sensors = { hits: 1 };
      mockShip.fires = [{ location: 'bridge', intensity: 1 }];
      mockShip.breaches = [{ location: 'hull', size: 'medium' }];
    });

    it('should return comprehensive assessment', () => {
      const result = engine.execute('damage_assessment');

      assert.strictEqual(result.success, true);
      const { assessment } = result;

      assert.ok(assessment.hullDamage >= 0);
      assert.ok(assessment.hullPercent <= 100);
      assert.ok(assessment.damagedSystems.length > 0);
      assert.strictEqual(assessment.activeFires, 1);
      assert.strictEqual(assessment.activeBreaches, 1);
    });

    it('should include system priorities', () => {
      const result = engine.execute('damage_assessment');
      const mDrive = result.assessment.damagedSystems.find(
        s => s.system === 'mDrive'
      );

      assert.ok(mDrive);
      assert.strictEqual(mDrive.severity, 2);
      assert.ok(mDrive.priority);
    });

    it('should determine critical status', () => {
      mockShip.hull = 4; // 10% of 40
      const result = engine.execute('damage_assessment');

      assert.strictEqual(result.assessment.criticalStatus, 'critical');
    });
  });

  describe('getCriticalStatus', () => {
    it('should return critical at 10%', () => {
      mockShip.hull = 4;
      assert.strictEqual(engine.getCriticalStatus(), 'critical');
    });

    it('should return severe at 25%', () => {
      mockShip.hull = 10;
      assert.strictEqual(engine.getCriticalStatus(), 'severe');
    });

    it('should return moderate at 50%', () => {
      mockShip.hull = 20;
      assert.strictEqual(engine.getCriticalStatus(), 'moderate');
    });

    it('should return light below 100%', () => {
      mockShip.hull = 35;
      assert.strictEqual(engine.getCriticalStatus(), 'light');
    });

    it('should return none at 100%', () => {
      mockShip.hull = 40;
      assert.strictEqual(engine.getCriticalStatus(), 'none');
    });
  });

  describe('getAvailableActions', () => {
    it('should include available actions', () => {
      mockShip.systems.mDrive = { hits: 1 };
      mockShip.fires = [{ location: 'bridge', intensity: 1 }];
      mockShip.breaches = [{ location: 'hull', size: 'small' }];

      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(ids.includes('repair_hull'));
      assert.ok(ids.includes('repair_system'));
      assert.ok(ids.includes('firefighting'));
      assert.ok(ids.includes('seal_breach'));
      assert.ok(ids.includes('damage_assessment'));
    });

    it('should exclude unavailable actions', () => {
      // No damage, fires, or breaches
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('repair_system'));
      assert.ok(!ids.includes('firefighting'));
      assert.ok(!ids.includes('seal_breach'));
    });
  });
});
