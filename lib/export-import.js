/**
 * Export/Import System for Traveller Combat VTT
 *
 * Implements export and import functionality for:
 * - Ship instances (with battle state)
 * - Battle states (multi-ship scenarios)
 * - Characters (full Traveller 2E data)
 *
 * Based on JSON schemas created in Session 3A:
 * - data/schemas/ship-instance-export.schema.json
 * - data/schemas/battle-state-export.schema.json
 * - data/schemas/character-export.schema.json
 */

const fs = require('fs');
const path = require('path');

// Schema version constants
const SCHEMA_VERSION = '1.0';
const SUPPORTED_VERSIONS = ['1.0'];

// Application metadata
const APP_NAME = 'Traveller Combat VTT';
const APP_VERSION = require('../package.json').version;

/**
 * ==================================================================
 * SHIP INSTANCE EXPORT/IMPORT
 * ==================================================================
 */

/**
 * Export a ship instance to JSON format
 *
 * @param {Object} ship - Ship data from game state
 * @param {Object} options - Export options
 * @param {string} options.user - Username of exporter (optional)
 * @param {Object} options.battleContext - Battle state context (optional)
 * @returns {Object} JSON export data conforming to ship-instance-export schema
 */
function exportShipInstance(ship, options = {}) {
  if (!ship || typeof ship !== 'object') {
    throw new Error('Invalid ship data: ship must be an object');
  }

  if (!ship.id) {
    throw new Error('Invalid ship data: missing required field "id"');
  }

  const exportData = {
    schemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    exportedBy: {
      application: APP_NAME,
      version: APP_VERSION,
      ...(options.user && { user: options.user })
    },
    ship: {
      id: ship.id,
      template: {
        id: ship.template?.id || ship.type || 'unknown',
        type: ship.template?.type || ship.shipClass || 'Unknown Class',
        ...(ship.template?.source && { source: ship.template.source })
      },
      name: ship.name || 'Unnamed Ship',
      ...(ship.designation && { designation: ship.designation }),

      // Customization (modifications from template)
      customization: {
        ...(ship.customization?.turretLoadouts && {
          turretLoadouts: ship.customization.turretLoadouts
        }),
        ...(ship.customization?.software && {
          software: ship.customization.software
        }),
        ...(ship.customization?.cargo && {
          cargo: ship.customization.cargo
        })
      },

      // Current state (battle damage, crew, position, etc.)
      currentState: {
        structure: {
          hull: {
            current: ship.hull || ship.maxHull || 0,
            maximum: ship.maxHull || 0
          },
          armor: {
            rating: ship.armor || ship.armour || 0,
            ablated: ship.ablatedArmor || ship.ablatedArmour || 0
          },
          componentDamage: ship.componentDamage || []
        },

        position: {
          x: ship.x || 0,
          y: ship.y || 0,
          facing: ship.facing || 0,
          ...(ship.velocity && { velocity: ship.velocity })
        },

        crew: {
          roster: ship.crew || [],
          casualties: ship.casualties || {}
        },

        power: {
          available: ship.powerPlant || 0,
          allocated: ship.powerAllocation || {}
        },

        ammunition: ship.ammunition || [],

        fuel: {
          current: ship.fuel || 0,
          maximum: ship.fuelCapacity || 0
        },

        ...(options.battleContext && {
          battle: {
            initiative: ship.initiative,
            hasActed: ship.hasActed || false,
            targeting: ship.targeting,
            effects: ship.activeEffects || []
          }
        })
      }
    }
  };

  return exportData;
}

/**
 * Import a ship instance from JSON format
 *
 * @param {Object|string} jsonData - JSON export data or JSON string
 * @returns {Object} Ship data suitable for game state
 * @throws {Error} If JSON is invalid or schema version unsupported
 */
