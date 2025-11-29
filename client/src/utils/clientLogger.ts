import type { Socket } from 'socket.io-client';

/**
 * Log levels for client-side logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structure for a log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: unknown;
  userAgent?: string;
  url?: string;
}

/**
 * Client-side logger with socket transmission and buffering
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Buffering logs before socket connection
 * - Automatic socket transmission when connected
 * - Captures unhandled errors and promise rejections
 * - Singleton pattern for global access
 *
 * Usage:
 * ```typescript
 * import { clientLogger } from './utils/clientLogger';
 *
 * // Initialize with socket (call once when socket connects)
 * clientLogger.init(socket);
 *
 * // Log messages
 * clientLogger.debug('Debug message', { someData: 123 });
 * clientLogger.info('Game started');
 * clientLogger.warn('Low ammo warning', { ammo: 2 });
 * clientLogger.error('Connection failed', { error: err });
 * ```
 */
class ClientLogger {
  private socket: Socket | null = null;
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;
  private errorHandlersInstalled = false;

  /**
   * Initialize the logger with a socket connection
   * Also installs global error handlers if not already installed
   */
  init(socket: Socket): void {
    this.socket = socket;

    // Flush buffered logs to server
    this.flushBuffer();

    // Install error handlers once
    if (!this.errorHandlersInstalled) {
      this.installErrorHandlers();
      this.errorHandlersInstalled = true;
    }
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Console output for development
    this.logToConsole(entry);

    // Buffer or transmit
    if (this.socket?.connected) {
      this.transmit(entry);
    } else {
      this.bufferLog(entry);
    }
  }

  /**
   * Output log to browser console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data);
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }

  /**
   * Buffer a log entry (used when socket not connected)
   */
  private bufferLog(entry: LogEntry): void {
    this.buffer.push(entry);

    // Prevent buffer overflow
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // Remove oldest entry
    }
  }

  /**
   * Transmit a log entry to server via socket
   */
  private transmit(entry: LogEntry): void {
    if (this.socket?.connected) {
      this.socket.emit('clientLog', entry);
    }
  }

  /**
   * Flush buffered logs to server
   */
  private flushBuffer(): void {
    if (this.socket?.connected && this.buffer.length > 0) {
      this.info(`Flushing ${this.buffer.length} buffered logs`);

      for (const entry of this.buffer) {
        this.transmit(entry);
      }

      this.buffer = [];
    }
  }

  /**
   * Install global error handlers
   */
  private installErrorHandlers(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event: ErrorEvent) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });
  }
}

/**
 * Singleton instance of ClientLogger
 */
export const clientLogger = new ClientLogger();
