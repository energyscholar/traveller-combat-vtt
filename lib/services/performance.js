/**
 * Performance Metrics Service
 * Tracks connection counts, combat counts, actions, memory usage
 */

// Performance metrics state
const performanceMetrics = {
  connections: { current: 0, peak: 0, total: 0 },
  combats: { current: 0, peak: 0, total: 0 },
  actions: { total: 0, rateLimited: 0 },
  memory: { current: 0, peak: 0 },
  uptime: Date.now()
};

/**
 * Get performance metrics
 * @returns {Object}
 */
function getMetrics() {
  return performanceMetrics;
}

/**
 * Update performance metrics with current values
 * @param {number} connectionCount - Current connection count
 * @param {number} combatCount - Current active combat count
 */
function updateMetrics(connectionCount, combatCount) {
  const mem = process.memoryUsage();
  performanceMetrics.memory.current = Math.round(mem.heapUsed / 1024 / 1024); // MB
  performanceMetrics.memory.peak = Math.max(performanceMetrics.memory.peak, performanceMetrics.memory.current);

  performanceMetrics.connections.current = connectionCount;
  performanceMetrics.connections.peak = Math.max(performanceMetrics.connections.peak, connectionCount);

  performanceMetrics.combats.current = combatCount;
  performanceMetrics.combats.peak = Math.max(performanceMetrics.combats.peak, combatCount);
}

/**
 * Increment total action count
 */
function incrementActions() {
  performanceMetrics.actions.total++;
}

/**
 * Increment rate-limited action count
 */
function incrementRateLimited() {
  performanceMetrics.actions.rateLimited++;
}

/**
 * Increment total connections count
 */
function incrementTotalConnections() {
  performanceMetrics.connections.total++;
}

/**
 * Increment total combats count
 */
function incrementTotalCombats() {
  performanceMetrics.combats.total++;
}

/**
 * Get formatted metrics for logging
 * @returns {Object}
 */
function getFormattedMetrics() {
  return {
    connections: `${performanceMetrics.connections.current} (peak: ${performanceMetrics.connections.peak})`,
    combats: `${performanceMetrics.combats.current} (peak: ${performanceMetrics.combats.peak})`,
    actions: `${performanceMetrics.actions.total} (rate-limited: ${performanceMetrics.actions.rateLimited})`,
    memory: `${performanceMetrics.memory.current}MB (peak: ${performanceMetrics.memory.peak}MB)`,
    uptime: `${Math.round((Date.now() - performanceMetrics.uptime) / 1000 / 60)}min`
  };
}

/**
 * Reset metrics (for testing)
 */
function resetMetrics() {
  performanceMetrics.connections = { current: 0, peak: 0, total: 0 };
  performanceMetrics.combats = { current: 0, peak: 0, total: 0 };
  performanceMetrics.actions = { total: 0, rateLimited: 0 };
  performanceMetrics.memory = { current: 0, peak: 0 };
  performanceMetrics.uptime = Date.now();
}

module.exports = {
  performanceMetrics,
  getMetrics,
  updateMetrics,
  incrementActions,
  incrementRateLimited,
  incrementTotalConnections,
  incrementTotalCombats,
  getFormattedMetrics,
  resetMetrics
};