function importShipInstance(jsonData) {
  // Parse JSON if string provided
  let data;
  if (typeof jsonData === 'string') {
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  } else if (typeof jsonData === 'object' && jsonData !== null) {
    data = jsonData;
  } else {
    throw new Error('Invalid input: must be JSON string or object');
  }

  // Validate schema version
  if (!data.schemaVersion) {
    throw new Error('Missing schemaVersion field');
  }

  if (!SUPPORTED_VERSIONS.includes(data.schemaVersion)) {
    throw new Error(`Unsupported schema version: ${data.schemaVersion}. Supported: ${SUPPORTED_VERSIONS.join(', ')}`);
  }

  // Validate required fields
  if (!data.ship) {
    throw new Error('Missing required field: ship');
  }

  if (!data.ship.id || !data.ship.name || !data.ship.currentState) {
    throw new Error('Missing required ship fields: id, name, or currentState');
  }

  // Reconstruct ship object for game state
  const ship = {
    id: data.ship.id,
    name: data.ship.name,
    type: data.ship.template.id,
    shipClass: data.ship.template.type,
    ...(data.ship.designation && { designation: data.ship.designation }),

    // Template reference
    template: data.ship.template,

    // Customization
    ...(data.ship.customization && { customization: data.ship.customization }),

    // Current state - structure
    hull: data.ship.currentState.structure.hull.current,
    maxHull: data.ship.currentState.structure.hull.maximum,
    armor: data.ship.currentState.structure.armor.rating,
    armour: data.ship.currentState.structure.armor.rating, // British spelling
    ablatedArmor: data.ship.currentState.structure.armor.ablated || 0,
    ablatedArmour: data.ship.currentState.structure.armor.ablated || 0,
    componentDamage: data.ship.currentState.structure.componentDamage || [],

    // Current state - position
    x: data.ship.currentState.position.x,
    y: data.ship.currentState.position.y,
    facing: data.ship.currentState.position.facing,
    ...(data.ship.currentState.position.velocity && {
      velocity: data.ship.currentState.position.velocity
    }),

    // Current state - crew
    crew: data.ship.currentState.crew.roster,
    casualties: data.ship.currentState.crew.casualties,

    // Current state - power
    powerPlant: data.ship.currentState.power.available,
    powerAllocation: data.ship.currentState.power.allocated,

    // Current state - ammunition
    ammunition: data.ship.currentState.ammunition,

    // Current state - fuel
    fuel: data.ship.currentState.fuel.current,
    fuelCapacity: data.ship.currentState.fuel.maximum,

    // Battle context (if present)
    ...(data.ship.currentState.battle && {
      initiative: data.ship.currentState.battle.initiative,
      hasActed: data.ship.currentState.battle.hasActed,
      targeting: data.ship.currentState.battle.targeting,
      activeEffects: data.ship.currentState.battle.effects
    }),

    // Metadata
    importedFrom: data.exportedBy,
    importDate: new Date().toISOString(),
    originalExportDate: data.exportDate
  };

  return ship;
}

/**
 * Validate ship instance JSON data
 *
 * @param {Object|string} jsonData - JSON data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateShipInstance(jsonData) {
  const errors = [];

  try {
    // Parse if string
    let data;
    if (typeof jsonData === 'string') {
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        return { valid: false, errors: [`JSON parse error: ${error.message}`] };
      }
    } else {
      data = jsonData;
    }

    // Check schema version
    if (!data.schemaVersion) {
      errors.push('Missing schemaVersion');
    } else if (!SUPPORTED_VERSIONS.includes(data.schemaVersion)) {
      errors.push(`Unsupported schema version: ${data.schemaVersion}`);
    }

    // Check required fields
    if (!data.exportDate) errors.push('Missing exportDate');
    if (!data.ship) {
      errors.push('Missing ship object');
    } else {
      if (!data.ship.id) errors.push('Missing ship.id');
      if (!data.ship.name) errors.push('Missing ship.name');
      if (!data.ship.template) {
        errors.push('Missing ship.template');
      } else {
        if (!data.ship.template.id) errors.push('Missing ship.template.id');
        if (!data.ship.template.type) errors.push('Missing ship.template.type');
      }
      if (!data.ship.currentState) {
        errors.push('Missing ship.currentState');
      } else {
        if (!data.ship.currentState.structure) errors.push('Missing ship.currentState.structure');
        if (!data.ship.currentState.position) errors.push('Missing ship.currentState.position');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * ==================================================================
 * BATTLE STATE EXPORT/IMPORT
 * ==================================================================
 */

/**
 * Export complete battle state to JSON format
 *
 * @param {Object} gameState - Complete game state object
 * @param {Object} options - Export options
 * @param {string} options.user - Username of exporter (optional)
 * @param {string} options.battleName - Name/description of battle (optional)
 * @returns {Object} JSON export data conforming to battle-state-export schema
 */
