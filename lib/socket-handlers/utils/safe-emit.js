/**
 * Safe Emit Utility
 *
 * Provides safe socket emission that checks connection status before emitting
 */

const { socket: socketLog } = require('../../logger');

/**
 * Safely emit an event to a socket, checking if it's connected first
 *
 * @param {Object} socket - Socket.io socket instance
 * @param {string} event - Event name to emit
 * @param {*} data - Data to send with the event
 * @param {Object} [logger=socketLog] - Logger instance to use
 * @returns {boolean} True if emit succeeded, false if socket disconnected
 */
function safeEmit(socket, event, data, logger = socketLog) {
  if (!socket || !socket.connected) {
    logger.warn(`[SAFE-EMIT] Cannot emit ${event}: socket disconnected`);
    return false;
  }

  try {
    socket.emit(event, data);
    return true;
  } catch (error) {
    logger.error(`[SAFE-EMIT] Error emitting ${event}:`, error);
    return false;
  }
}

/**
 * Safely emit an event to multiple sockets (e.g., all players in a campaign)
 *
 * @param {Array<Object>} sockets - Array of socket instances
 * @param {string} event - Event name to emit
 * @param {*} data - Data to send with the event
 * @param {Object} [logger=socketLog] - Logger instance to use
 * @returns {number} Number of successful emissions
 */
function safeEmitToPlayers(sockets, event, data, logger = socketLog) {
  if (!Array.isArray(sockets)) {
    logger.warn('[SAFE-EMIT] safeEmitToPlayers: sockets must be an array');
    return 0;
  }

  let successCount = 0;
  for (const socket of sockets) {
    if (safeEmit(socket, event, data, logger)) {
      successCount++;
    }
  }

  logger.debug(`[SAFE-EMIT] Emitted ${event} to ${successCount}/${sockets.length} sockets`);
  return successCount;
}

module.exports = {
  safeEmit,
  safeEmitToPlayers
};
