// Winston-based logging system for Traveller Combat VTT
const winston = require('winston');
const config = require('../config');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;

    // Add context if provided (e.g., [SERVER], [CLIENT], [COMBAT])
    if (context) {
      log += ` [${context}]`;
    }

    log += `: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.logging.colorize
        ? winston.format.combine(winston.format.colorize(), logFormat)
        : logFormat
    })
  ]
});

// Add file transport if enabled
if (config.logging.enableFileLogging) {
  const fs = require('fs');
  const path = require('path');

  // Ensure log directory exists
  if (!fs.existsSync(config.logging.logDirectory)) {
    fs.mkdirSync(config.logging.logDirectory, { recursive: true });
  }

  logger.add(new winston.transports.File({
    filename: path.join(config.logging.logDirectory, 'error.log'),
    level: 'error'
  }));

  logger.add(new winston.transports.File({
    filename: path.join(config.logging.logDirectory, 'combined.log')
  }));
}

// Convenience methods with context
const createContextLogger = (context) => ({
  error: (message, meta = {}) => logger.error(message, { context, ...meta }),
  warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
  info: (message, meta = {}) => logger.info(message, { context, ...meta }),
  debug: (message, meta = {}) => logger.debug(message, { context, ...meta })
});

// Export logger and context logger factory
module.exports = {
  logger,
  createLogger: createContextLogger,

  // Pre-configured loggers for common contexts
  server: createContextLogger('SERVER'),
  client: createContextLogger('CLIENT'),
  combat: createContextLogger('COMBAT'),
  socket: createContextLogger('SOCKET'),
  game: createContextLogger('GAME')
};
