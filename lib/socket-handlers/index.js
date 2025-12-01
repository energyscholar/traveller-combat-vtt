/**
 * Socket Handlers - MVC Pattern
 * Central registration of all socket event handlers
 */

const combatHandlers = require('./combat.handlers');
const operationsHandlers = require('./operations.handlers');
const utilityHandlers = require('./utility.handlers');

/**
 * Register all socket handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} state - Shared application state
 * @param {number} connectionId - Connection ID for logging
 */
function registerHandlers(socket, io, state, connectionId) {
  // Register utility handlers (logging, ping, feedback)
  utilityHandlers.register(socket, io, connectionId);

  // Register combat handlers (space combat, ground combat, AI)
  combatHandlers.register(socket, io, state);

  // Register operations handlers (campaigns, players, bridge)
  operationsHandlers.register(socket, io, state);
}

module.exports = {
  registerHandlers
};