function exportBattleState(gameState, options = {}) {
  if (!gameState || typeof gameState !== 'object') {
    throw new Error('Invalid game state: must be an object');
  }

  const exportData = {
    schemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    exportedBy: {
      application: APP_NAME,
      version: APP_VERSION,
      ...(options.user && { user: options.user })
    },
    battle: {
      ...(options.battleName && { name: options.battleName }),
      ...(options.description && { description: options.description }),

      factions: gameState.factions || [],

      ships: (gameState.ships || []).map(ship => exportShipInstance(ship, { battleContext: true }).ship),

      turn: {
        current: gameState.turn || 1,
        phase: gameState.phase || 'movement',
        initiative: gameState.initiative || []
      },

      environment: {
        location: gameState.location || {},
        conditions: gameState.conditions || {},
        ...(gameState.mapData && { mapData: gameState.mapData })
      },

      history: {
        log: gameState.combatLog || [],
        casualties: gameState.casualties || {},
        ...(gameState.events && { events: gameState.events })
      }
    }
  };

  return exportData;
}

/**
 * Import battle state from JSON format
 *
 * @param {Object|string} jsonData - JSON export data or JSON string
 * @returns {Object} Game state suitable for application
 * @throws {Error} If JSON is invalid or schema version unsupported
 */
function importBattleState(jsonData) {
  // Parse JSON if string provided
  let data;
  if (typeof jsonData === 'string') {
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  } else {
    data = jsonData;
  }

  // Validate schema version
  if (!data.schemaVersion || !SUPPORTED_VERSIONS.includes(data.schemaVersion)) {
    throw new Error(`Unsupported or missing schema version: ${data.schemaVersion}`);
  }

  // Validate required fields
  if (!data.battle) {
    throw new Error('Missing required field: battle');
  }

  // Reconstruct game state
  const gameState = {
    ...(data.battle.name && { battleName: data.battle.name }),
    ...(data.battle.description && { description: data.battle.description }),

    factions: data.battle.factions || [],

    ships: (data.battle.ships || []).map(shipData => {
      // Convert battle ship data to game state format
      return importShipInstance({
        schemaVersion: data.schemaVersion,
        exportDate: data.exportDate,
        exportedBy: data.exportedBy,
        ship: shipData
      });
    }),

    turn: data.battle.turn?.current || 1,
    phase: data.battle.turn?.phase || 'movement',
    initiative: data.battle.turn?.initiative || [],

    location: data.battle.environment?.location || {},
    conditions: data.battle.environment?.conditions || {},
    ...(data.battle.environment?.mapData && { mapData: data.battle.environment.mapData }),

    combatLog: data.battle.history?.log || [],
    casualties: data.battle.history?.casualties || {},
    ...(data.battle.history?.events && { events: data.battle.history.events }),

    // Metadata
    importedFrom: data.exportedBy,
    importDate: new Date().toISOString(),
    originalExportDate: data.exportDate
  };

  return gameState;
}

/**
 * Validate battle state JSON data
 *
 * @param {Object|string} jsonData - JSON data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateBattleState(jsonData) {
  const errors = [];

  try {
    let data;
    if (typeof jsonData === 'string') {
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        return { valid: false, errors: [`JSON parse error: ${error.message}`] };
      }
    } else {
      data = jsonData;
    }

    if (!data.schemaVersion) errors.push('Missing schemaVersion');
    if (!data.exportDate) errors.push('Missing exportDate');
    if (!data.battle) {
      errors.push('Missing battle object');
    } else {
      if (!data.battle.turn) errors.push('Missing battle.turn');
      if (!Array.isArray(data.battle.ships)) errors.push('battle.ships must be an array');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * ==================================================================
 * CHARACTER EXPORT/IMPORT
 * ==================================================================
 */

/**
 * Export character to JSON format
 *
 * @param {Object} character - Character data
 * @param {Object} options - Export options
 * @returns {Object} JSON export data conforming to character-export schema
 */
