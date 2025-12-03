/**
 * Handler Wrapper Utility
 *
 * Provides a consistent pattern for socket event handlers with:
 * - Try-catch error handling
 * - Logging
 * - Support for both callback and emit response patterns
 */

const { socket: socketLog } = require('../../logger');

/**
 * Creates a wrapped handler function with consistent error handling
 *
 * @param {Function} operation - The operation to execute (receives data parameter)
 * @param {Object} options - Configuration options
 * @param {string} options.eventName - Name of the event for logging (e.g., 'ops:getCampaigns')
 * @param {string} [options.logPrefix='OPS'] - Prefix for log messages
 * @param {Function} [options.successCallback] - Optional callback to execute on success (receives result)
 * @param {string} [options.errorEvent] - Event to emit on error (defaults to 'ops:error')
 * @param {string} [options.successEvent] - Event to emit on success (if using emit pattern)
 *
 * @returns {Function} Wrapped handler function (socket, data, callback) => void
 */
function createHandler(operation, options = {}) {
  const {
    eventName,
    logPrefix = 'OPS',
    successCallback,
    errorEvent = 'ops:error',
    successEvent
  } = options;

  return function wrappedHandler(socket, data, callback) {
    try {
      // Execute the operation
      const result = operation(data);

      // Handle callback pattern (Puppeteer tests)
      if (callback && typeof callback === 'function') {
        callback({ success: true, ...result });
      }

      // Handle emit pattern
      if (successEvent) {
        socket.emit(successEvent, result);
      }

      // Execute optional success callback
      if (successCallback) {
        successCallback(result);
      }

      // Log success
      if (eventName) {
        socketLog.info(`[${logPrefix}] ${eventName} completed successfully`);
      }
    } catch (error) {
      // Handle callback pattern error
      if (callback && typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }

      // Handle emit pattern error
      socket.emit(errorEvent, {
        message: `Failed to handle ${eventName || 'operation'}`,
        error: error.message
      });

      // Log error
      if (eventName) {
        socketLog.error(`[${logPrefix}] Error in ${eventName}:`, error);
      }
    }
  };
}

module.exports = { createHandler };
