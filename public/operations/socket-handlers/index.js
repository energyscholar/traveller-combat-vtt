/**
 * AR-201: Socket Handler Registry
 *
 * Central registry for socket event handlers.
 * Handlers register themselves via registerHandler().
 * App.js calls initAllHandlers() to wire up all events.
 *
 * Pattern: Each handler module imports registerHandler and self-registers.
 */

// Handler registry - maps event names to handler functions
const handlerRegistry = new Map();

/**
 * Register a socket event handler
 * @param {string} event - Socket event name (e.g., 'ops:campaigns')
 * @param {Function} handler - Handler function (data, state, helpers) => void
 */
export function registerHandler(event, handler) {
  if (handlerRegistry.has(event)) {
    console.warn(`[SocketRegistry] Overwriting handler for: ${event}`);
  }
  handlerRegistry.set(event, handler);
}

/**
 * Initialize all registered handlers on a socket
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} state - App state object
 * @param {Object} helpers - Helper functions (showNotification, renderFn, etc.)
 */
export function initAllHandlers(socket, state, helpers) {
  for (const [event, handler] of handlerRegistry) {
    socket.on(event, (data) => {
      try {
        handler(data, state, helpers);
      } catch (err) {
        console.error(`[SocketRegistry] Error in handler for ${event}:`, err);
      }
    });
  }
  console.log(`[SocketRegistry] Initialized ${handlerRegistry.size} handlers`);
}

/**
 * Get list of registered handler event names (for testing)
 * @returns {string[]} Array of event names
 */
export function getRegisteredHandlers() {
  return Array.from(handlerRegistry.keys());
}

/**
 * Get handler count (for testing)
 * @returns {number} Number of registered handlers
 */
export function getHandlerCount() {
  return handlerRegistry.size;
}

/**
 * Clear all handlers (for testing)
 */
export function clearHandlers() {
  handlerRegistry.clear();
}

// Export for debugging
export { handlerRegistry };
