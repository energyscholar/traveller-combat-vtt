/**
 * Game State Management
 * Tracks legacy ground combat game state (ships, rounds, turns)
 */

const { SHIPS, CREW } = require('../combat');

/**
 * Initialize ammo for a ship based on its weapons
 * @param {Object} ship - Ship definition
 * @returns {Object} Ammo state
 */
function initializeAmmo(ship) {
  const ammo = {};
  if (ship.weapons) {
    ship.weapons.forEach(weapon => {
      if (weapon.ammo !== null && weapon.ammo !== undefined) {
        ammo[weapon.id] = weapon.ammo;
      }
    });
  }
  return ammo;
}

/**
 * Create default ship state
 * @param {string} shipType - 'scout' or 'free_trader'
 * @returns {Object} Ship state
 */
function createShipState(shipType) {
  const ship = SHIPS[shipType];
  const crew = CREW[shipType];

  const defaultPositions = {
    scout: { q: 2, r: 2 },
    free_trader: { q: 7, r: 7 }
  };

  return {
    hull: ship.hull,
    maxHull: ship.maxHull,
    armor: ship.armor,
    pilotSkill: ship.pilotSkill,
    ammo: initializeAmmo(ship),
    crew: {
      pilot: { ...crew[0] },
      gunner: { ...crew[1] },
      engineer: { ...crew[2] }
    },
    position: { ...defaultPositions[shipType] },
    movement: ship.movement
  };
}

// Ship state - tracks hull, armor, ammo, crew, position for each ship
const shipState = {
  scout: createShipState('scout'),
  free_trader: createShipState('free_trader')
};

// Game state - tracks rounds, turns, initiative
const gameState = {
  currentRound: 0,
  currentTurn: null, // 'scout' or 'free_trader'
  initiative: {
    scout: null,
    free_trader: null
  },
  roundHistory: []
};

/**
 * Get ship state
 * @returns {Object}
 */
function getShipState() {
  return shipState;
}

/**
 * Get game state
 * @returns {Object}
 */
function getGameState() {
  return gameState;
}

/**
 * Reset ship states to full hull, ammo, and starting positions
 */
function resetShipStates() {
  const scoutState = createShipState('scout');
  const freeTraderState = createShipState('free_trader');

  Object.assign(shipState.scout, scoutState);
  Object.assign(shipState.free_trader, freeTraderState);
}

/**
 * Reset game state (rounds and turns)
 */
function resetGameState() {
  gameState.currentRound = 0;
  gameState.currentTurn = null;
  gameState.initiative.scout = null;
  gameState.initiative.free_trader = null;
  gameState.roundHistory = [];
}

/**
 * Get available ship for new player
 * @param {Map} connections - Active connections
 * @returns {string|null} Ship type or null if none available
 */
function getAvailableShip(connections) {
  const assignedShips = Array.from(connections.values())
    .map(conn => conn.ship)
    .filter(ship => ship !== null);

  if (!assignedShips.includes('scout')) return 'scout';
  if (!assignedShips.includes('free_trader')) return 'free_trader';
  return null; // No ships available (spectator mode)
}

/**
 * Get all current ship assignments
 * @param {Map} connections - Active connections
 * @returns {Object} Assignments { scout: playerId, free_trader: playerId }
 */
function getShipAssignments(connections) {
  const assignments = { scout: null, free_trader: null };
  connections.forEach((conn, socketId) => {
    if (conn.ship === 'scout') assignments.scout = conn.id;
    if (conn.ship === 'free_trader') assignments.free_trader = conn.id;
  });
  return assignments;
}

module.exports = {
  // State objects
  shipState,
  gameState,

  // Getters
  getShipState,
  getGameState,

  // Reset functions
  resetShipStates,
  resetGameState,

  // Ship assignment helpers
  getAvailableShip,
  getShipAssignments,

  // Utility
  initializeAmmo,
  createShipState
};
