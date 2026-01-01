/**
 * Tests for SensorsEngine
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { SensorsEngine } = require('../../../lib/engine/roles/sensors-engine');
const { EventBus } = require('../../../lib/engine/event-bus');

describe('SensorsEngine', () => {
  let engine;
  let mockShip;
  let mockCombat;
  let mockRng;
  let eventBus;

  beforeEach(() => {
    mockShip = {
      id: 'ship-1',
      name: 'Test Ship',
      sensors: 4,
      ecm: 2,
      eccm: 1,
      crew: { electronics: 2 },
      systems: {
        sensors: { disabled: false }
      }
    };

    mockCombat = {
      contacts: [
        { id: 'enemy-1', name: 'Pirate', type: 'ship', range: 'Medium', hostile: true },
        { id: 'enemy-2', name: 'Corsair', type: 'ship', range: 'Long', hostile: true, stealth: 2 }
      ]
    };

    mockRng = {
      roll1d6: () => 3,
      roll2d6: () => 9  // Success on 8+
    };

    eventBus = new EventBus();
    engine = new SensorsEngine(mockShip, {
      combat: mockCombat,
      eventBus,
      rng: mockRng
    });
  });

  describe('constructor', () => {
    it('should set role to sensors', () => {
      assert.strictEqual(engine.role, 'sensors');
    });

    it('should have active_scan as default action', () => {
      const def = engine.getDefaultAction();
      assert.strictEqual(def.id, 'active_scan');
    });
  });

  describe('active_scan action', () => {
    it('should perform scan and detect contacts', () => {
      const result = engine.execute('active_scan');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.action, 'active_scan');
      assert.ok(Array.isArray(result.detected));
    });

    it('should reveal ship position', () => {
      engine.execute('active_scan');
      assert.strictEqual(mockShip.sensorEmission, 'active');
    });

    it('should detect easy targets', () => {
      const result = engine.execute('active_scan');

      // Should detect the Pirate at Medium range
      const pirate = result.detected.find(c => c.id === 'enemy-1');
      assert.ok(pirate);
      assert.strictEqual(pirate.name, 'Pirate');
    });

    it('should fail to detect on bad roll', () => {
      mockRng.roll2d6 = () => 4; // 4 + 2 = 6 < 8
      engine = new SensorsEngine(mockShip, { combat: mockCombat, rng: mockRng });

      const result = engine.execute('active_scan');
      assert.strictEqual(result.detected.length, 0);
    });

    it('should not be available with disabled sensors', () => {
      mockShip.systems.sensors.disabled = true;
      assert.strictEqual(engine.canActiveScan(), false);
    });
  });

  describe('passive_scan action', () => {
    it('should perform stealthy scan', () => {
      const result = engine.execute('passive_scan');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stealthy, true);
    });

    it('should not reveal position', () => {
      engine.execute('passive_scan');
      assert.strictEqual(mockShip.sensorEmission, 'passive');
    });

    it('should be less effective than active', () => {
      // Active scan with same roll should detect more
      const activeResult = engine.execute('active_scan');
      engine = new SensorsEngine(mockShip, { combat: mockCombat, rng: mockRng });
      const passiveResult = engine.execute('passive_scan');

      // Passive has -2 penalty, may detect fewer
      assert.ok(passiveResult.scanPower <= activeResult.scanPower);
    });
  });

  describe('ecm action', () => {
    it('should activate jamming on success', () => {
      const result = engine.execute('ecm');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.jamming, true);
      assert.strictEqual(mockShip.ecmActive, true);
    });

    it('should calculate jamming strength', () => {
      const result = engine.execute('ecm');

      // Effect (9-8=1) + ecm DM (2) = 3
      assert.strictEqual(result.jammingStrength, 3);
    });

    it('should jam specific target', () => {
      const target = { id: 'enemy-1', name: 'Pirate' };
      const result = engine.execute('ecm', { target });

      assert.strictEqual(target.jammed, true);
      assert.strictEqual(result.target, 'Pirate');
    });

    it('should not be available without ECM', () => {
      delete mockShip.ecm;
      assert.strictEqual(engine.canECM(), false);
    });
  });

  describe('eccm action', () => {
    it('should activate protection on success', () => {
      const result = engine.execute('eccm');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.protected, true);
      assert.strictEqual(mockShip.eccmActive, true);
    });

    it('should calculate protection strength', () => {
      const result = engine.execute('eccm');

      // Effect (9-8=1) + eccm DM (1) = 2
      assert.strictEqual(result.protectionStrength, 2);
    });

    it('should not be available without ECCM', () => {
      delete mockShip.eccm;
      assert.strictEqual(engine.canECCM(), false);
    });
  });

  describe('target_lock action', () => {
    it('should establish lock on success', () => {
      const target = { id: 'enemy-1', name: 'Pirate' };
      const result = engine.execute('target_lock', { target });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.locked, true);
      assert.strictEqual(result.attackBonus, 2);
    });

    it('should track locked targets', () => {
      const target = { id: 'enemy-1', name: 'Pirate' };
      engine.execute('target_lock', { target });

      assert.ok(mockShip.targetLocks.includes('enemy-1'));
    });

    it('should fail without target', () => {
      const result = engine.execute('target_lock');
      assert.strictEqual(result.success, false);
    });

    it('should not duplicate locks', () => {
      const target = { id: 'enemy-1', name: 'Pirate' };
      engine.execute('target_lock', { target });
      engine.execute('target_lock', { target });

      assert.strictEqual(mockShip.targetLocks.length, 1);
    });
  });

  describe('break_lock action', () => {
    beforeEach(() => {
      mockShip.lockedByEnemy = true;
    });

    it('should break enemy lock on success', () => {
      const result = engine.execute('break_lock');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.broken, true);
      assert.strictEqual(mockShip.lockedByEnemy, false);
    });

    it('should not be available without enemy lock', () => {
      mockShip.lockedByEnemy = false;
      assert.strictEqual(engine.hasEnemyLock(), false);
    });
  });

  describe('detectContacts', () => {
    it('should return full details for easy detections', () => {
      const detected = engine.detectContacts(5, 'active');

      const pirate = detected.find(c => c.id === 'enemy-1');
      assert.strictEqual(pirate.detailLevel, 'full');
      assert.strictEqual(pirate.name, 'Pirate');
    });

    it('should return partial details for hard detections', () => {
      // Low scan power, stealthy target
      const detected = engine.detectContacts(2, 'active');

      const corsair = detected.find(c => c.id === 'enemy-2');
      if (corsair) {
        assert.strictEqual(corsair.detailLevel, 'partial');
        assert.strictEqual(corsair.name, 'Unknown Contact');
      }
    });

    it('should skip destroyed contacts', () => {
      mockCombat.contacts[0].destroyed = true;
      const detected = engine.detectContacts(10, 'active');

      assert.ok(!detected.find(c => c.id === 'enemy-1'));
    });
  });

  describe('getAvailableActions', () => {
    it('should include all actions for capable ship', () => {
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(ids.includes('active_scan'));
      assert.ok(ids.includes('passive_scan'));
      assert.ok(ids.includes('ecm'));
      assert.ok(ids.includes('eccm'));
      assert.ok(ids.includes('target_lock'));
    });

    it('should exclude break_lock when not locked', () => {
      const actions = engine.getAvailableActions();
      const ids = actions.map(a => a.id);

      assert.ok(!ids.includes('break_lock'));
    });
  });

  describe('sensor modifiers', () => {
    it('should calculate sensor DM from rating', () => {
      mockShip.sensors = 6;
      assert.strictEqual(engine.getSensorDM(), 3);
    });

    it('should calculate range DM', () => {
      assert.strictEqual(engine.getRangeDM('Adjacent'), -2);
      assert.strictEqual(engine.getRangeDM('Medium'), 1);
      assert.strictEqual(engine.getRangeDM('Distant'), 4);
    });
  });
});
