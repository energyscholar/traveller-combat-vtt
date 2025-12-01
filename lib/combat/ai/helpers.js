/**
 * AI Opponent Helper Functions
 * Utility functions for managing AI opponents in solo mode
 */

// AI opponent ID constant
const AI_OPPONENT_ID = 'dummy_ai';

/**
 * Create a dummy AI opponent for single-player testing
 * @param {Object} player1 - The human player object
 * @returns {Object} Dummy player object with opposite ship
 */
function createDummyPlayer(player1) {
  // Choose opposite ship from player 1 (Scout vs Free Trader)
  const oppositeShip = player1.spaceSelection.ship === 'scout' ? 'free_trader' : 'scout';

  return {
    id: AI_OPPONENT_ID,
    spaceSelection: {
      ship: oppositeShip,
      range: player1.spaceSelection.range,
      ready: true
    }
  };
}

/**
 * Check if a player ID belongs to the AI opponent
 * @param {string} playerId - Player ID to check
 * @returns {boolean} True if this is the AI opponent
 */
function isDummyAI(playerId) {
  return playerId === AI_OPPONENT_ID;
}

/**
 * Safely emit to a player, skipping AI opponents
 * @param {Object} io - Socket.io server instance
 * @param {string} playerId - Player/socket ID
 * @param {string} eventName - Event name to emit
 * @param {*} data - Data to send
 * @returns {boolean} True if emitted successfully
 */
function emitToPlayer(io, playerId, eventName, data) {
  if (isDummyAI(playerId)) {
    // Don't emit to dummy AI - it has no socket
    return false;
  }

  const socket = io.sockets.sockets.get(playerId);
  if (socket && socket.connected) {
    socket.emit(eventName, data);
    return true;
  }
  return false;
}

module.exports = {
  AI_OPPONENT_ID,
  createDummyPlayer,
  isDummyAI,
  emitToPlayer
};
