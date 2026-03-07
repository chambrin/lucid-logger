import {
  createLogger,
  createConsoleDestination,
  createFileDestination,
  createRedactionHook,
} from '../src/index.js';
import { existsSync, rmSync } from 'node:fs';

const ITERATIONS = 100_000;
const BENCH_DIR = './bench-logs';

// Clean up before benchmarks
if (existsSync(BENCH_DIR)) {
  rmSync(BENCH_DIR, { recursive: true, force: true });
}

// Null destination for raw logger performance
const nullDestination = {
  write: () => {
    // No-op
  },
};

console.log(`\nRunning benchmarks with ${ITERATIONS.toLocaleString()} iterations...\n`);

// Benchmark 1: Logger with no destinations (overhead measurement)
console.log('1. Logger overhead (no destinations):');
const logger1 = createLogger({ destinations: [] });
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger1.info('Test message', { iteration: i });
}
const end1 = performance.now();
const time1 = end1 - start1;
console.log(`   Time: ${time1.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time1 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 2: Logger with null destination (serialization + destination call)
console.log('\n2. Logger with null destination:');
const logger2 = createLogger({ destinations: [nullDestination] });
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger2.info('Test message', { iteration: i });
}
const end2 = performance.now();
const time2 = end2 - start2;
console.log(`   Time: ${time2.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time2 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 3: Logger with file destination
console.log('\n3. Logger with file destination:');
const logger3 = createLogger({
  destinations: [createFileDestination(`${BENCH_DIR}/bench.log`)],
});
const start3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger3.info('Test message', { iteration: i });
}
const end3 = performance.now();
const time3 = end3 - start3;
console.log(`   Time: ${time3.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time3 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 4: Child logger (context merging)
console.log('\n4. Child logger with context:');
const logger4 = createLogger({ destinations: [nullDestination] });
const childLogger = logger4.child({ requestId: 'req_123', userId: 'u_456' });
const start4 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  childLogger.info('Test message', { iteration: i });
}
const end4 = performance.now();
const time4 = end4 - start4;
console.log(`   Time: ${time4.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time4 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 5: Scoped logger
console.log('\n5. Scoped logger:');
const logger5 = createLogger({ destinations: [nullDestination] });
const scopedLogger = logger5.scope('billing', 'stripe');
const start5 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  scopedLogger.info('Test message', { iteration: i });
}
const end5 = performance.now();
const time5 = end5 - start5;
console.log(`   Time: ${time5.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time5 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 6: Level filtering (filtered out logs)
console.log('\n6. Level filtering (logs filtered out):');
const logger6 = createLogger({ level: 'error', destinations: [nullDestination] });
const start6 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger6.debug('Test message', { iteration: i }); // Should be filtered
}
const end6 = performance.now();
const time6 = end6 - start6;
console.log(`   Time: ${time6.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time6 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 7: Error serialization
console.log('\n7. Error serialization:');
const logger7 = createLogger({ destinations: [nullDestination] });
const testError = new Error('Test error');
const start7 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger7.error(testError, 'Error occurred', { iteration: i });
}
const end7 = performance.now();
const time7 = end7 - start7;
console.log(`   Time: ${time7.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time7 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 8: Multiple destinations
console.log('\n8. Multiple destinations (3 file destinations):');
const logger8 = createLogger({
  destinations: [
    createFileDestination(`${BENCH_DIR}/bench1.log`),
    createFileDestination(`${BENCH_DIR}/bench2.log`),
    createFileDestination(`${BENCH_DIR}/bench3.log`),
  ],
});
const start8 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger8.info('Test message', { iteration: i });
}
const end8 = performance.now();
const time8 = end8 - start8;
console.log(`   Time: ${time8.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time8 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 9: Redaction hook
console.log('\n9. Redaction hook (default sensitive fields):');
const logger9 = createLogger({
  destinations: [nullDestination],
  redact: createRedactionHook(),
});
const start9 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger9.info('Test message', {
    iteration: i,
    userId: 'u_123',
    password: 'secret123',
    token: 'abc-def',
  });
}
const end9 = performance.now();
const time9 = end9 - start9;
console.log(`   Time: ${time9.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time9 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Benchmark 10: Redaction with nested objects
console.log('\n10. Redaction with nested context:');
const logger10 = createLogger({
  destinations: [nullDestination],
  redact: createRedactionHook(),
});
const start10 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  logger10.info('Test message', {
    iteration: i,
    user: {
      id: 'u_123',
      credentials: {
        password: 'secret123',
        apiKey: 'sk_live_abc',
      },
    },
  });
}
const end10 = performance.now();
const time10 = end10 - start10;
console.log(`   Time: ${time10.toFixed(2)}ms`);
console.log(`   Ops/sec: ${(ITERATIONS / (time10 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Summary table
console.log('\n=== Performance Summary ===');
console.log('┌─────────────────────────────────────────────┬──────────────┬──────────────┐');
console.log('│ Benchmark                                   │ Time (ms)    │ Ops/sec      │');
console.log('├─────────────────────────────────────────────┼──────────────┼──────────────┤');
console.log(`│ Logger overhead (no destinations)           │ ${time1.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time1 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Logger with null destination                │ ${time2.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time2 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Logger with file destination                │ ${time3.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time3 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Child logger with context                   │ ${time4.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time4 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Scoped logger                               │ ${time5.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time5 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Level filtering (filtered out)              │ ${time6.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time6 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Error serialization                         │ ${time7.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time7 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Multiple destinations (3 files)             │ ${time8.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time8 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Redaction hook                              │ ${time9.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time9 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log(`│ Redaction with nested context               │ ${time10.toFixed(2).padStart(12)} │ ${(ITERATIONS / (time10 / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12)} │`);
console.log('└─────────────────────────────────────────────┴──────────────┴──────────────┘');

console.log('\n✓ Benchmarks completed');
console.log(`\nNote: Benchmark logs written to ${BENCH_DIR}/`);
