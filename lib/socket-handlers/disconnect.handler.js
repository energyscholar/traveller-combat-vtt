/**
 * Disconnect Handler
 * Handles socket disconnect events for Operations VTT:
 * - Release any held crew roles
 * - Remove player from connections
 * - Broadcast disconnect to other players
 */

const { socket: socketLog } = require('../logger');

/**
 * Create disconnect handler
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} deps - Dependencies { connections, activeSessions, connectionId }
 */
function createHandler(socket, io, deps) {
  const {
    connections,
    activeSessions,
    connectionId
  } = deps;

  return function handleDisconnect() {
    const conn = connections.get(socket.id);
    if (!conn) {
      socketLog.warn(`Disconnect for unknown socket: ${socket.id}`);
      return;
    }

    const duration = Date.now() - conn.connected;
    socketLog.info(`Player ${connectionId} disconnected after ${duration}ms`);

    // Clean up Operations session if player was in one
    if (conn.opsSession) {
      const { campaignId, slotName, role } = conn.opsSession;
      socketLog.info(`[OPS] Player leaving campaign ${campaignId}, slot: ${slotName || 'guest'}, role: ${role || 'none'}`);

      // Notify other players in the campaign
      socket.to(`campaign:${campaignId}`).emit('ops:playerLeft', {
        socketId: socket.id,
        slotName: slotName,
        role: role
      });
    }

    // Remove from connections
    connections.delete(socket.id);
    socketLog.info(`${connections.size} connections remaining`);
  };
}

module.exports = {
  createHandler
};
