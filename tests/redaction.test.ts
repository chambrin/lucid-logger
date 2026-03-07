import { describe, it, expect } from 'vitest';
import {
  redactSensitiveFields,
  createRedactionHook,
  redactByPattern,
  DEFAULT_SENSITIVE_FIELDS,
  REDACTION_MASK,
} from '../src/utils/redaction.js';
import type { LogRecord } from '../src/core/types.js';

describe('redaction utilities', () => {
  describe('redactSensitiveFields', () => {
    it('should redact default sensitive fields', () => {
      const context = {
        userId: 'u_123',
        password: 'secret123',
        token: 'abc-def-ghi',
        apiKey: 'sk_live_123',
        name: 'John Doe',
      };

      const redacted = redactSensitiveFields(context);

      expect(redacted.userId).toBe('u_123');
      expect(redacted.name).toBe('John Doe');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
    });

    it('should redact custom sensitive fields', () => {
      const context = {
        userId: 'u_123',
        email: 'user@example.com',
        internalId: 'secret-id',
      };

      const redacted = redactSensitiveFields(context, ['email', 'internalId']);

      expect(redacted.userId).toBe('u_123');
      expect(redacted.email).toBe('[REDACTED]');
      expect(redacted.internalId).toBe('[REDACTED]');
    });

    it('should use custom mask', () => {
      const context = {
        password: 'secret123',
      };

      const redacted = redactSensitiveFields(context, ['password'], '***');

      expect(redacted.password).toBe('***');
    });

    it('should handle nested objects', () => {
      const context = {
        user: {
          id: 'u_123',
          credentials: {
            password: 'secret123',
            token: 'abc-def',
          },
        },
      };

      const redacted = redactSensitiveFields(context);

      expect(redacted.user).toBeDefined();
      expect((redacted.user as any).id).toBe('u_123');
      expect((redacted.user as any).credentials.password).toBe('[REDACTED]');
      expect((redacted.user as any).credentials.token).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const context = {
        users: [
          { id: 'u_1', password: 'secret1' },
          { id: 'u_2', password: 'secret2' },
        ],
      };

      const redacted = redactSensitiveFields(context);

      expect((redacted.users as any)[0].id).toBe('u_1');
      expect((redacted.users as any)[0].password).toBe('[REDACTED]');
      expect((redacted.users as any)[1].id).toBe('u_2');
      expect((redacted.users as any)[1].password).toBe('[REDACTED]');
    });

    it('should be case-insensitive', () => {
      const context = {
        PASSWORD: 'secret1',
        Password: 'secret2',
        ApiKey: 'key123',
        API_KEY: 'key456',
      };

      const redacted = redactSensitiveFields(context);

      expect(redacted.PASSWORD).toBe('[REDACTED]');
      expect(redacted.Password).toBe('[REDACTED]');
      expect(redacted.ApiKey).toBe('[REDACTED]');
      expect(redacted.API_KEY).toBe('[REDACTED]');
    });

    it('should handle partial matches', () => {
      const context = {
        userPassword: 'secret1',
        passwordHash: 'secret2',
        myApiKeyValue: 'key123',
      };

      const redacted = redactSensitiveFields(context);

      expect(redacted.userPassword).toBe('[REDACTED]');
      expect(redacted.passwordHash).toBe('[REDACTED]');
      expect(redacted.myApiKeyValue).toBe('[REDACTED]');
    });

    it('should not mutate original object', () => {
      const context = {
        password: 'secret123',
        userId: 'u_123',
      };

      const original = { ...context };
      redactSensitiveFields(context);

      expect(context).toEqual(original);
    });

    it('should handle empty object', () => {
      const redacted = redactSensitiveFields({});
      expect(redacted).toEqual({});
    });

    it('should handle non-object input', () => {
      const redacted = redactSensitiveFields(null as any);
      expect(redacted).toBeNull();
    });
  });

  describe('createRedactionHook', () => {
    it('should create a redaction hook that works with LogRecord', () => {
      const hook = createRedactionHook(['password', 'token']);

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'User login',
        context: {
          userId: 'u_123',
          password: 'secret123',
          token: 'abc-def',
        },
      };

      const redacted = hook(record);

      expect(redacted.context?.userId).toBe('u_123');
      expect(redacted.context?.password).toBe('[REDACTED]');
      expect(redacted.context?.token).toBe('[REDACTED]');
    });

    it('should use custom mask in hook', () => {
      const hook = createRedactionHook(['password'], '***HIDDEN***');

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test',
        context: { password: 'secret' },
      };

      const redacted = hook(record);
      expect(redacted.context?.password).toBe('***HIDDEN***');
    });

    it('should handle record without context', () => {
      const hook = createRedactionHook();

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test',
      };

      const redacted = hook(record);
      expect(redacted.context).toBeUndefined();
    });

    it('should preserve other record fields', () => {
      const hook = createRedactionHook();

      const record: LogRecord = {
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'error',
        msg: 'Error occurred',
        service: 'api',
        environment: 'production',
        scope: ['auth', 'login'],
        error: {
          name: 'AuthError',
          message: 'Invalid credentials',
        },
        context: { password: 'secret' },
      };

      const redacted = hook(record);

      expect(redacted.timestamp).toBe(record.timestamp);
      expect(redacted.level).toBe(record.level);
      expect(redacted.msg).toBe(record.msg);
      expect(redacted.service).toBe(record.service);
      expect(redacted.environment).toBe(record.environment);
      expect(redacted.scope).toEqual(record.scope);
      expect(redacted.error).toEqual(record.error);
    });
  });

  describe('redactByPattern', () => {
    it('should redact values matching a pattern', () => {
      const context = {
        email: 'user@example.com',
        ssn: '123-45-6789',
        name: 'John Doe',
      };

      const redacted = redactByPattern(context, /\d{3}-\d{2}-\d{4}/);

      expect(redacted.email).toBe('user@example.com');
      expect(redacted.name).toBe('John Doe');
      expect(redacted.ssn).toBe('[REDACTED]');
    });

    it('should redact credit card numbers', () => {
      const context = {
        cardNumber: '4532-1234-5678-9010',
        userId: 'u_123',
      };

      const redacted = redactByPattern(context, /\d{4}-\d{4}-\d{4}-\d{4}/);

      expect(redacted.userId).toBe('u_123');
      expect(redacted.cardNumber).toBe('[REDACTED]');
    });

    it('should use custom mask', () => {
      const context = {
        ssn: '123-45-6789',
      };

      const redacted = redactByPattern(context, /\d{3}-\d{2}-\d{4}/, '***');

      expect(redacted.ssn).toBe('***');
    });

    it('should handle nested objects with patterns', () => {
      const context = {
        user: {
          ssn: '123-45-6789',
          name: 'John Doe',
        },
      };

      const redacted = redactByPattern(context, /\d{3}-\d{2}-\d{4}/);

      expect((redacted.user as any).name).toBe('John Doe');
      expect((redacted.user as any).ssn).toBe('[REDACTED]');
    });

    it('should handle arrays with patterns', () => {
      const context = {
        transactions: [
          { card: '4532-1234-5678-9010', amount: 100 },
          { card: '5432-9876-5432-1098', amount: 200 },
        ],
      };

      const redacted = redactByPattern(context, /\d{4}-\d{4}-\d{4}-\d{4}/);

      expect((redacted.transactions as any)[0].card).toBe('[REDACTED]');
      expect((redacted.transactions as any)[0].amount).toBe(100);
      expect((redacted.transactions as any)[1].card).toBe('[REDACTED]');
      expect((redacted.transactions as any)[1].amount).toBe(200);
    });

    it('should not mutate original object', () => {
      const context = {
        ssn: '123-45-6789',
      };

      const original = { ...context };
      redactByPattern(context, /\d{3}-\d{2}-\d{4}/);

      expect(context).toEqual(original);
    });
  });

  describe('DEFAULT_SENSITIVE_FIELDS', () => {
    it('should include common sensitive field names', () => {
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('password');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('token');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('apiKey');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('secret');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('cardNumber');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('cvv');
      expect(DEFAULT_SENSITIVE_FIELDS).toContain('ssn');
    });
  });

  describe('REDACTION_MASK', () => {
    it('should be the default mask value', () => {
      expect(REDACTION_MASK).toBe('[REDACTED]');
    });
  });
});
