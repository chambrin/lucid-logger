/**
 * Available log levels
 */
export const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Converts a string level to its numeric value
 */
export function getLevelValue(level: LogLevel): number {
  return LOG_LEVELS[level];
}

/**
 * Checks if a log should be displayed based on the configured level
 */
export function shouldLog(logLevel: LogLevel, configuredLevel: LogLevel): boolean {
  return getLevelValue(logLevel) >= getLevelValue(configuredLevel);
}
