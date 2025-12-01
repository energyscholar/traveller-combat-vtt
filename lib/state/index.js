/**
 * State Module Index
 * Central export for all application state
 */

const connections = require('./connections');
const combatState = require('./combat-state');
const gameState = require('./game-state');

module.exports = {
  // Connection state
  ...connections,

  // Combat state (space combat)
  ...combatState,

  // Game state (legacy ground combat)
  ...gameState
};
