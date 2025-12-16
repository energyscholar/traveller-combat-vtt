/**
 * AR-151a: Debug Configuration Module
 * SECURITY: Debug logging only enabled on localhost
 */

// Node.js compatibility for testing
const hostname = typeof location !== 'undefined' ? location.hostname : 'localhost';
export const DEBUG = ['localhost', '127.0.0.1'].includes(hostname);
export const debugLog = (...args) => DEBUG && console.log(...args);
export const debugWarn = (...args) => DEBUG && console.warn(...args);
export const debugError = (...args) => DEBUG && console.error(...args);
