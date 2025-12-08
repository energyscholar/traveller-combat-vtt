// Traveller Combat VTT - Configuration
// Central configuration file for all application settings

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Logging Configuration
  logging: {
    // Log level: error, warn, info, debug
    level: process.env.LOG_LEVEL || 'debug',

    // Enable/disable client log forwarding to server
    clientLogging: process.env.CLIENT_LOGGING !== 'false', // Default: true

    // Log file settings (for future use)
    enableFileLogging: process.env.LOG_TO_FILE === 'true', // Default: false
    logDirectory: process.env.LOG_DIR || './logs',

    // Console output colorization
    colorize: process.env.LOG_COLORIZE !== 'false' // Default: true
  },

  // Game Configuration
  game: {
    // Turn timer in seconds
    turnTimer: parseInt(process.env.TURN_TIMER) || 30,

    // Auto-assign ships on connection
    autoAssignShips: process.env.AUTO_ASSIGN !== 'false', // Default: true

    // Default starting range
    defaultRange: process.env.DEFAULT_RANGE || 'Medium'
  },

  // Environment
  env: process.env.NODE_ENV || 'development',

  // Feature flags (for future use)
  features: {
    testMode: process.env.ENABLE_TEST_MODE === 'true',
    debugMode: process.env.DEBUG === 'true'
  },

  // AR-28: Encyclopedia Data Cache
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',  // Default: true
    parsecRadius: parseInt(process.env.CACHE_PARSEC_RADIUS) || 6,  // 1-10 parsecs
    delaySeconds: parseInt(process.env.CACHE_DELAY_SECONDS) || 30,  // Seconds between fetches
    maxDurationMinutes: parseInt(process.env.CACHE_MAX_DURATION) || 5,  // Auto-stop after
    ttlDays: parseInt(process.env.CACHE_TTL_DAYS) || 365,  // Cache expiration (1 year for subsector data)
    debug: process.env.CACHE_DEBUG === 'true'  // Show debug toasts on map
  }
};
