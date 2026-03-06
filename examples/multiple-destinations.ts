import { createLogger, createConsoleDestination, createFileDestination } from '../src/index.js';

// Example: Using multiple destinations simultaneously
// Logs will be written to both console and file

const logger = createLogger({
  level: 'debug',
  mode: 'production',
  service: 'multi-dest-app',
  environment: 'production',
  destinations: [
    // Write to console for real-time monitoring
    createConsoleDestination(),

    // Write to file for persistent storage
    createFileDestination({
      path: './logs/app.log',
      maxSize: 10 * 1024 * 1024, // 10MB before rotation
    }),

    // Separate error log file
    createFileDestination({
      path: './logs/errors.log',
    }),
  ],
  // Filter errors to dedicated error log
  redact: (record) => record,
});

// Create a custom destination that only logs errors
const errorOnlyDestination = createFileDestination('./logs/errors-only.log');
const errorLogger = createLogger({
  level: 'error',
  service: 'multi-dest-app',
  environment: 'production',
  destinations: [errorOnlyDestination],
});

// Normal operations logged everywhere
logger.info('Application started', { version: '1.0.0' });
logger.debug('Database connected', { host: 'localhost', port: 5432 });

// Request logging
const requestId = 'req_' + Date.now();
const reqLogger = logger.child({ requestId });

reqLogger.info('Incoming request', {
  method: 'POST',
  path: '/api/users',
  ip: '192.168.1.100',
});

reqLogger.debug('Validating request body', { fields: ['email', 'name'] });

// Simulate an error - will be logged to all destinations
try {
  throw new Error('Validation failed: email is invalid');
} catch (error) {
  reqLogger.error(error as Error, 'Request validation failed', {
    field: 'email',
    value: 'invalid-email',
  });

  // Also log to error-only logger
  errorLogger.error(error as Error, 'Validation error occurred');
}

// Success case
reqLogger.info('User created successfully', { userId: 'u_12345' });

// Scoped logging for billing module
const billingLogger = logger.scope('billing');
billingLogger.info('Processing payment', { amount: 299.99, currency: 'USD' });

// High severity - will appear in all logs
logger.fatal('Database connection lost', {
  host: 'localhost',
  lastAttempt: new Date().toISOString(),
});

console.log('\nLogs have been written to:');
console.log('  - Console (stdout/stderr)');
console.log('  - ./logs/app.log');
console.log('  - ./logs/errors.log (all levels)');
console.log('  - ./logs/errors-only.log (errors only)');
