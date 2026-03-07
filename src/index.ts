// Core
export { createLogger } from './core/logger.js';
export type { Logger, LoggerConfig, LogRecord, Destination } from './core/types.js';
export type { LogLevel } from './core/levels.js';

// Destinations
export { createConsoleDestination } from './destinations/console.js';
export { createFileDestination } from './destinations/file.js';
export type { FileDestinationConfig } from './destinations/file.js';
export { createPrettyDestination } from './destinations/pretty.js';
export type { PrettyDestinationConfig } from './destinations/pretty.js';

// Utilities
export {
  redactSensitiveFields,
  createRedactionHook,
  redactByPattern,
  DEFAULT_SENSITIVE_FIELDS,
  REDACTION_MASK,
} from './utils/redaction.js';
