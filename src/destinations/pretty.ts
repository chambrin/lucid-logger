import chalk from 'chalk';
import type { Destination, LogRecord } from '../core/types.js';
import type { LogLevel } from '../core/levels.js';

// Icons for each log level
const icons: Record<LogLevel, string> = {
  trace: '🔍',
  debug: '🐛',
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌',
  fatal: '💀',
  silent: '',
};

// Chalk color functions for each log level
const levelStyles: Record<LogLevel, (text: string) => string> = {
  trace: chalk.gray,
  debug: chalk.cyan,
  info: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
  fatal: chalk.bgRed.white.bold,
  silent: (text: string) => text,
};

export interface PrettyDestinationConfig {
  /**
   * Whether to colorize output (default: true)
   */
  colorize?: boolean;

  /**
   * Whether to show icons (default: true)
   */
  icons?: boolean;

  /**
   * Whether to show timestamps (default: true)
   */
  timestamps?: boolean;

  /**
   * Whether to show scopes (default: true)
   */
  scopes?: boolean;

  /**
   * Custom chalk style functions per level
   */
  customStyles?: Partial<Record<LogLevel, (text: string) => string>>;

  /**
   * Custom icons per level
   */
  customIcons?: Partial<Record<LogLevel, string>>;
}

/**
 * Formats a timestamp in human-readable format
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formats context object for display
 */
function formatContext(context: unknown, colorize: boolean): string {
  if (!context || typeof context !== 'object') {
    return '';
  }

  const obj = context as Record<string, unknown>;
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return '';
  }

  // Format as compact object
  const formatted = entries
    .map(([key, value]) => {
      const val = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
      const keyStr = colorize ? chalk.cyan(key) : key;
      return `${keyStr}=${val}`;
    })
    .join(' ');

  const braces = colorize ? chalk.dim('{}') : '{}';
  return ` ${braces[0]} ${formatted} ${braces[1]}`;
}

/**
 * Formats error object for display
 */
function formatError(error: LogRecord['error'], colorize: boolean): string {
  if (!error) return '';

  const errorText = `${error.name}: ${error.message}`;
  const formattedError = colorize ? chalk.red(errorText) : errorText;

  let result = `\n${formattedError}`;

  if (error.stack) {
    // Format stack trace with indentation
    const stackLines = error.stack.split('\n').slice(1); // Skip first line (already shown)
    const formattedStack = stackLines.map(line => {
      const indented = `  ${line}`;
      return colorize ? chalk.dim(indented) : indented;
    });
    result += '\n' + formattedStack.join('\n');
  }

  return result;
}

/**
 * Creates a pretty destination that outputs human-readable colored logs
 */
export function createPrettyDestination(config: PrettyDestinationConfig = {}): Destination {
  const {
    colorize = true,
    icons: showIcons = true,
    timestamps = true,
    scopes = true,
    customStyles = {},
    customIcons = {},
  } = config;

  // Merge custom styles and icons
  const finalLevelStyles = { ...levelStyles, ...customStyles };
  const finalIcons = { ...icons, ...customIcons };

  return {
    write: (record: LogRecord) => {
      const parts: string[] = [];

      // Timestamp
      if (timestamps) {
        const time = formatTimestamp(record.timestamp);
        const formattedTime = colorize ? chalk.dim(`[${time}]`) : `[${time}]`;
        parts.push(formattedTime);
      }

      // Scopes
      if (scopes && record.scope && record.scope.length > 0) {
        const scopeStr = record.scope.map(s => `[${s}]`).join('');
        const formattedScope = colorize ? chalk.magenta(scopeStr) : scopeStr;
        parts.push(formattedScope);
      }

      // Level with icon
      const icon = showIcons ? finalIcons[record.level] + ' ' : '';
      const levelStr = record.level.toUpperCase().padEnd(5);
      const levelText = icon + levelStr;
      const formattedLevel = colorize ? finalLevelStyles[record.level](levelText) : levelText;
      parts.push(formattedLevel);

      // Message
      const formattedMsg = colorize ? chalk.bold(record.msg) : record.msg;
      parts.push(formattedMsg);

      // Context
      if (record.context && Object.keys(record.context).length > 0) {
        parts.push(formatContext(record.context, colorize));
      }

      // Service & Environment (if present)
      const metadata: string[] = [];
      if (record.service) {
        metadata.push(`service=${record.service}`);
      }
      if (record.environment) {
        metadata.push(`env=${record.environment}`);
      }
      if (metadata.length > 0) {
        const metaStr = `(${metadata.join(', ')})`;
        const formattedMeta = colorize ? chalk.dim(metaStr) : metaStr;
        parts.push(formattedMeta);
      }

      // Build the log line
      let output = parts.join(' ');

      // Error (on separate lines)
      if (record.error) {
        output += formatError(record.error, colorize);
      }

      // Write to appropriate stream
      if (record.level === 'error' || record.level === 'fatal') {
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }
    },
  };
}
