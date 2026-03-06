import type { Destination, LogRecord } from '../core/types.js';
import type { LogLevel } from '../core/levels.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

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

// Color schemes for each log level
const levelColors: Record<LogLevel, string> = {
  trace: colors.gray,
  debug: colors.cyan,
  info: colors.green,
  warn: colors.yellow,
  error: colors.red,
  fatal: colors.bgRed + colors.white + colors.bold,
  silent: colors.reset,
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
   * Custom color map per level
   */
  customColors?: Partial<Record<LogLevel, string>>;

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
function formatContext(context: unknown): string {
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
      return `${colors.cyan}${key}${colors.reset}=${val}`;
    })
    .join(' ');

  return ` ${colors.dim}{${colors.reset} ${formatted} ${colors.dim}}${colors.reset}`;
}

/**
 * Formats error object for display
 */
function formatError(error: LogRecord['error'], colorize: boolean): string {
  if (!error) return '';

  const errorColor = colorize ? colors.red : '';
  const reset = colorize ? colors.reset : '';
  const dim = colorize ? colors.dim : '';

  let result = `\n${errorColor}${error.name}: ${error.message}${reset}`;

  if (error.stack) {
    // Format stack trace with indentation
    const stackLines = error.stack.split('\n').slice(1); // Skip first line (already shown)
    result += '\n' + stackLines.map(line => `${dim}  ${line}${reset}`).join('\n');
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
    customColors = {},
    customIcons = {},
  } = config;

  // Merge custom colors and icons
  const finalLevelColors = { ...levelColors, ...customColors };
  const finalIcons = { ...icons, ...customIcons };

  return {
    write: (record: LogRecord) => {
      const parts: string[] = [];

      // Timestamp
      if (timestamps) {
        const time = formatTimestamp(record.timestamp);
        const timeColor = colorize ? colors.dim : '';
        const reset = colorize ? colors.reset : '';
        parts.push(`${timeColor}[${time}]${reset}`);
      }

      // Scopes
      if (scopes && record.scope && record.scope.length > 0) {
        const scopeColor = colorize ? colors.magenta : '';
        const reset = colorize ? colors.reset : '';
        const scopeStr = record.scope.map(s => `[${s}]`).join('');
        parts.push(`${scopeColor}${scopeStr}${reset}`);
      }

      // Level with icon
      const levelColor = colorize ? finalLevelColors[record.level] : '';
      const reset = colorize ? colors.reset : '';
      const icon = showIcons ? finalIcons[record.level] + ' ' : '';
      const levelStr = record.level.toUpperCase().padEnd(5);
      parts.push(`${levelColor}${icon}${levelStr}${reset}`);

      // Message
      const msgColor = colorize ? colors.bold : '';
      parts.push(`${msgColor}${record.msg}${reset}`);

      // Context
      if (record.context && Object.keys(record.context).length > 0) {
        parts.push(formatContext(record.context));
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
        const metaColor = colorize ? colors.dim : '';
        parts.push(`${metaColor}(${metadata.join(', ')})${reset}`);
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
