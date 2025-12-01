/**
 * Rate Limiter Service
 * Prevents action spam by limiting actions per time window
 */

const state = require('../state');
const performance = require('./performance');

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_ACTIONS = 2; // 2 actions per second

/**
 * Check if action is allowed based on rate limit
 * @param {string} socketId - Socket ID to check
 * @returns {boolean} True if action allowed, false if rate limited
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const timestamps = state.getSocketTimestamps(socketId);

  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  // Check if rate limit exceeded
  if (recentTimestamps.length >= RATE_LIMIT_MAX_ACTIONS) {
    performance.incrementRateLimited();
    return false; // Rate limit exceeded
  }

  // Add current timestamp
  recentTimestamps.push(now);
  state.setSocketTimestamps(socketId, recentTimestamps);
  performance.incrementActions();

  return true; // Action allowed
}

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ACTIONS,
  checkRateLimit
};
