import { describe, it, expect } from 'vitest';
import { createLogRecord, serializeError } from '../src/core/record.js';

describe('record', () => {
  const fixedTime = '2024-01-15T12:00:00.000Z';
  const timeProvider = () => fixedTime;

  describe('createLogRecord', () => {
    it('should create a basic log record with message', () => {
      const record = createLogRecord('info', 'Test message', undefined, undefined, {
        timeProvider,
      });

      expect(record).toEqual({
        timestamp: fixedTime,
        level: 'info',
        msg: 'Test message',
      });
    });

    it('should include context when provided', () => {
      const record = createLogRecord('info', 'Test message', { userId: 'u_123' }, undefined, {
        timeProvider,
      });

      expect(record).toEqual({
        timestamp: fixedTime,
        level: 'info',
        msg: 'Test message',
        context: { userId: 'u_123' },
      });
    });

    it('should include service and environment when provided', () => {
      const record = createLogRecord('info', 'Test message', undefined, undefined, {
        timeProvider,
        service: 'billing-api',
        environment: 'production',
      });

      expect(record).toEqual({
        timestamp: fixedTime,
        level: 'info',
        msg: 'Test message',
        service: 'billing-api',
        environment: 'production',
      });
    });

    it('should include scope when provided', () => {
      const record = createLogRecord('info', 'Test message', undefined, undefined, {
        timeProvider,
        scope: ['billing', 'stripe'],
      });

      expect(record).toEqual({
        timestamp: fixedTime,
        level: 'info',
        msg: 'Test message',
        scope: ['billing', 'stripe'],
      });
    });

    it('should handle Error as first argument', () => {
      const error = new Error('Something failed');
      const record = createLogRecord('error', error, undefined, undefined, {
        timeProvider,
      });

      expect(record.timestamp).toBe(fixedTime);
      expect(record.level).toBe('error');
      expect(record.msg).toBe('Something failed');
      expect(record.error).toEqual({
        name: 'Error',
        message: 'Something failed',
        stack: error.stack,
      });
    });

    it('should handle Error with custom message', () => {
      const error = new Error('Original error');
      const record = createLogRecord('error', error, 'Custom message', undefined, {
        timeProvider,
      });

      expect(record.msg).toBe('Custom message');
      expect(record.error?.message).toBe('Original error');
    });

    it('should handle Error with custom message and context', () => {
      const error = new Error('Original error');
      const record = createLogRecord('error', error, 'Custom message', { userId: 'u_123' }, {
        timeProvider,
      });

      expect(record.msg).toBe('Custom message');
      expect(record.context).toEqual({ userId: 'u_123' });
      expect(record.error?.message).toBe('Original error');
    });

    it('should merge defaultContext with provided context', () => {
      const record = createLogRecord('info', 'Test message', { requestId: 'req_456' }, undefined, {
        timeProvider,
        defaultContext: { userId: 'u_123', service: 'api' },
      });

      expect(record.context).toEqual({
        userId: 'u_123',
        service: 'api',
        requestId: 'req_456',
      });
    });

    it('should override defaultContext with provided context', () => {
      const record = createLogRecord('info', 'Test message', { userId: 'u_999' }, undefined, {
        timeProvider,
        defaultContext: { userId: 'u_123' },
      });

      expect(record.context).toEqual({
        userId: 'u_999',
      });
    });
  });

  describe('serializeError', () => {
    it('should serialize Error with name, message, and stack', () => {
      const error = new Error('Test error');
      const serialized = serializeError(error);

      expect(serialized.name).toBe('Error');
      expect(serialized.message).toBe('Test error');
      expect(serialized.stack).toBeDefined();
      expect(serialized.stack).toContain('Test error');
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const serialized = serializeError(error);

      expect(serialized.name).toBe('CustomError');
      expect(serialized.message).toBe('Custom error message');
    });
  });
});
