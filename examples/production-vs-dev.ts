import {
  createLogger,
  createConsoleDestination,
  createPrettyDestination,
  createFileDestination,
} from '../src/index.js';

// Determine environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure logger based on environment
const logger = createLogger({
  level: isDevelopment ? 'debug' : 'info',
  service: 'my-app',
  environment: process.env.NODE_ENV || 'development',
  destinations: isDevelopment
    ? [
        // Development: pretty console output
        createPrettyDestination({
          colorize: true,
          timestamps: true,
          scopes: true,
        }),
      ]
    : [
        // Production: JSON to console + file
        createConsoleDestination(),
        createFileDestination({
          path: './logs/app.log',
          maxSize: 10 * 1024 * 1024, // 10MB
        }),
      ],
});

console.log(`Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode\n`);

// Application code (same logs, different output)
logger.info('Application starting', { version: '1.0.0' });
logger.debug('Loading configuration', { configPath: './config.json' });

const requestLogger = logger.child({ requestId: 'req_001' });
requestLogger.info('Processing request', { method: 'GET', path: '/api/users' });
requestLogger.debug('Fetching from database', { table: 'users', limit: 10 });

try {
  // Simulate an error
  throw new Error('Database connection timeout');
} catch (error) {
  requestLogger.error(error as Error, 'Request failed', {
    statusCode: 500,
    retryable: true,
  });
}

requestLogger.info('Request completed', { duration: '245ms', status: 500 });

// Scoped logging
const paymentLogger = logger.scope('payment');
paymentLogger.info('Payment initiated', { amount: 49.99, currency: 'USD' });
paymentLogger.warn('Payment took longer than expected', { duration: '5.2s', threshold: '3s' });

console.log('\n---');
console.log(
  isDevelopment
    ? 'In development: Human-readable colored output with icons'
    : 'In production: Structured JSON for log aggregators'
);
