import type { LogLevel } from './levels.js';

/**
 * Log record structure
 */
export interface LogRecord<C = Record<string, unknown>> {
  timestamp: string;
  level: LogLevel;
  msg: string;
  context?: C;
  service?: string;
  environment?: string;
  scope?: string[];
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Interface for a log destination
 */
export interface Destination {
  write: (record: LogRecord<any>) => void | Promise<void>;
  flush?: () => Promise<void>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig<C = Record<string, unknown>> {
  level?: LogLevel;
  mode?: 'production' | 'development' | 'test';
  service?: string;
  environment?: string;
  defaultContext?: C;
  destinations?: Destination[];
  redact?: (record: LogRecord<C>) => LogRecord<C>;
  timeProvider?: () => string;
}

/**
 * Public logger interface
 */
export interface Logger<C = Record<string, unknown>> {
  trace(msg: string, context?: C): void;
  trace(error: Error, msg?: string, context?: C): void;

  debug(msg: string, context?: C): void;
  debug(error: Error, msg?: string, context?: C): void;

  info(msg: string, context?: C): void;
  info(error: Error, msg?: string, context?: C): void;

  warn(msg: string, context?: C): void;
  warn(error: Error, msg?: string, context?: C): void;

  error(msg: string, context?: C): void;
  error(error: Error, msg?: string, context?: C): void;

  fatal(msg: string, context?: C): void;
  fatal(error: Error, msg?: string, context?: C): void;

  child<NC = C>(context: Partial<NC>): Logger<NC>;
  scope(...names: string[]): Logger<C>;
  withLevel(level: LogLevel): Logger<C>;
}
