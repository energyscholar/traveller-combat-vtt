/**
 * Socket Handler Utilities
 *
 * Centralized exports for socket handler utility functions
 */

const { createHandler } = require('./handler-wrapper');
const { safeEmit, safeEmitToPlayers } = require('./safe-emit');

module.exports = {
  createHandler,
  safeEmit,
  safeEmitToPlayers
};
