import type { LogRecord } from '../core/types.js';

/**
 * Default sensitive field names that should be redacted
 */
export const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'creditCard',
  'credit_card',
];

/**
 * Redaction mask to replace sensitive values
 */
export const REDACTION_MASK = '[REDACTED]';

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Check if a field name matches a sensitive pattern (case-insensitive)
 */
function isSensitiveField(fieldName: string, sensitiveFields: string[]): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return sensitiveFields.some(pattern => {
    const lowerPattern = pattern.toLowerCase();
    // Exact match or contains pattern
    return lowerFieldName === lowerPattern || lowerFieldName.includes(lowerPattern);
  });
}

/**
 * Recursively redact sensitive fields in an object
 */
function redactObject(
  obj: Record<string, unknown>,
  sensitiveFields: string[],
  mask: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key, sensitiveFields)) {
      result[key] = mask;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>, sensitiveFields, mask);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? redactObject(item as Record<string, unknown>, sensitiveFields, mask)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Redact sensitive fields from a context object
 *
 * @param context - The context object to redact
 * @param sensitiveFields - Array of field names to redact (case-insensitive)
 * @param mask - The mask to replace sensitive values with (default: '[REDACTED]')
 * @returns A new object with sensitive fields redacted
 *
 * @example
 * ```typescript
 * const context = {
 *   userId: 'u_123',
 *   password: 'secret123',
 *   apiKey: 'sk_live_abc123'
 * };
 *
 * const redacted = redactSensitiveFields(context, ['password', 'apiKey']);
 * // { userId: 'u_123', password: '[REDACTED]', apiKey: '[REDACTED]' }
 * ```
 */
export function redactSensitiveFields(
  context: Record<string, unknown>,
  sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
  mask: string = REDACTION_MASK
): Record<string, unknown> {
  if (!context || typeof context !== 'object') {
    return context;
  }

  // Deep clone to avoid mutating the original
  const cloned = deepClone(context);
  return redactObject(cloned, sensitiveFields, mask);
}

/**
 * Create a redaction hook for use with createLogger
 *
 * @param sensitiveFields - Array of field names to redact
 * @param mask - The mask to replace sensitive values with
 * @returns A redaction hook function
 *
 * @example
 * ```typescript
 * import { createLogger } from 'lucid-logger';
 * import { createRedactionHook } from 'lucid-logger/utils';
 *
 * const logger = createLogger({
 *   redact: createRedactionHook(['password', 'token', 'cardNumber']),
 * });
 *
 * logger.info('User login', {
 *   userId: 'u_123',
 *   password: 'secret123'  // Will be redacted
 * });
 * ```
 */
export function createRedactionHook(
  sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
  mask: string = REDACTION_MASK
): (record: LogRecord) => LogRecord {
  return (record: LogRecord) => ({
    ...record,
    context: record.context
      ? redactSensitiveFields(record.context, sensitiveFields, mask)
      : undefined,
  });
}

/**
 * Redact values that match a regex pattern in a context object
 *
 * @param context - The context object to redact
 * @param pattern - Regex pattern to match sensitive values
 * @param mask - The mask to replace sensitive values with
 * @returns A new object with matching values redacted
 *
 * @example
 * ```typescript
 * const context = {
 *   email: 'user@example.com',
 *   ssn: '123-45-6789',
 *   name: 'John Doe'
 * };
 *
 * // Redact SSN pattern
 * const redacted = redactByPattern(context, /\d{3}-\d{2}-\d{4}/);
 * // { email: 'user@example.com', ssn: '[REDACTED]', name: 'John Doe' }
 * ```
 */
export function redactByPattern(
  context: Record<string, unknown>,
  pattern: RegExp,
  mask: string = REDACTION_MASK
): Record<string, unknown> {
  if (!context || typeof context !== 'object') {
    return context;
  }

  const cloned = deepClone(context);
  const redactValue = (value: unknown): unknown => {
    if (typeof value === 'string' && pattern.test(value)) {
      return mask;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return redactByPattern(value as Record<string, unknown>, pattern, mask);
    }
    if (Array.isArray(value)) {
      return value.map(item => redactValue(item));
    }
    return value;
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(cloned)) {
    result[key] = redactValue(value);
  }
  return result;
}
