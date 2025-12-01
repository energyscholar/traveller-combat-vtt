/**
 * Utility Socket Handlers
 * Handles general utility socket events:
 * - client:log - Client-side logging relay
 * - ping - Latency check
 * - player:feedback - User feedback collection
 */

const { server: log, client: clientLog, socket: socketLog } = require('../logger');

/**
 * Register utility handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {number} connectionId - Connection ID for logging
 */
function register(socket, io, connectionId) {
  // ======== CLIENT LOGGING HANDLER ========
  // Receive logs from client and log them on server
  socket.on('client:log', (data) => {
    const { level, message, meta, playerId } = data;
    const playerInfo = playerId ? `Player ${playerId}` : `Socket ${socket.id.substring(0, 8)}`;

    // Log using appropriate level
    switch (level) {
      case 'error':
        clientLog.error(`${playerInfo}: ${message}`, meta);
        break;
      case 'warn':
        clientLog.warn(`${playerInfo}: ${message}`, meta);
        break;
      case 'info':
        clientLog.info(`${playerInfo}: ${message}`, meta);
        break;
      case 'debug':
      default:
        clientLog.debug(`${playerInfo}: ${message}`, meta);
        break;
    }
  });

  // ======== PLAYER FEEDBACK HANDLER ========
  // Receive player feedback and log with special marker for easy parsing
  socket.on('player:feedback', (data) => {
    const { feedback, timestamp, context } = data;
    const playerInfo = `Socket ${socket.id.substring(0, 8)}`;

    // SECURITY: Validate and sanitize feedback
    if (!feedback || typeof feedback !== 'string') {
      socketLog.warn(` Invalid feedback from ${connectionId}: not a string`);
      return;
    }

    // Limit feedback length (prevent DoS via huge strings)
    const MAX_FEEDBACK_LENGTH = 2000;
    const sanitizedFeedback = feedback.substring(0, MAX_FEEDBACK_LENGTH).trim();

    if (sanitizedFeedback.length === 0) {
      socketLog.warn(` Empty feedback from ${connectionId}`);
      return;
    }

    // Strip dangerous characters that could break log parsing
    // Remove control characters, null bytes, and log injection attempts
    const safeFeedback = sanitizedFeedback
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\n/g, ' ')              // Convert newlines to spaces
      .replace(/\r/g, '')               // Remove carriage returns
      .replace(/\t/g, ' ')              // Convert tabs to spaces
      .replace(/\\/g, '\\\\')           // Escape backslashes
      .replace(/"/g, '\\"');            // Escape quotes

    // Validate context object
    const safeContext = {};
    if (context && typeof context === 'object') {
      // Only allow specific whitelisted properties
      if (context.ship && typeof context.ship === 'string') {
        safeContext.ship = context.ship.substring(0, 50);
      }
      if (context.round && typeof context.round === 'number') {
        safeContext.round = Math.floor(context.round);
      }
      if (context.hull && typeof context.hull === 'string') {
        safeContext.hull = context.hull.substring(0, 20);
      }
    }

    // Log with special marker [PLAYER_FEEDBACK] for easy grep/parsing
    log.info(`[PLAYER_FEEDBACK] ${playerInfo}: ${safeFeedback}`, {
      timestamp: timestamp || new Date().toISOString(),
      socketId: socket.id,
      context: safeContext,
      feedbackLength: safeFeedback.length
    });

    socketLog.info(` Player feedback received from ${connectionId} (${safeFeedback.length} chars)`);
  });

  // ======== PING HANDLER ========
  // Respond to ping requests with timestamp
  socket.on('ping', (data) => {
    socket.emit('pong', {
      timestamp: Date.now(),
      clientTimestamp: data?.timestamp
    });
  });
}

module.exports = {
  register
};
