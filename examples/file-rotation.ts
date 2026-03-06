import { createLogger, createFileDestination } from '../src/index.js';

// Example: File rotation when log files get too large

const logger = createLogger({
  level: 'info',
  service: 'rotation-demo',
  destinations: [
    createFileDestination({
      path: './logs/rotating.log',
      maxSize: 1024, // Rotate after 1KB (very small for demo purposes)
    }),
  ],
});

console.log('Writing logs to demonstrate file rotation...\n');

// Write many logs to trigger rotation
for (let i = 0; i < 50; i++) {
  logger.info(`Log entry number ${i}`, {
    iteration: i,
    data: 'Some sample data that takes up space in the log file',
    timestamp: Date.now(),
  });
}

logger.warn('File rotation demo completed');

console.log('\nCheck the ./logs/ directory for:');
console.log('  - rotating.log (current file)');
console.log('  - rotating.log.YYYY-MM-DDTHH-MM-SS-mmmZ (rotated files)');
