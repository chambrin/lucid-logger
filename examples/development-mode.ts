import { createLogger, createPrettyDestination } from '../src/index.js';

// Development mode example with pretty output
const logger = createLogger({
  level: 'trace',
  service: 'dev-app',
  environment: 'development',
  destinations: [createPrettyDestination()],
});

console.log('=== Development Mode Logger Demo ===\n');

// Different log levels with icons and colors
logger.trace('Entering function calculateTotal', { params: { items: 3 } });
logger.debug('Database query executed', { query: 'SELECT * FROM users', duration: '45ms' });
logger.info('Server started successfully', { port: 3000, host: 'localhost' });
logger.warn('High memory usage detected', { memoryUsage: '85%', threshold: '80%' });

// Error with stack trace
try {
  throw new Error('Payment processing failed');
} catch (error) {
  logger.error(error as Error, 'Failed to process payment', {
    userId: 'u_123',
    amount: 99.99,
    currency: 'USD',
  });
}

// Fatal error
logger.fatal('Database connection lost', {
  host: 'localhost',
  port: 5432,
  retryAttempts: 3,
});

// Scoped logger
console.log('\n=== Scoped Logs ===\n');
const billingLogger = logger.scope('billing', 'stripe');
billingLogger.info('Payment intent created', { intentId: 'pi_123', amount: 2999 });
billingLogger.debug('Webhook received', { type: 'payment_intent.succeeded' });

// Child logger with context
console.log('\n=== Request Logging ===\n');
const requestLogger = logger.child({
  requestId: 'req_' + Date.now(),
  userId: 'u_456',
});

requestLogger.info('Incoming request', { method: 'POST', path: '/api/users' });
requestLogger.debug('Validating request body', { fields: ['email', 'name', 'password'] });
requestLogger.info('User created successfully', { userId: 'u_789' });

// Customized pretty logger (no timestamps, custom icons)
console.log('\n=== Custom Pretty Logger ===\n');
const customLogger = createLogger({
  level: 'info',
  destinations: [
    createPrettyDestination({
      timestamps: false,
      customIcons: {
        info: '✅',
        warn: '🚨',
        error: '🔥',
      },
    }),
  ],
});

customLogger.info('Custom info message');
customLogger.warn('Custom warning message');
customLogger.error('Custom error message');

// No colors (for CI/CD environments)
console.log('\n=== No Colors (CI Mode) ===\n');
const ciLogger = createLogger({
  level: 'info',
  destinations: [
    createPrettyDestination({
      colorize: false,
      icons: false,
    }),
  ],
});

ciLogger.info('CI environment log', { build: '123', commit: 'abc123' });
ciLogger.warn('Deprecation warning');
