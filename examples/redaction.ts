import {
  createLogger,
  createConsoleDestination,
  createPrettyDestination,
  redactSensitiveFields,
  createRedactionHook,
  redactByPattern,
  DEFAULT_SENSITIVE_FIELDS,
} from '../src/index.js';

console.log('=== Redaction Examples ===\n');

// Example 1: Basic redaction with default sensitive fields
console.log('1. Basic redaction with default fields:');
const basicLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: createRedactionHook(), // Uses DEFAULT_SENSITIVE_FIELDS
});

basicLogger.info('User login attempt', {
  userId: 'u_123',
  email: 'user@example.com',
  password: 'secret123', // Will be redacted
  token: 'abc-def-ghi', // Will be redacted
});

// Example 2: Custom sensitive fields
console.log('\n2. Custom sensitive fields:');
const customLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: createRedactionHook(['email', 'internalId']),
});

customLogger.info('Processing request', {
  userId: 'u_123',
  email: 'user@example.com', // Will be redacted
  internalId: 'secret-id-123', // Will be redacted
  name: 'John Doe', // Not redacted
});

// Example 3: Custom mask
console.log('\n3. Custom redaction mask:');
const maskLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: createRedactionHook(['password', 'token'], '***HIDDEN***'),
});

maskLogger.info('Authentication', {
  userId: 'u_123',
  password: 'secret123', // Will show as ***HIDDEN***
  token: 'abc-def', // Will show as ***HIDDEN***
});

// Example 4: Nested objects redaction
console.log('\n4. Nested objects:');
const nestedLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: createRedactionHook(),
});

nestedLogger.info('Payment processing', {
  user: {
    id: 'u_123',
    name: 'John Doe',
    credentials: {
      password: 'secret123', // Will be redacted
      apiKey: 'sk_live_abc123', // Will be redacted
    },
  },
  transaction: {
    amount: 100,
    cardNumber: '4532-1234-5678-9010', // Will be redacted
  },
});

// Example 5: Pattern-based redaction
console.log('\n5. Pattern-based redaction (SSN, credit cards):');
const patternLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: (record) => ({
    ...record,
    context: record.context
      ? redactByPattern(
          redactByPattern(
            record.context,
            /\d{3}-\d{2}-\d{4}/, // SSN pattern
            '[SSN_REDACTED]'
          ),
          /\d{4}-\d{4}-\d{4}-\d{4}/, // Credit card pattern
          '[CARD_REDACTED]'
        )
      : undefined,
  }),
});

patternLogger.info('Sensitive data', {
  userId: 'u_123',
  ssn: '123-45-6789', // Will be redacted
  cardNumber: '4532-1234-5678-9010', // Will be redacted
  name: 'John Doe', // Not redacted
});

// Example 6: Manual redaction
console.log('\n6. Manual redaction using utility function:');
const context = {
  userId: 'u_123',
  password: 'secret123',
  apiKey: 'sk_live_abc123',
  name: 'John Doe',
};

const redacted = redactSensitiveFields(context);
console.log('Original:', context);
console.log('Redacted:', redacted);

// Example 7: Default sensitive fields list
console.log('\n7. Default sensitive fields:');
console.log('These fields are automatically redacted:', DEFAULT_SENSITIVE_FIELDS);

// Example 8: Real-world scenario - API request logging
console.log('\n8. Real-world API request logging:');
const apiLogger = createLogger({
  level: 'info',
  destinations: [createPrettyDestination({ colorize: false })],
  redact: createRedactionHook([
    ...DEFAULT_SENSITIVE_FIELDS,
    'authorization',
    'cookie',
    'session',
  ]),
});

apiLogger.info('Incoming API request', {
  method: 'POST',
  path: '/api/auth/login',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer abc123', // Will be redacted
    cookie: 'session=xyz789', // Will be redacted
  },
  body: {
    email: 'user@example.com',
    password: 'secret123', // Will be redacted
  },
  ip: '192.168.1.100',
});

console.log('\n=== End of Redaction Examples ===');
