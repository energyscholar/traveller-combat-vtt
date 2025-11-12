// ======== SHIP LIBRARY MODULE ========
// localStorage-based ship library for saving custom ships (Stage 12.5)
// Browser-only module (not for Node.js server)

const STORAGE_KEY = 'traveller_custom_ships';

// ======== DATA STRUCTURE ========
// {
//   "customShips": [
//     {
//       "id": "ship_1699999999",
//       "templateId": "free_trader",
//       "name": "Jolly Reaver",
//       "baseCost": 51480000,
//       "mods": { ... },
//       "modCost": 6000000,
//       "totalCost": 57480000,
//       "created": "2025-11-12T10:30:00Z",
//       "modified": "2025-11-12T11:00:00Z"
//     }
//   ]
// }

// ======== CREATE ========

/**
 * Save a new custom ship to the library
 * @param {Object} template - Base ship template
 * @param {Object} modifications - Ship modifications
 * @param {string} customName - Custom ship name
 * @returns {Object} Saved ship object with ID
 */
function saveShip(template, modifications, customName) {
  // Generate unique ID
  const shipId = `ship_${Date.now()}`;

  // Calculate costs
  const baseCost = template.cost || 0;
  const modCost = window.ShipCosts ?
    window.ShipCosts.calculateModificationCost(template, modifications) : 0;
  const totalCost = baseCost + modCost;

  // Create ship object
  const ship = {
    id: shipId,
    templateId: template.id,
    name: customName || `Custom ${template.name}`,
    baseCost: baseCost,
    mods: JSON.parse(JSON.stringify(modifications)), // Deep copy
    modCost: modCost,
    totalCost: totalCost,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };

  // Load existing library
  const library = loadLibrary();

  // Add new ship
  library.customShips.push(ship);

  // Save to localStorage
  saveLibrary(library);

  console.log('[SHIP LIBRARY] Saved ship:', ship.name, ship.id);

  return ship;
}

// ======== READ ========

/**
 * Load the entire ship library from localStorage
 * @returns {Object} Library object with customShips array
 */
function loadLibrary() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      return { customShips: [] };
    }
    return JSON.parse(json);
  } catch (error) {
    console.error('[SHIP LIBRARY] Error loading library:', error);
    return { customShips: [] };
  }
}

/**
 * Get all custom ships
 * @returns {Array} Array of custom ship objects
 */
function getAllShips() {
  const library = loadLibrary();
  return library.customShips;
}

/**
 * Get a specific ship by ID
 * @param {string} shipId - Ship ID
 * @returns {Object|null} Ship object or null if not found
 */
function getShip(shipId) {
  const library = loadLibrary();
  return library.customShips.find(ship => ship.id === shipId) || null;
}

// ======== UPDATE ========

/**
 * Update an existing ship
 * @param {string} shipId - Ship ID to update
 * @param {Object} template - Base ship template
 * @param {Object} modifications - New modifications
 * @param {string} customName - New custom name (optional)
 * @returns {Object|null} Updated ship object or null if not found
 */
function updateShip(shipId, template, modifications, customName) {
  const library = loadLibrary();
  const shipIndex = library.customShips.findIndex(s => s.id === shipId);

  if (shipIndex === -1) {
    console.error('[SHIP LIBRARY] Ship not found:', shipId);
    return null;
  }

  // Calculate new costs
  const baseCost = template.cost || 0;
  const modCost = window.ShipCosts ?
    window.ShipCosts.calculateModificationCost(template, modifications) : 0;
  const totalCost = baseCost + modCost;

  // Update ship
  const ship = library.customShips[shipIndex];
  ship.name = customName || ship.name;
  ship.mods = JSON.parse(JSON.stringify(modifications));
  ship.modCost = modCost;
  ship.totalCost = totalCost;
  ship.modified = new Date().toISOString();

  // Save library
  saveLibrary(library);

  console.log('[SHIP LIBRARY] Updated ship:', ship.name, ship.id);

  return ship;
}

/**
 * Rename a ship
 * @param {string} shipId - Ship ID
 * @param {string} newName - New ship name
 * @returns {boolean} Success status
 */
function renameShip(shipId, newName) {
  const library = loadLibrary();
  const ship = library.customShips.find(s => s.id === shipId);

  if (!ship) {
    console.error('[SHIP LIBRARY] Ship not found:', shipId);
    return false;
  }

  ship.name = newName;
  ship.modified = new Date().toISOString();

  saveLibrary(library);

  console.log('[SHIP LIBRARY] Renamed ship:', shipId, 'to', newName);

  return true;
}

// ======== DELETE ========

/**
 * Delete a ship from the library
 * @param {string} shipId - Ship ID to delete
 * @returns {boolean} Success status
 */
