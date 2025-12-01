/**
 * Services Module Index
 * Central export for all application services
 */

const performance = require('./performance');
const rateLimiter = require('./rate-limiter');
const connectionManager = require('./connection-manager');

module.exports = {
  // Performance metrics
  ...performance,

  // Rate limiting
  ...rateLimiter,

  // Connection management
  ...connectionManager
};
