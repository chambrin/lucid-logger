import { describe, it, expect, vi } from 'vitest';
import { createPrettyDestination } from '../src/destinations/pretty.js';
import type { LogRecord } from '../src/core/types.js';

describe('pretty destination', () => {
  // Helper to capture stdout/stderr
  function captureOutput(fn: () => void): { stdout: string; stderr: string } {
    const stdoutWrite = process.stdout.write;
    const stderrWrite = process.stderr.write;

    let stdout = '';
    let stderr = '';

    process.stdout.write = ((chunk: any) => {
      stdout += chunk.toString();
      return true;
    }) as any;

    process.stderr.write = ((chunk: any) => {
      stderr += chunk.toString();
      return true;
    }) as any;

    try {
      fn();
    } finally {
      process.stdout.write = stdoutWrite;
      process.stderr.write = stderrWrite;
    }

    return { stdout, stderr };
  }

  describe('createPrettyDestination', () => {
    it('should format basic log with colors', () => {
      const destination = createPrettyDestination();
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('Test message');
      expect(stdout).toContain('INFO');
      expect(stdout).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/); // Timestamp format
      expect(stdout).toContain('ℹ️'); // Icon
    });

    it('should format log without colors when colorize is false', () => {
      const destination = createPrettyDestination({ colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'warn',
        msg: 'Warning message',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('WARN');
      expect(stdout).toContain('Warning message');
      // No ANSI color codes
      expect(stdout).not.toMatch(/\x1b\[/);
    });

    it('should format log without icons when icons is false', () => {
      const destination = createPrettyDestination({ icons: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'error',
        msg: 'Error message',
      };

      const { stderr } = captureOutput(() => destination.write(record));

      expect(stderr).toContain('ERROR');
      expect(stderr).toContain('Error message');
      expect(stderr).not.toContain('❌');
    });

    it('should format log without timestamp when timestamps is false', () => {
      const destination = createPrettyDestination({ timestamps: false, colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).not.toContain('12:00:00');
      expect(stdout).toContain('INFO');
      expect(stdout).toContain('Test message');
    });

    it('should format log with context', () => {
      const destination = createPrettyDestination({ colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'User login',
        context: { userId: 'u_123', ip: '192.168.1.1' },
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('User login');
      expect(stdout).toContain('userId');
      expect(stdout).toContain('u_123');
      expect(stdout).toContain('ip');
      expect(stdout).toContain('192.168.1.1');
    });

    it('should format log with scopes', () => {
      const destination = createPrettyDestination({ colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'debug',
        msg: 'Payment processed',
        scope: ['billing', 'stripe'],
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('[billing]');
      expect(stdout).toContain('[stripe]');
      expect(stdout).toContain('Payment processed');
    });

    it('should not show scopes when scopes is false', () => {
      const destination = createPrettyDestination({ scopes: false, colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'debug',
        msg: 'Payment processed',
        scope: ['billing', 'stripe'],
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).not.toContain('[billing]');
      expect(stdout).not.toContain('[stripe]');
    });

    it('should format log with service and environment', () => {
      const destination = createPrettyDestination({ colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Application started',
        service: 'api-gateway',
        environment: 'production',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('service=api-gateway');
      expect(stdout).toContain('env=production');
    });

    it('should format error with stack trace', () => {
      const destination = createPrettyDestination({ colorize: false });
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'error',
        msg: 'Payment failed',
        error: {
          name: 'PaymentError',
          message: 'Insufficient funds',
          stack: 'Error: Insufficient funds\n    at processPayment (/app/payment.js:42:15)',
        },
      };

      const { stderr } = captureOutput(() => destination.write(record));

      expect(stderr).toContain('Payment failed');
      expect(stderr).toContain('PaymentError');
      expect(stderr).toContain('Insufficient funds');
      expect(stderr).toContain('processPayment');
    });

    it('should write info logs to stdout', () => {
      const destination = createPrettyDestination();
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Info message',
      };

      const { stdout, stderr } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('Info message');
      expect(stderr).toBe('');
    });

    it('should write error logs to stderr', () => {
      const destination = createPrettyDestination();
      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'error',
        msg: 'Error message',
      };

      const { stdout, stderr } = captureOutput(() => destination.write(record));

      expect(stdout).toBe('');
      expect(stderr).toContain('Error message');
    });

    it('should use custom styles', () => {
      // Custom style function that wraps text in brackets
      const customStyle = (text: string) => `[CUSTOM]${text}[/CUSTOM]`;

      const destination = createPrettyDestination({
        customStyles: { info: customStyle },
      });

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Custom color',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      // Should contain custom style markers
      expect(stdout).toContain('[CUSTOM]');
      expect(stdout).toContain('[/CUSTOM]');
      expect(stdout).toContain('Custom color');
    });

    it('should use custom icons', () => {
      const destination = createPrettyDestination({
        customIcons: { info: '🎉' },
        colorize: false,
      });

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Custom icon',
      };

      const { stdout } = captureOutput(() => destination.write(record));

      expect(stdout).toContain('🎉');
      expect(stdout).not.toContain('ℹ️');
    });

    it('should handle all log levels', () => {
      const destination = createPrettyDestination({ colorize: false, timestamps: false });
      const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

      levels.forEach(level => {
        const record: LogRecord = {
          timestamp: '2024-01-15T12:00:00.000Z',
          level,
          msg: `${level} message`,
        };

        const { stdout, stderr } = captureOutput(() => destination.write(record));
        const output = level === 'error' || level === 'fatal' ? stderr : stdout;

        expect(output).toContain(level.toUpperCase());
        expect(output).toContain(`${level} message`);
      });
    });
  });
});
