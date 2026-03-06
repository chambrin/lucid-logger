import { shouldLog, type LogLevel } from './levels.js';
import { createLogRecord } from './record.js';
import type { Logger, LoggerConfig, Destination, LogRecord } from './types.js';

class LoggerImpl<C = Record<string, unknown>> implements Logger<C> {
  private config: Required<Omit<LoggerConfig<C>, 'destinations' | 'redact' | 'defaultContext'>> & {
    destinations: Destination[];
    redact?: (record: LogRecord<C>) => LogRecord<C>;
    defaultContext?: C;
  };

  private scope_: string[] = [];

  constructor(config: LoggerConfig<C> = {}) {
    this.config = {
      level: config.level || 'info',
      mode: config.mode || 'production',
      service: config.service || '',
      environment: config.environment || '',
      timeProvider: config.timeProvider || (() => new Date().toISOString()),
      destinations: config.destinations || [],
      redact: config.redact,
      defaultContext: config.defaultContext,
    };
  }

  private log(level: LogLevel, ...args: unknown[]): void {
    // Filter based on configured level
    if (!shouldLog(level, this.config.level)) {
      return;
    }

    // Parse arguments (overloads)
    const [first, second, third] = args;
    let record: LogRecord<C>;

    if (first instanceof Error) {
      record = createLogRecord<C>(
        level,
        first,
        second as string | C,
        third as C,
        {
          timeProvider: this.config.timeProvider,
          service: this.config.service,
          environment: this.config.environment,
          scope: this.scope_.length > 0 ? this.scope_ : undefined,
          defaultContext: this.config.defaultContext,
        }
      );
    } else {
      record = createLogRecord<C>(
        level,
        first as string,
        second as C,
        undefined,
        {
          timeProvider: this.config.timeProvider,
          service: this.config.service,
          environment: this.config.environment,
          scope: this.scope_.length > 0 ? this.scope_ : undefined,
          defaultContext: this.config.defaultContext,
        }
      );
    }

    // Apply redaction hook
    const finalRecord = this.config.redact ? this.config.redact(record) : record;

    // Send to destinations
    for (const destination of this.config.destinations) {
      destination.write(finalRecord);
    }
  }

  trace(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('trace', msgOrError, contextOrMsg, maybeContext);
  }

  debug(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('debug', msgOrError, contextOrMsg, maybeContext);
  }

  info(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('info', msgOrError, contextOrMsg, maybeContext);
  }

  warn(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('warn', msgOrError, contextOrMsg, maybeContext);
  }

  error(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('error', msgOrError, contextOrMsg, maybeContext);
  }

  fatal(msgOrError: string | Error, contextOrMsg?: C | string, maybeContext?: C): void {
    this.log('fatal', msgOrError, contextOrMsg, maybeContext);
  }

  child<NC = C>(context: Partial<NC>): Logger<NC> {
    const childLogger = new LoggerImpl<NC>({
      level: this.config.level,
      mode: this.config.mode,
      service: this.config.service,
      environment: this.config.environment,
      timeProvider: this.config.timeProvider,
      destinations: this.config.destinations,
      defaultContext: {
        ...this.config.defaultContext,
        ...context,
      } as NC,
    });
    childLogger.scope_ = [...this.scope_];
    return childLogger;
  }

  scope(...names: string[]): Logger<C> {
    const scopedLogger = new LoggerImpl<C>(this.config);
    scopedLogger.scope_ = [...this.scope_, ...names];
    return scopedLogger;
  }

  withLevel(level: LogLevel): Logger<C> {
    return new LoggerImpl<C>({
      ...this.config,
      level,
    });
  }
}

/**
 * Creates a logger instance
 */
export function createLogger<C = Record<string, unknown>>(
  config: LoggerConfig<C> = {}
): Logger<C> {
  return new LoggerImpl<C>(config);
}
