import { createWriteStream, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Destination, LogRecord } from '../core/types.js';

export interface FileDestinationConfig {
  /**
   * Path to the log file
   */
  path: string;

  /**
   * Maximum file size in bytes before rotation (optional)
   * Default: no rotation
   */
  maxSize?: number;

  /**
   * Whether to append to existing file or overwrite
   * Default: true (append)
   */
  append?: boolean;
}

/**
 * Creates a file destination that writes JSON logs to a file
 */
export function createFileDestination(config: FileDestinationConfig | string): Destination {
  const options = typeof config === 'string' ? { path: config } : config;
  const { path, maxSize, append = true } = options;

  // Ensure directory exists
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let stream = createWriteStream(path, { flags: append ? 'a' : 'w' });
  let currentSize = existsSync(path) && append ? statSync(path).size : 0;

  const rotateIfNeeded = () => {
    if (!maxSize) return;

    if (currentSize >= maxSize) {
      // Close current stream
      stream.end();

      // Rotate: rename current file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = `${path}.${timestamp}`;

      try {
        renameSync(path, rotatedPath);
      } catch (error) {
        // If rotation fails, continue writing to current file
        console.error('Failed to rotate log file:', error);
      }

      // Create new stream
      stream = createWriteStream(path, { flags: 'w' });
      currentSize = 0;
    }
  };

  return {
    write: (record: LogRecord) => {
      const json = JSON.stringify(record) + '\n';
      const size = Buffer.byteLength(json, 'utf8');

      rotateIfNeeded();

      stream.write(json);
      currentSize += size;
    },

    flush: async () => {
      return new Promise((resolve, reject) => {
        stream.once('finish', resolve);
        stream.once('error', reject);
        stream.end();
      });
    },
  };
}
