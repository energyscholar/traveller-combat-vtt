/**
 * Disconnect Handler
 * Handles socket disconnect events:
 * - Clean up active combat if player was in one
 * - Award victory to opponent on disconnect
 * - Remove player from connections
 * - Broadcast playerLeft event
 */

const { socket: socketLog, combat: combatLog } = require('../logger');

/**
 * Create disconnect handler
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} deps - Dependencies { connections, activeCombats, connectionId, getShipAssignments }
 */
function createHandler(socket, io, deps) {
  const {
    connections,
    activeCombats,
    connectionId,
    getShipAssignments
  } = deps;

  return function handleDisconnect() {
    const conn = connections.get(socket.id);
    const duration = Date.now() - conn.connected;
    const disconnectedShip = conn.ship;

    socketLog.info(` Player ${connectionId} (${disconnectedShip || 'spectator'}) disconnected after ${duration}ms`);

    // Check if disconnecting player is in active space combat
    let combatFound = null;
    for (const [combatId, combat] of activeCombats.entries()) {
      if (combat.player1.id === socket.id || combat.player2.id === socket.id) {
        combatFound = { id: combatId, combat };
        break;
      }
    }

    if (combatFound) {
      combatLog.info(`[SPACE:FORFEIT] Player ${connectionId} disconnected during active combat ${combatFound.id}`);

      // Determine winner (the player who DIDN'T disconnect)
      const isPlayer1 = combatFound.combat.player1.id === socket.id;
      const winnerId = isPlayer1 ? combatFound.combat.player2.id : combatFound.combat.player1.id;
      const winnerSocket = io.sockets.sockets.get(winnerId);

      // Clean up combat state
      activeCombats.delete(combatFound.id);
      combatLog.info(`[SPACE:COMBAT] Combat ${combatFound.id} ended due to disconnect. ${activeCombats.size} combats remaining.`);

      // Notify winner with null check
      if (winnerSocket && winnerSocket.connected) {
        winnerSocket.emit('space:combatEnd', {
          winner: isPlayer1 ? 'player2' : 'player1',
          loser: isPlayer1 ? 'player1' : 'player2',
          reason: 'opponent_disconnected',
          finalHull: {
            player1: combatFound.combat.player1.hull,
            player2: combatFound.combat.player2.hull
          },
          rounds: combatFound.combat.round
        });
        combatLog.info(`[SPACE:VICTORY] Opponent disconnected, victory awarded to ${winnerId}`);
      } else {
        socketLog.error(` Winner also disconnected, combat ${combatFound.id} ends with no notification`);
      }
    }

    connections.delete(socket.id);
    socketLog.info(` ${connections.size} players remaining`);

    // Broadcast updated game state to remaining players
    socket.broadcast.emit('playerLeft', {
      playerId: connectionId,
      ship: disconnectedShip,
      totalPlayers: connections.size,
      assignments: getShipAssignments()
    });
  };
}

module.exports = {
  createHandler
};
