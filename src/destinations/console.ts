import type { Destination, LogRecord } from '../core/types.js';

/**
 * Creates a console destination that writes JSON to stdout/stderr
 */
export function createConsoleDestination(): Destination {
  return {
    write: (record: LogRecord) => {
      const json = JSON.stringify(record);

      // Errors and fatals go to stderr, rest to stdout
      if (record.level === 'error' || record.level === 'fatal') {
        process.stderr.write(json + '\n');
      } else {
        process.stdout.write(json + '\n');
      }
    },
  };
}
