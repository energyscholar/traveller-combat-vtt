/**
 * Socket Handlers - MVC Pattern
 * Central registration of all socket event handlers
 */

const combatHandlers = require('./combat.handlers');
const operationsHandlers = require('./operations.handlers');

/**
 * Register all socket handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} state - Shared application state
 */
function registerHandlers(socket, io, state) {
  // Register combat handlers (space combat, ground combat, AI)
  combatHandlers.register(socket, io, state);

  // Register operations handlers (campaigns, players, bridge)
  operationsHandlers.register(socket, io, state);
}

module.exports = {
  registerHandlers
};
