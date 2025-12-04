/**
 * Shared Context for Operations Socket Handlers
 * Provides shared state, helpers, and dependencies for all handler modules
 */

const operations = require('../../operations');
const { validators, rateLimiter } = operations;
const { checkRateLimit } = rateLimiter;
const { socket: socketLog } = require('../../logger');
const { updateConnectionActivity } = require('../../services/connection-manager');
const { createHandler } = require('../utils');

// SECURITY: Error sanitization helper
// In production: generic category hints only
// In dev/test: full error details for debugging
const isDev = process.env.NODE_ENV !== 'production';
function sanitizeError(category, error) {
  const detail = isDev ? `: ${error.message}` : '';
  socketLog.error(`[${category}] ${error.message}`, error.stack);
  return { message: `${category} error${detail}` };
}

// Connection tracking for slot reservations and live status
// Maps socketId -> { campaignId, accountId, shipId, role }
const connectedSockets = new Map();
// Maps accountId -> socketId (for slot reservation)
const slotReservations = new Map();

// Combat mode tracking (Autorun 12)
// Maps campaignId -> { inCombat: boolean, combatId: string, startedAt: timestamp }
const campaignCombatState = new Map();

/**
 * Get connected players for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Array} Connected socket info
 */
function getConnectedPlayers(campaignId) {
  const players = [];
  for (const [socketId, session] of connectedSockets) {
    if (session.campaignId === campaignId) {
      players.push({
        socketId,
        accountId: session.accountId,
        shipId: session.shipId,
        role: session.role
      });
    }
  }
  return players;
}

/**
 * Check if a slot is reserved
 * @param {string} accountId - Player slot ID
 * @returns {boolean} True if reserved by another socket
 */
function isSlotReserved(accountId) {
  return slotReservations.has(accountId);
}

/**
 * Create context object for handler modules
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} opsSession - Mutable session state for this socket
 * @returns {Object} Context object with all shared dependencies
 */
function createContext(socket, io, opsSession) {
  return {
    socket,
    io,
    opsSession,
    operations,
    validators,
    checkRateLimit,
    socketLog,
    sanitizeError,
    createHandler,
    updateConnectionActivity,
    connectedSockets,
    slotReservations,
    campaignCombatState,
    getConnectedPlayers,
    isSlotReserved
  };
}

module.exports = {
  createContext,
  connectedSockets,
  slotReservations,
  campaignCombatState,
  getConnectedPlayers,
  isSlotReserved,
  sanitizeError,
  socketLog,
  operations,
  validators,
  checkRateLimit,
  createHandler,
  updateConnectionActivity
};