function deleteShip(shipId) {
  const library = loadLibrary();
  const initialLength = library.customShips.length;

  library.customShips = library.customShips.filter(s => s.id !== shipId);

  if (library.customShips.length === initialLength) {
    console.error('[SHIP LIBRARY] Ship not found:', shipId);
    return false;
  }

  saveLibrary(library);

  console.log('[SHIP LIBRARY] Deleted ship:', shipId);

  return true;
}

// ======== DUPLICATE ========

/**
 * Duplicate an existing ship
 * @param {string} shipId - Ship ID to duplicate
 * @returns {Object|null} New ship object or null if original not found
 */
function duplicateShip(shipId) {
  const originalShip = getShip(shipId);

  if (!originalShip) {
    console.error('[SHIP LIBRARY] Ship not found:', shipId);
    return null;
  }

  // Create new ship with same data but new ID
  const newShipId = `ship_${Date.now()}`;
  const newShip = {
    ...originalShip,
    id: newShipId,
    name: `${originalShip.name} (Copy)`,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };

  // Add to library
  const library = loadLibrary();
  library.customShips.push(newShip);
  saveLibrary(library);

  console.log('[SHIP LIBRARY] Duplicated ship:', originalShip.name, '→', newShip.name);

  return newShip;
}

// ======== EXPORT/IMPORT ========

/**
 * Export a ship as JSON string
 * @param {string} shipId - Ship ID to export
 * @returns {string|null} JSON string or null if not found
 */
function exportShip(shipId) {
  const ship = getShip(shipId);

  if (!ship) {
    console.error('[SHIP LIBRARY] Ship not found:', shipId);
    return null;
  }

  return JSON.stringify(ship, null, 2);
}

/**
 * Export entire library as JSON string
 * @returns {string} JSON string of entire library
 */
function exportLibrary() {
  const library = loadLibrary();
  return JSON.stringify(library, null, 2);
}

/**
 * Import a ship from JSON string
 * @param {string} jsonString - JSON string of ship object
 * @returns {Object|null} Imported ship object or null on error
 */
function importShip(jsonString) {
  try {
    const ship = JSON.parse(jsonString);

    // Validate required fields
    if (!ship.templateId || !ship.name || !ship.mods) {
      throw new Error('Invalid ship JSON: missing required fields');
    }

    // Generate new ID to avoid conflicts
    const newShipId = `ship_${Date.now()}`;
    ship.id = newShipId;
    ship.created = new Date().toISOString();
    ship.modified = new Date().toISOString();

    // Add to library
    const library = loadLibrary();
    library.customShips.push(ship);
    saveLibrary(library);

    console.log('[SHIP LIBRARY] Imported ship:', ship.name);

    return ship;
  } catch (error) {
    console.error('[SHIP LIBRARY] Error importing ship:', error);
    return null;
  }
}

// ======== UTILITY ========

/**
 * Save library object to localStorage
 * @param {Object} library - Library object to save
 */
function saveLibrary(library) {
  try {
    const json = JSON.stringify(library);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('[SHIP LIBRARY] Error saving library:', error);
  }
}

/**
 * Clear the entire ship library (WARNING: cannot be undone)
 * @returns {boolean} Success status
 */
function clearLibrary() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[SHIP LIBRARY] Library cleared');
    return true;
  } catch (error) {
    console.error('[SHIP LIBRARY] Error clearing library:', error);
    return false;
  }
}

/**
 * Get library statistics
 * @returns {Object} Stats object
 */
function getLibraryStats() {
  const library = loadLibrary();
  const ships = library.customShips;

  return {
    totalShips: ships.length,
    totalValue: ships.reduce((sum, ship) => sum + ship.totalCost, 0),
    templates: [...new Set(ships.map(s => s.templateId))],
    oldestShip: ships.length > 0 ?
      ships.reduce((oldest, ship) =>
        new Date(ship.created) < new Date(oldest.created) ? ship : oldest
      ) : null,
    newestShip: ships.length > 0 ?
      ships.reduce((newest, ship) =>
        new Date(ship.created) > new Date(newest.created) ? ship : newest
      ) : null
  };
}

// ======== EXPORTS ========

// Browser global export
if (typeof window !== 'undefined') {
  window.ShipLibrary = {
    // CRUD operations
    saveShip,
    loadLibrary,
    getAllShips,
    getShip,
    updateShip,
    renameShip,
    deleteShip,
    duplicateShip,

    // Export/Import
    exportShip,
    exportLibrary,
    importShip,

    // Utility
    clearLibrary,
    getLibraryStats
  };
}

// Node.js export (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveShip,
    loadLibrary,
    getAllShips,
    getShip,
    updateShip,
    renameShip,
    deleteShip,
    duplicateShip,
    exportShip,
    exportLibrary,
    importShip,
    clearLibrary,
    getLibraryStats
  };
}