function exportCharacter(character, options = {}) {
  if (!character || typeof character !== 'object') {
    throw new Error('Invalid character data: must be an object');
  }

  const exportData = {
    schemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    exportedBy: {
      application: APP_NAME,
      version: APP_VERSION,
      ...(options.user && { user: options.user })
    },
    character: {
      name: character.name || 'Unnamed Character',
      ...(character.title && { title: character.title }),
      ...(character.homeworld && { homeworld: character.homeworld }),

      characteristics: character.characteristics || {},
      skills: character.skills || [],
      careers: character.careers || [],
      equipment: character.equipment || {},
      currentState: character.currentState || {}
    }
  };

  return exportData;
}

/**
 * Import character from JSON format
 *
 * @param {Object|string} jsonData - JSON export data or JSON string
 * @returns {Object} Character data suitable for game
 * @throws {Error} If JSON is invalid or schema version unsupported
 */
function importCharacter(jsonData) {
  let data;
  if (typeof jsonData === 'string') {
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  } else {
    data = jsonData;
  }

  if (!data.schemaVersion || !SUPPORTED_VERSIONS.includes(data.schemaVersion)) {
    throw new Error(`Unsupported or missing schema version: ${data.schemaVersion}`);
  }

  if (!data.character) {
    throw new Error('Missing required field: character');
  }

  return {
    ...data.character,
    importedFrom: data.exportedBy,
    importDate: new Date().toISOString(),
    originalExportDate: data.exportDate
  };
}

/**
 * Validate character JSON data
 *
 * @param {Object|string} jsonData - JSON data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCharacter(jsonData) {
  const errors = [];

  try {
    let data;
    if (typeof jsonData === 'string') {
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        return { valid: false, errors: [`JSON parse error: ${error.message}`] };
      }
    } else {
      data = jsonData;
    }

    if (!data.schemaVersion) errors.push('Missing schemaVersion');
    if (!data.exportDate) errors.push('Missing exportDate');
    if (!data.character) {
      errors.push('Missing character object');
    } else {
      if (!data.character.name) errors.push('Missing character.name');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * ==================================================================
 * UTILITY FUNCTIONS
 * ==================================================================
 */

/**
 * Detect schema version from JSON data
 *
 * @param {Object|string} jsonData - JSON data to analyze
 * @returns {string|null} Schema version or null if not found
 */
function detectSchemaVersion(jsonData) {
  try {
    let data;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    return data.schemaVersion || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get list of supported schema versions
 *
 * @returns {string[]} Array of supported version strings
 */
function getSupportedVersions() {
  return [...SUPPORTED_VERSIONS];
}

/**
 * Migrate schema from one version to another
 * (Currently only supports 1.0, placeholder for future migrations)
 *
 * @param {Object} jsonData - JSON data to migrate
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {Object} Migrated data
 */
function migrateSchema(jsonData, fromVersion, toVersion) {
  if (fromVersion === toVersion) {
    return jsonData;
  }

  // Future: Add migration logic here as schemas evolve
  // Example: 1.0 → 1.1, 1.1 → 2.0, etc.

  throw new Error(`Migration from ${fromVersion} to ${toVersion} not implemented`);
}

/**
 * Get schema file path for a given type and version
 *
 * @param {string} type - Schema type: 'ship', 'battle', or 'character'
 * @param {string} version - Schema version (default: current version)
 * @returns {string} Path to schema file
 */
function getSchemaPath(type, version = SCHEMA_VERSION) {
  const schemaFiles = {
    'ship': 'ship-instance-export.schema.json',
    'battle': 'battle-state-export.schema.json',
    'character': 'character-export.schema.json'
  };

  if (!schemaFiles[type]) {
    throw new Error(`Unknown schema type: ${type}. Valid types: ${Object.keys(schemaFiles).join(', ')}`);
  }

  return path.join(__dirname, '..', 'data', 'schemas', schemaFiles[type]);
}

// Module exports
module.exports = {
  // Ship instance
  exportShipInstance,
  importShipInstance,
  validateShipInstance,

  // Battle state
  exportBattleState,
  importBattleState,
  validateBattleState,

  // Character
  exportCharacter,
  importCharacter,
  validateCharacter,

  // Utility
  detectSchemaVersion,
  getSupportedVersions,
  migrateSchema,
  getSchemaPath,

  // Constants
  SCHEMA_VERSION,
  SUPPORTED_VERSIONS
};
