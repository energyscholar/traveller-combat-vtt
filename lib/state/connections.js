/**
 * Connection State Management
 * Tracks socket connections and rate limiting
 */

// Track connections and ship assignments
let connectionCount = 0;
const connections = new Map();

// Rate limiting - track action timestamps per socket
const actionTimestamps = new Map();

/**
 * Get current connection count
 * @returns {number}
 */
function getConnectionCount() {
  return connectionCount;
}

/**
 * Increment connection count
 * @returns {number} New count
 */
function incrementConnectionCount() {
  return ++connectionCount;
}

/**
 * Reset connection count (for testing)
 */
function resetConnectionCount() {
  connectionCount = 0;
}

/**
 * Get all connections
 * @returns {Map}
 */
function getConnections() {
  return connections;
}

/**
 * Get a specific connection
 * @param {string} socketId
 * @returns {Object|undefined}
 */
function getConnection(socketId) {
  return connections.get(socketId);
}

/**
 * Set a connection
 * @param {string} socketId
 * @param {Object} data
 */
function setConnection(socketId, data) {
  connections.set(socketId, data);
}

/**
 * Delete a connection
 * @param {string} socketId
 * @returns {boolean}
 */
function deleteConnection(socketId) {
  actionTimestamps.delete(socketId); // Clean up rate limit data
  return connections.delete(socketId);
}

/**
 * Clear all connections (for testing)
 */
function clearConnections() {
  connections.clear();
  actionTimestamps.clear();
}

/**
 * Get action timestamps for rate limiting
 * @returns {Map}
 */
function getActionTimestamps() {
  return actionTimestamps;
}

/**
 * Get timestamps for a specific socket
 * @param {string} socketId
 * @returns {Array}
 */
function getSocketTimestamps(socketId) {
  return actionTimestamps.get(socketId) || [];
}

/**
 * Set timestamps for a socket
 * @param {string} socketId
 * @param {Array} timestamps
 */
function setSocketTimestamps(socketId, timestamps) {
  actionTimestamps.set(socketId, timestamps);
}

module.exports = {
  // Connection count
  getConnectionCount,
  incrementConnectionCount,
  resetConnectionCount,

  // Connections map
  getConnections,
  getConnection,
  setConnection,
  deleteConnection,
  clearConnections,

  // Rate limiting
  getActionTimestamps,
  getSocketTimestamps,
  setSocketTimestamps
};
