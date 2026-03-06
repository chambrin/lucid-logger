import { createLogger, createConsoleDestination } from '../src/index.js';

// Basic logger usage example
const logger = createLogger({
  level: 'info',
  mode: 'production',
  service: 'example-app',
  environment: 'development',
  destinations: [createConsoleDestination()],
});

// Simple logs
logger.info('Application started', { port: 3000 });
logger.warn('High memory usage detected', { memoryUsage: '85%' });

// Log with error
try {
  throw new Error('Database connection failed');
} catch (error) {
  logger.error(error as Error, 'Failed to connect to database', {
    host: 'localhost',
    port: 5432,
  });
}

// Child logger with context
const requestLogger = logger.child({ requestId: 'req_abc123' });
requestLogger.info('Processing request', { method: 'GET', path: '/api/users' });
requestLogger.debug('Query executed', { duration: '45ms' });

// Scoped logger
const billingLogger = logger.scope('billing', 'stripe');
billingLogger.info('Payment processed', { amount: 99.99, currency: 'USD' });

// Fatal log
logger.fatal('Critical system failure', { reason: 'out of memory' });
