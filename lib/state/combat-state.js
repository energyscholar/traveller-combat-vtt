/**
 * Combat State Management
 * Tracks active space combat sessions
 */

// Track active space combat sessions
const activeCombats = new Map();

// Combat state constants
const COMBAT_INACTIVE_TIMEOUT_MS = 300000; // 5 minutes
const COMBAT_HISTORY_LIMIT = 10; // Keep last 10 rounds of history

/**
 * Get all active combats
 * @returns {Map}
 */
function getActiveCombats() {
  return activeCombats;
}

/**
 * Get a specific combat
 * @param {string} combatId
 * @returns {Object|undefined}
 */
function getCombat(combatId) {
  return activeCombats.get(combatId);
}

/**
 * Set a combat
 * @param {string} combatId
 * @param {Object} combat
 */
function setCombat(combatId, combat) {
  activeCombats.set(combatId, combat);
}

/**
 * Delete a combat
 * @param {string} combatId
 * @returns {boolean}
 */
function deleteCombat(combatId) {
  return activeCombats.delete(combatId);
}

/**
 * Clear all combats (for testing)
 */
function clearCombats() {
  activeCombats.clear();
}

/**
 * Update combat activity timestamp
 * @param {string} combatId
 */
function updateCombatActivity(combatId) {
  const combat = activeCombats.get(combatId);
  if (combat) {
    combat.lastActivity = Date.now();
  }
}

/**
 * Trim combat history to last N rounds
 * @param {Object} combat
 */
function trimCombatHistory(combat) {
  if (combat.history && combat.history.length > COMBAT_HISTORY_LIMIT) {
    combat.history = combat.history.slice(-COMBAT_HISTORY_LIMIT);
  }
}

/**
 * Get inactive timeout value
 * @returns {number}
 */
function getInactiveTimeout() {
  return COMBAT_INACTIVE_TIMEOUT_MS;
}

/**
 * Get history limit value
 * @returns {number}
 */
function getHistoryLimit() {
  return COMBAT_HISTORY_LIMIT;
}

module.exports = {
  // Combat map
  getActiveCombats,
  getCombat,
  setCombat,
  deleteCombat,
  clearCombats,

  // Activity tracking
  updateCombatActivity,
  trimCombatHistory,

  // Constants
  getInactiveTimeout,
  getHistoryLimit,
  COMBAT_INACTIVE_TIMEOUT_MS,
  COMBAT_HISTORY_LIMIT
};
