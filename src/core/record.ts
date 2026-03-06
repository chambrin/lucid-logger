import type { LogLevel } from './levels.js';
import type { LogRecord } from './types.js';

/**
 * Creates a default ISO 8601 UTC timestamp
 */
export function defaultTimeProvider(): string {
  return new Date().toISOString();
}

/**
 * Serializes an Error into a structured object
 */
export function serializeError(error: Error): NonNullable<LogRecord['error']> {
  return {
    name: error.name,
    message: error.message,
    ...(error.stack ? { stack: error.stack } : {}),
  };
}

/**
 * Creates a LogRecord
 */
export function createLogRecord<C = Record<string, unknown>>(
  level: LogLevel,
  msgOrError: string | Error,
  contextOrMsg?: C | string,
  maybeContext?: C,
  options: {
    timeProvider?: () => string;
    service?: string;
    environment?: string;
    scope?: string[];
    defaultContext?: C;
  } = {}
): LogRecord<C> {
  const timeProvider = options.timeProvider || defaultTimeProvider;

  let msg: string;
  let context: C | undefined;
  let error: LogRecord['error'] | undefined;

  // Handle overloads: error first or message first
  if (msgOrError instanceof Error) {
    error = serializeError(msgOrError);
    msg = typeof contextOrMsg === 'string' ? contextOrMsg : msgOrError.message;
    context = typeof contextOrMsg === 'string' ? maybeContext : (contextOrMsg as C);
  } else {
    msg = msgOrError;
    context = contextOrMsg as C;
  }

  // Merge default context with provided context
  const finalContext = options.defaultContext || context
    ? ({ ...options.defaultContext, ...context } as C)
    : undefined;

  const record: LogRecord<C> = {
    timestamp: timeProvider(),
    level,
    msg,
  };

  if (finalContext && Object.keys(finalContext).length > 0) {
    record.context = finalContext;
  }

  if (options.service) {
    record.service = options.service;
  }

  if (options.environment) {
    record.environment = options.environment;
  }

  if (options.scope && options.scope.length > 0) {
    record.scope = options.scope;
  }

  if (error) {
    record.error = error;
  }

  return record;
}
