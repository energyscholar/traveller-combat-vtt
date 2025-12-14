/**
 * AR-105: System Map Camera Calculations
 * Extracted pure functions for testing - shared by browser and Node.js
 */

// Constants
const AU_TO_KM = 149597870.7;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100;

// Station camera presets - cinematic orbital views
const STATION_CAMERA_PRESETS = [
  // Wide establishing: Star visible, planet small, station in orbital context
  { name: 'establishing', absoluteZoom: 5, offsetX: -0.15, offsetY: 0.1, description: 'Wide establishing shot' },
  // Medium orbital: Planet prominent, station clearly visible against it
  { name: 'orbital', absoluteZoom: 20, offsetX: -0.25, offsetY: 0.12, description: 'Dramatic orbital view' },
  // Detail close-up: Planet fills much of frame, station detail visible
  { name: 'detail', absoluteZoom: 60, offsetX: -0.2, offsetY: 0.08, description: 'Station detail with planet curve' }
];

// Station types that should use absolute zoom presets
const STATION_TYPES = ['Station', 'Highport', 'Dock', 'Naval Base', 'Scout Base', 'dock'];

// Type-based camera defaults for non-station objects
const TYPE_CAMERA_DEFAULTS = {
  'Star': { zoomMultiplier: 0.15, offsetX: 0.28, offsetY: 0.12 },
  'Planet': { zoomMultiplier: 2.5, offsetX: 0.25, offsetY: 0.15 },
  'Planetoid': { zoomMultiplier: 6.0, offsetX: -0.2, offsetY: 0.15 },
  'Asteroid': { zoomMultiplier: 8.0, offsetX: -0.15, offsetY: 0.2 },
  'Belt': { zoomMultiplier: 0.3, offsetX: 0, offsetY: 0 },
  'Gas Giant': { zoomMultiplier: 1.5, offsetX: 0.3, offsetY: 0.1 },
  'default': { zoomMultiplier: 1.0, offsetX: 0, offsetY: 0 }
};

/**
 * Check if an object type is a station
 * @param {string} type - Object type
 * @param {string} placeType - Optional place type from goToPlace
 * @returns {boolean}
 */
function isStationType(type, placeType = null) {
  if (placeType && STATION_TYPES.includes(placeType)) {
    return true;
  }
  return STATION_TYPES.includes(type);
}

/**
 * Calculate zoom level to fit an object in the canvas
 * @param {number} radiusKm - Object radius in km
 * @param {number} canvasSize - Canvas dimension (min of width/height)
 * @param {number} targetFillFraction - How much of canvas to fill (0.5 = 50%)
 * @returns {number} Zoom level (unclamped)
 */
function calculateZoomForSize(radiusKm, canvasSize, targetFillFraction = 0.5) {
  if (radiusKm <= 0 || canvasSize <= 0) {
    return 1.0;
  }
  // Formula: zoom = (targetFillFraction * AU_TO_KM * 10) / radiusKm
  // This makes larger objects have smaller zoom (more zoomed out)
  const zoom = (targetFillFraction * AU_TO_KM * 10) / radiusKm;
  return zoom;
}

/**
 * Clamp zoom to valid range
 * @param {number} zoom - Raw zoom value
 * @returns {number} Clamped zoom
 */
function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(zoom, MAX_ZOOM));
}

/**
 * Generate camera preset for an object
 * @param {Object} obj - Celestial object with type, id, etc.
 * @param {number} cycleIndex - Which camera preset to use (0, 1, 2 cycle)
 * @param {string} placeType - Optional place type from goToPlace
 * @param {Array} celestialObjects - Optional array to resolve linked objects
 * @returns {Object} Camera preset { absoluteZoom?, zoomMultiplier, offsetX, offsetY }
 */
function generateCameraPreset(obj, cycleIndex = 0, placeType = null, celestialObjects = []) {
  // Resolve linked objects for dock locations
  let effectiveType = obj.type;
  if (obj.type === 'dock' && obj.linkedTo && celestialObjects.length > 0) {
    const linkedObj = celestialObjects.find(c => c.id === obj.linkedTo);
    if (linkedObj) {
      effectiveType = linkedObj.type;
    }
  }

  // Check if this is a station - use absolute zoom presets
  if (isStationType(effectiveType, placeType)) {
    const preset = STATION_CAMERA_PRESETS[cycleIndex % STATION_CAMERA_PRESETS.length];
    return {
      absoluteZoom: preset.absoluteZoom,
      zoomMultiplier: 1.0, // Fallback
      offsetX: preset.offsetX,
      offsetY: preset.offsetY,
      name: preset.name
    };
  }

  // For non-station objects, use type-based defaults
  // If object has explicit cameraSettings and cycleIndex is 0, use those
  if (obj.cameraSettings && cycleIndex === 0) {
    return {
      zoomMultiplier: obj.cameraSettings.zoomMultiplier || 1.0,
      offsetX: obj.cameraSettings.offsetX || 0,
      offsetY: obj.cameraSettings.offsetY || 0
    };
  }

  // Use type defaults with cycle variations
  const typeDefault = TYPE_CAMERA_DEFAULTS[effectiveType] || TYPE_CAMERA_DEFAULTS['default'];

  // Cycle modulates the zoom and offset for variety
  const cycleMultipliers = [1.0, 1.5, 0.7];
  const multiplier = cycleMultipliers[cycleIndex % cycleMultipliers.length];

  return {
    zoomMultiplier: typeDefault.zoomMultiplier * multiplier,
    offsetX: typeDefault.offsetX * (cycleIndex === 1 ? -1 : 1),
    offsetY: typeDefault.offsetY * (cycleIndex === 2 ? -1 : 1)
  };
}

/**
 * Calculate final zoom value from preset
 * @param {Object} preset - Camera preset from generateCameraPreset
 * @param {number} baseZoom - Base zoom calculated from object size
 * @returns {number} Final zoom value (clamped)
 */
function calculateFinalZoom(preset, baseZoom) {
  // If preset has absoluteZoom, use it directly (for stations)
  if (preset.absoluteZoom !== undefined) {
    return clampZoom(preset.absoluteZoom);
  }
  // Otherwise multiply base zoom by multiplier
  return clampZoom(baseZoom * (preset.zoomMultiplier || 1.0));
}

/**
 * Get object radius in km
 * @param {Object} obj - Object with radiusKm or size property
 * @returns {number} Radius in km
 */
function getObjectRadiusKm(obj) {
  if (obj.radiusKm) return obj.radiusKm;
  // Fallback based on size code (Traveller UWP)
  const sizeToRadius = {
    0: 400, 1: 800, 2: 1600, 3: 2400, 4: 3200,
    5: 4000, 6: 4800, 7: 5600, 8: 6400, 9: 7200,
    10: 8000, A: 8000
  };
  return sizeToRadius[obj.size] || 6371; // Default to Earth radius
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
