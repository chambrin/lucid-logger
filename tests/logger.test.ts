import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../src/core/logger.js';
import type { Destination, LogRecord } from '../src/core/types.js';

describe('logger', () => {
  const fixedTime = '2024-01-15T12:00:00.000Z';
  const timeProvider = () => fixedTime;

  function createMockDestination() {
    const written: LogRecord[] = [];
    const destination: Destination = {
      write: vi.fn((record: LogRecord) => {
        written.push(record);
      }),
    };
    return { destination, written };
  }

  describe('createLogger', () => {
    it('should create a logger with default config', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should log messages at configured level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        level: 'info',
        destinations: [destination],
        timeProvider,
      });

      logger.info('Test info');
      logger.debug('Test debug');

      expect(written).toHaveLength(1);
      expect(written[0]?.msg).toBe('Test info');
    });

    it('should filter logs below configured level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        level: 'warn',
        destinations: [destination],
        timeProvider,
      });

      logger.trace('Test trace');
      logger.debug('Test debug');
      logger.info('Test info');
      logger.warn('Test warn');
      logger.error('Test error');

      expect(written).toHaveLength(2);
      expect(written[0]?.level).toBe('warn');
      expect(written[1]?.level).toBe('error');
    });

    it('should log to multiple destinations', () => {
      const mock1 = createMockDestination();
      const mock2 = createMockDestination();

      const logger = createLogger({
        destinations: [mock1.destination, mock2.destination],
        timeProvider,
      });

      logger.info('Test message');

      expect(mock1.written).toHaveLength(1);
      expect(mock2.written).toHaveLength(1);
      expect(mock1.written[0]?.msg).toBe('Test message');
      expect(mock2.written[0]?.msg).toBe('Test message');
    });

    it('should include service and environment in logs', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        service: 'billing-api',
        environment: 'production',
        destinations: [destination],
        timeProvider,
      });

      logger.info('Test message');

      expect(written[0]?.service).toBe('billing-api');
      expect(written[0]?.environment).toBe('production');
    });

    it('should apply redact hook', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
        redact: (record) => ({
          ...record,
          context: record.context ? { ...record.context, password: '[REDACTED]' } : undefined,
        }),
      });

      logger.info('Login attempt', { username: 'john', password: 'secret123' });

      expect(written[0]?.context).toEqual({
        username: 'john',
        password: '[REDACTED]',
      });
    });
  });

  describe('child logger', () => {
    it('should inherit parent context', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
        defaultContext: { appId: 'app_123' },
      });

      const child = logger.child({ requestId: 'req_456' });
      child.info('Child log');

      expect(written[0]?.context).toEqual({
        appId: 'app_123',
        requestId: 'req_456',
      });
    });

    it('should allow child to override parent context', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
        defaultContext: { userId: 'u_123' },
      });

      const child = logger.child({ userId: 'u_999' });
      child.info('Child log');

      expect(written[0]?.context).toEqual({
        userId: 'u_999',
      });
    });
  });

  describe('scoped logger', () => {
    it('should add scope to logs', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
      });

      const scoped = logger.scope('billing', 'stripe');
      scoped.info('Payment processed');

      expect(written[0]?.scope).toEqual(['billing', 'stripe']);
    });

    it('should stack scopes', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
      });

      const scoped1 = logger.scope('billing');
      const scoped2 = scoped1.scope('stripe');
      scoped2.info('Payment processed');

      expect(written[0]?.scope).toEqual(['billing', 'stripe']);
    });
  });

  describe('withLevel', () => {
    it('should create logger with different level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        level: 'error',
        destinations: [destination],
        timeProvider,
      });

      const debugLogger = logger.withLevel('debug');
      debugLogger.debug('Debug message');

      expect(written).toHaveLength(1);
      expect(written[0]?.level).toBe('debug');
    });
  });

  describe('error handling', () => {
    it('should serialize Error objects', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
      });

      const error = new Error('Something failed');
      logger.error(error);

      expect(written[0]?.error).toEqual({
        name: 'Error',
        message: 'Something failed',
        stack: error.stack,
      });
    });

    it('should handle Error with custom message and context', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        destinations: [destination],
        timeProvider,
      });

      const error = new Error('Original error');
      logger.error(error, 'Payment failed', { userId: 'u_123' });

      expect(written[0]?.msg).toBe('Payment failed');
      expect(written[0]?.context).toEqual({ userId: 'u_123' });
      expect(written[0]?.error?.message).toBe('Original error');
    });
  });

  describe('all log levels', () => {
    it('should support trace level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        level: 'trace',
        destinations: [destination],
        timeProvider,
      });

      logger.trace('Trace message');
      expect(written[0]?.level).toBe('trace');
    });

    it('should support debug level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({
        level: 'debug',
        destinations: [destination],
        timeProvider,
      });

      logger.debug('Debug message');
      expect(written[0]?.level).toBe('debug');
    });

    it('should support info level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({ destinations: [destination], timeProvider });

      logger.info('Info message');
      expect(written[0]?.level).toBe('info');
    });

    it('should support warn level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({ destinations: [destination], timeProvider });

      logger.warn('Warn message');
      expect(written[0]?.level).toBe('warn');
    });

    it('should support error level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({ destinations: [destination], timeProvider });

      logger.error('Error message');
      expect(written[0]?.level).toBe('error');
    });

    it('should support fatal level', () => {
      const { destination, written } = createMockDestination();
      const logger = createLogger({ destinations: [destination], timeProvider });

      logger.fatal('Fatal message');
      expect(written[0]?.level).toBe('fatal');
    });
  });
});
