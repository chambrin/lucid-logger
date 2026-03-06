// Core
export { createLogger } from './core/logger.js';
export type { Logger, LoggerConfig, LogRecord, Destination } from './core/types.js';
export type { LogLevel } from './core/levels.js';

// Destinations
export { createConsoleDestination } from './destinations/console.js';
