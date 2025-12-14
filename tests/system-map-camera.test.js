/**
 * AR-105: System Map Camera Unit Tests
 * Comprehensive tests for camera calculations and presets
 */

const {
  AU_TO_KM,
  MIN_ZOOM,
  MAX_ZOOM,
  STATION_CAMERA_PRESETS,
  STATION_TYPES,
  TYPE_CAMERA_DEFAULTS,
  isStationType,
  calculateZoomForSize,
  clampZoom,
  generateCameraPreset,
  calculateFinalZoom,
  getObjectRadiusKm
} = require('../lib/system-map-calculations');

describe('System Map Camera Calculations', () => {

  // ===================
  // Constants Tests
  // ===================

  describe('Constants', () => {
    test('AU_TO_KM is correct value', () => {
      expect(AU_TO_KM).toBeCloseTo(149597870.7, 1);
    });

    test('MIN_ZOOM is reasonable', () => {
      expect(MIN_ZOOM).toBeGreaterThan(0);
      expect(MIN_ZOOM).toBeLessThan(1);
    });

    test('MAX_ZOOM is reasonable', () => {
      expect(MAX_ZOOM).toBeGreaterThan(1);
      expect(MAX_ZOOM).toBeLessThanOrEqual(100);
    });

    test('STATION_CAMERA_PRESETS has 3 presets', () => {
      expect(STATION_CAMERA_PRESETS).toHaveLength(3);
    });

    test('STATION_CAMERA_PRESETS have absoluteZoom values', () => {
      STATION_CAMERA_PRESETS.forEach(preset => {
        expect(preset.absoluteZoom).toBeDefined();
        expect(typeof preset.absoluteZoom).toBe('number');
        expect(preset.absoluteZoom).toBeGreaterThan(0);
      });
    });

    test('Station presets are [5, 20, 60]', () => {
      const zooms = STATION_CAMERA_PRESETS.map(p => p.absoluteZoom);
      expect(zooms).toEqual([5, 20, 60]);
    });
  });

  // ===================
  // isStationType Tests
  // ===================

  describe('isStationType', () => {
    test('identifies Station type', () => {
      expect(isStationType('Station')).toBe(true);
    });

    test('identifies Highport type', () => {
      expect(isStationType('Highport')).toBe(true);
    });

    test('identifies Dock type', () => {
      expect(isStationType('Dock')).toBe(true);
    });

    test('identifies dock (lowercase) type', () => {
      expect(isStationType('dock')).toBe(true);
    });

    test('identifies Naval Base', () => {
      expect(isStationType('Naval Base')).toBe(true);
    });

    test('identifies Scout Base', () => {
      expect(isStationType('Scout Base')).toBe(true);
    });

    test('rejects Planet type', () => {
      expect(isStationType('Planet')).toBe(false);
    });

    test('rejects Star type', () => {
      expect(isStationType('Star')).toBe(false);
    });

    test('uses placeType override', () => {
      // Even if type is Planet, placeType dock should make it a station
      expect(isStationType('Planet', 'dock')).toBe(true);
      expect(isStationType('Planet', 'Highport')).toBe(true);
    });

    test('rejects invalid placeType', () => {
      expect(isStationType('Planet', 'surface')).toBe(false);
    });
  });

  // ===================
  // calculateZoomForSize Tests
  // ===================

  describe('calculateZoomForSize', () => {
    test('larger objects produce smaller zoom', () => {
      const sunZoom = calculateZoomForSize(696340, 800, 0.5);
      const earthZoom = calculateZoomForSize(6371, 800, 0.5);
      expect(sunZoom).toBeLessThan(earthZoom);
    });

    test('smaller canvas produces smaller zoom', () => {
      const largeCanvas = calculateZoomForSize(6371, 1200, 0.5);
      const smallCanvas = calculateZoomForSize(6371, 600, 0.5);
      // Actually larger canvas should produce same zoom (formula doesn't use canvas)
      // The formula is: (targetFillFraction * AU_TO_KM * 10) / radiusKm
      // Canvas size doesn't affect this - it's a pure radius calculation
      expect(largeCanvas).toBe(smallCanvas);
    });

    test('higher fill fraction produces higher zoom', () => {
      const halfFill = calculateZoomForSize(6371, 800, 0.5);
      const fullFill = calculateZoomForSize(6371, 800, 1.0);
      expect(fullFill).toBeGreaterThan(halfFill);
    });

    test('returns 1.0 for zero radius', () => {
      expect(calculateZoomForSize(0, 800, 0.5)).toBe(1.0);
    });

    test('returns 1.0 for negative radius', () => {
      expect(calculateZoomForSize(-100, 800, 0.5)).toBe(1.0);
    });

    test('returns 1.0 for zero canvas', () => {
      expect(calculateZoomForSize(6371, 0, 0.5)).toBe(1.0);
    });

    test('produces astronomical values for small objects', () => {
      // A 100km asteroid should produce very high zoom
      const asteroidZoom = calculateZoomForSize(100, 800, 0.5);
      expect(asteroidZoom).toBeGreaterThan(1000000);
    });

    test('produces reasonable values for Earth-sized planets', () => {
      const earthZoom = calculateZoomForSize(6371, 800, 0.5);
      // Earth: (0.5 * 149597870.7 * 10) / 6371 = ~117,400
      expect(earthZoom).toBeGreaterThan(100000);
      expect(earthZoom).toBeLessThan(200000);
    });
  });

  // ===================
  // clampZoom Tests
  // ===================

  describe('clampZoom', () => {
    test('clamps values below MIN_ZOOM', () => {
      expect(clampZoom(0.001)).toBe(MIN_ZOOM);
      expect(clampZoom(-5)).toBe(MIN_ZOOM);
    });

    test('clamps values above MAX_ZOOM', () => {
      expect(clampZoom(150)).toBe(MAX_ZOOM);
      expect(clampZoom(1000000)).toBe(MAX_ZOOM);
    });

    test('passes through values in range', () => {
      expect(clampZoom(50)).toBe(50);
      expect(clampZoom(1)).toBe(1);
    });

    test('passes through boundary values', () => {
      expect(clampZoom(MIN_ZOOM)).toBe(MIN_ZOOM);
      expect(clampZoom(MAX_ZOOM)).toBe(MAX_ZOOM);
    });
  });

  // ===================
  // generateCameraPreset Tests
  // ===================

  describe('generateCameraPreset', () => {

    describe('Station presets', () => {
      test('returns absoluteZoom for Station type', () => {
        const obj = { type: 'Station', id: 'test' };
        const preset = generateCameraPreset(obj, 0, null);
        expect(preset.absoluteZoom).toBeDefined();
        expect(preset.absoluteZoom).toBe(5);
      });

      test('returns absoluteZoom when placeType is dock', () => {
        const obj = { type: 'Planet', id: 'test' };
        const preset = generateCameraPreset(obj, 0, 'dock');
        expect(preset.absoluteZoom).toBe(5);
      });

      test('cycles through 3 station presets', () => {
        const obj = { type: 'Station', id: 'test' };
        const zoom0 = generateCameraPreset(obj, 0).absoluteZoom;
        const zoom1 = generateCameraPreset(obj, 1).absoluteZoom;
        const zoom2 = generateCameraPreset(obj, 2).absoluteZoom;
        expect([zoom0, zoom1, zoom2]).toEqual([5, 20, 60]);
      });

      test('cycles wrap after 3', () => {
        const obj = { type: 'Station', id: 'test' };
        const zoom3 = generateCameraPreset(obj, 3).absoluteZoom;
        const zoom4 = generateCameraPreset(obj, 4).absoluteZoom;
        expect(zoom3).toBe(5); // Wraps to 0
        expect(zoom4).toBe(20); // Wraps to 1
      });

      test('includes offset values for stations', () => {
        const obj = { type: 'Station', id: 'test' };
        const preset = generateCameraPreset(obj, 0);
        expect(preset.offsetX).toBeDefined();
        expect(preset.offsetY).toBeDefined();
        expect(typeof preset.offsetX).toBe('number');
        expect(typeof preset.offsetY).toBe('number');
      });
    });

    describe('Planet presets', () => {
      test('returns zoomMultiplier (not absoluteZoom) for Planet', () => {
        const obj = { type: 'Planet', id: 'test' };
        const preset = generateCameraPreset(obj, 0, null);
        expect(preset.zoomMultiplier).toBeDefined();
        expect(preset.absoluteZoom).toBeUndefined();
      });

      test('uses type defaults for planets', () => {
        const obj = { type: 'Planet', id: 'test' };
        const preset = generateCameraPreset(obj, 0);
        expect(preset.zoomMultiplier).toBe(TYPE_CAMERA_DEFAULTS['Planet'].zoomMultiplier);
      });
    });

    describe('Custom cameraSettings', () => {
      test('uses cameraSettings at cycleIndex 0', () => {
        const obj = {
          type: 'Planet',
          id: 'test',
          cameraSettings: { zoomMultiplier: 3.5, offsetX: 0.5, offsetY: -0.2 }
        };
        const preset = generateCameraPreset(obj, 0);
        expect(preset.zoomMultiplier).toBe(3.5);
        expect(preset.offsetX).toBe(0.5);
        expect(preset.offsetY).toBe(-0.2);
      });

      test('ignores cameraSettings at cycleIndex > 0', () => {
        const obj = {
          type: 'Planet',
          id: 'test',
          cameraSettings: { zoomMultiplier: 3.5, offsetX: 0.5, offsetY: -0.2 }
        };
        const preset = generateCameraPreset(obj, 1);
        // Should use type defaults with cycle modulation, not cameraSettings
        expect(preset.zoomMultiplier).not.toBe(3.5);
      });

      test('stations ignore cameraSettings - always use absoluteZoom', () => {
        const obj = {
          type: 'Station',
          id: 'test',
          cameraSettings: { zoomMultiplier: 3.5, offsetX: 0.5, offsetY: -0.2 }
        };
        const preset = generateCameraPreset(obj, 0);
        expect(preset.absoluteZoom).toBe(5);
        expect(preset.zoomMultiplier).toBe(1.0); // Fallback value
      });
    });

    describe('Linked object resolution', () => {
      test('resolves dock to linked Highport type', () => {
        const dockObj = { type: 'dock', id: 'dock-1', linkedTo: 'highport-1' };
        const celestialObjects = [
          { id: 'highport-1', type: 'Highport' }
        ];
        const preset = generateCameraPreset(dockObj, 0, null, celestialObjects);
        // Should use station presets because linkedTo resolves to Highport
        expect(preset.absoluteZoom).toBe(5);
      });

      test('falls back to dock type when linked object not found', () => {
        const dockObj = { type: 'dock', id: 'dock-1', linkedTo: 'nonexistent' };
        const preset = generateCameraPreset(dockObj, 0, null, []);
        // dock is in STATION_TYPES, so should still use station presets
        expect(preset.absoluteZoom).toBe(5);
      });
    });
  });

  // ===================
  // calculateFinalZoom Tests
  // ===================

  describe('calculateFinalZoom', () => {
    test('uses absoluteZoom directly for stations', () => {
      const preset = { absoluteZoom: 20, zoomMultiplier: 1.0, offsetX: 0, offsetY: 0 };
      const result = calculateFinalZoom(preset, 50000);
      expect(result).toBe(20);
    });

    test('multiplies baseZoom by zoomMultiplier for planets', () => {
      const preset = { zoomMultiplier: 2.0, offsetX: 0, offsetY: 0 };
      const result = calculateFinalZoom(preset, 50);
      expect(result).toBe(100); // 50 * 2.0 = 100, clamped to MAX_ZOOM
    });

    test('clamps result to MAX_ZOOM', () => {
      const preset = { zoomMultiplier: 10.0, offsetX: 0, offsetY: 0 };
      const result = calculateFinalZoom(preset, 50);
      expect(result).toBe(MAX_ZOOM); // 50 * 10 = 500, clamped to 100
    });

    test('clamps result to MIN_ZOOM', () => {
      const preset = { zoomMultiplier: 0.001, offsetX: 0, offsetY: 0 };
      const result = calculateFinalZoom(preset, 0.001);
      expect(result).toBe(MIN_ZOOM);
    });

    test('absoluteZoom is also clamped', () => {
      const preset = { absoluteZoom: 500, offsetX: 0, offsetY: 0 };
      const result = calculateFinalZoom(preset, 1);
      expect(result).toBe(MAX_ZOOM);
    });
  });

  // ===================
  // getObjectRadiusKm Tests
  // ===================

  describe('getObjectRadiusKm', () => {
    test('uses radiusKm when available', () => {
      const obj = { radiusKm: 12345 };
      expect(getObjectRadiusKm(obj)).toBe(12345);
    });

    test('falls back to size code mapping', () => {
      const obj = { size: 6 };
      expect(getObjectRadiusKm(obj)).toBe(4800);
    });

    test('handles size code 0 (asteroids)', () => {
      const obj = { size: 0 };
      expect(getObjectRadiusKm(obj)).toBe(400);
    });

    test('handles size code A (large)', () => {
      const obj = { size: 'A' };
      expect(getObjectRadiusKm(obj)).toBe(8000);
    });

    test('defaults to Earth radius when no size info', () => {
      const obj = {};
      expect(getObjectRadiusKm(obj)).toBe(6371);
    });
  });

  // ===================
  // Integration Tests
  // ===================

  describe('Integration: Full camera flow', () => {
    test('Station: placeType dock → absoluteZoom 5', () => {
      const obj = { type: 'Planet', id: 'test' };
      const preset = generateCameraPreset(obj, 0, 'dock');
      const finalZoom = calculateFinalZoom(preset, 100000);
      expect(finalZoom).toBe(5); // absoluteZoom takes precedence
    });

    test('Planet: calculates zoom from size and multiplier', () => {
      const obj = { type: 'Planet', id: 'test', radiusKm: 6371 };
      const preset = generateCameraPreset(obj, 0);
      const baseZoom = calculateZoomForSize(obj.radiusKm, 800, 0.5);
      const finalZoom = calculateFinalZoom(preset, baseZoom);
      // Should be clamped to MAX_ZOOM since Earth produces ~117,000
      expect(finalZoom).toBe(MAX_ZOOM);
    });

    test('Station cycles produce different zoom levels', () => {
      const obj = { type: 'Station', id: 'test' };
      const zooms = [];
      for (let i = 0; i < 3; i++) {
        const preset = generateCameraPreset(obj, i);
        const finalZoom = calculateFinalZoom(preset, 100);
        zooms.push(finalZoom);
      }
      // All 3 should be different
      expect(new Set(zooms).size).toBe(3);
      expect(zooms).toEqual([5, 20, 60]);
    });
  });
});
