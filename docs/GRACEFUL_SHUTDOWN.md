# Graceful Shutdown Guide

When your application is shutting down, it's important to ensure all logs are properly flushed to their destinations before the process exits. This prevents log loss, especially when using file destinations with buffered I/O.

## Why Graceful Shutdown Matters

- **File destinations** may buffer writes for performance
- **Network destinations** (custom) may have pending requests
- Logs written just before shutdown might not be persisted
- Process crashes or forced exits can lose buffered data

## Implementation

### Basic Shutdown Handler

```typescript
import { createLogger, createFileDestination } from 'lucid-logger';

const logger = createLogger({
  destinations: [
    createFileDestination('./logs/app.log'),
  ],
});

// Graceful shutdown handler
async function shutdown(signal: string) {
  logger.info('Received shutdown signal', { signal });

  // Flush all destinations
  await flushAllDestinations();

  console.log('Graceful shutdown complete');
  process.exit(0);
}

async function flushAllDestinations() {
  // Note: File destinations automatically flush on write,
  // but if you have custom destinations with buffering,
  // call their flush() method here
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  shutdown('uncaughtException').then(() => process.exit(1));
});
```

### With Custom Buffered Destination

If you create custom destinations with buffering, implement the optional `flush()` method:

```typescript
import type { Destination, LogRecord } from 'lucid-logger';

class BufferedDestination implements Destination {
  private buffer: LogRecord[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    // Flush every 1 second
    this.flushInterval = setInterval(() => this.flush(), 1000);
  }

  write(record: LogRecord): void {
    this.buffer.push(record);

    // Flush when buffer is full
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const records = this.buffer.splice(0);

    // Write all buffered records to your destination
    for (const record of records) {
      // Your actual write logic here
      console.log(JSON.stringify(record));
    }
  }

  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush(); // Final flush
  }
}

// Usage with graceful shutdown
const destination = new BufferedDestination();
const logger = createLogger({
  destinations: [destination],
});

async function shutdown(signal: string) {
  logger.info('Shutting down', { signal });

  // Flush the destination
  await destination.flush();

  // Clean up
  destination.destroy();

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Express.js Example

```typescript
import express from 'express';
import { createLogger, createFileDestination } from 'lucid-logger';

const app = express();
const logger = createLogger({
  destinations: [
    createFileDestination('./logs/app.log'),
  ],
});

let server: ReturnType<typeof app.listen>;

app.get('/', (req, res) => {
  logger.info('Request received', { path: req.path });
  res.send('OK');
});

server = app.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
});

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info('Shutdown initiated', { signal });

  // Stop accepting new connections
  server.close(() => {
    logger.info('Server closed');
  });

  // Wait for existing connections to finish (with timeout)
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(0);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Fastify Example

```typescript
import Fastify from 'fastify';
import { createLogger, createFileDestination } from 'lucid-logger';

const logger = createLogger({
  destinations: [
    createFileDestination('./logs/app.log'),
  ],
});

const fastify = Fastify();

fastify.get('/', async (request, reply) => {
  logger.info('Request received', { path: request.url });
  return { status: 'ok' };
});

// Graceful shutdown with Fastify
async function shutdown(signal: string) {
  logger.info('Shutdown initiated', { signal });

  try {
    await fastify.close();
    logger.info('Fastify closed gracefully');
  } catch (error) {
    logger.error(error, 'Error during shutdown');
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
  logger.info('Server listening', { port: 3000 });
});
```

### Next.js Example (API Routes)

```typescript
// pages/api/example.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createLogger, createFileDestination } from 'lucid-logger';

const logger = createLogger({
  destinations: [
    createFileDestination('./logs/api.log'),
  ],
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('API request', {
    method: req.method,
    url: req.url
  });

  res.status(200).json({ status: 'ok' });
}

// In your custom server or middleware
// (if you're using a custom server)
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM');
  // Next.js will handle the shutdown
  process.exit(0);
});
```

## Best Practices

1. **Log the shutdown signal** - Always log when shutdown is initiated
2. **Set a timeout** - Don't wait forever for connections to close
3. **Flush all destinations** - Ensure buffered data is written
4. **Handle errors during shutdown** - Log any errors that occur
5. **Exit with appropriate code** - Use 0 for graceful, 1 for errors
6. **Test your shutdown logic** - Use `kill -SIGTERM <pid>` to test

## Testing Shutdown

```bash
# Start your app in the background
node app.js &

# Get the process ID
PID=$!

# Send SIGTERM to trigger graceful shutdown
kill -SIGTERM $PID

# Or use Ctrl+C for SIGINT
# node app.js
# (press Ctrl+C)
```

## Common Signals

- **SIGTERM** - Graceful termination request (default for `kill`)
- **SIGINT** - Interrupt from keyboard (Ctrl+C)
- **SIGKILL** - Force kill (cannot be caught, use as last resort)
- **SIGHUP** - Hang up (terminal closed)

## File Destinations

The built-in `createFileDestination` writes synchronously and doesn't require explicit flushing. However, if you're writing a large volume of logs, you might want to ensure the last log is written:

```typescript
const destination = createFileDestination('./logs/app.log');

// The file destination writes synchronously,
// so your last log will be written before exit
logger.info('Shutdown complete');
process.exit(0);
```

## Docker Considerations

When running in Docker, ensure your Node.js process receives signals:

```dockerfile
# Use exec form to ensure Node.js is PID 1
CMD ["node", "app.js"]

# Or use dumb-init to handle signals
CMD ["dumb-init", "node", "app.js"]
```

```javascript
// Handle Docker stop (sends SIGTERM)
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM from Docker');
  await shutdown('SIGTERM');
});
```

## Kubernetes Considerations

Kubernetes sends SIGTERM and waits for `terminationGracePeriodSeconds` (default: 30s) before sending SIGKILL:

```yaml
spec:
  terminationGracePeriodSeconds: 30  # Adjust as needed
  containers:
    - name: app
      image: your-app:latest
```

Ensure your shutdown completes within this period:

```typescript
const SHUTDOWN_TIMEOUT = 25000; // 25 seconds (less than K8s grace period)

async function shutdown(signal: string) {
  logger.info('Shutdown initiated', { signal });

  const timeout = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Your shutdown logic
  await closeServer();

  clearTimeout(timeout);
  logger.info('Shutdown complete');
  process.exit(0);
}
```

## Resources

- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
- [Graceful Shutdown in Kubernetes](https://learnk8s.io/graceful-shutdown)
- [Docker and Node.js Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
