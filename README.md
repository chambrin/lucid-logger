# lucid-logger

A structured and typed logger for Node.js/Next.js/Fastify, with clean JSON output in production and readable rendering in development.

## Installation

```bash
npm install @ton-org/logger
```

## Quick Start

```typescript
import { createLogger, createConsoleDestination } from '@ton-org/logger';

const logger = createLogger({
  level: 'info',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  service: 'billing-api',
  environment: process.env.NODE_ENV,
  destinations: [createConsoleDestination()],
});

logger.info('Server started', { port: 3000 });
logger.error(new Error('Payment failed'), 'Transaction error', { userId: 'u_123' });
```

## Features

### Structured JSON Logs

Each log produces a JSON record with a stable schema:

```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "level": "info",
  "msg": "Server started",
  "context": { "port": 3000 },
  "service": "billing-api",
  "environment": "production"
}
```

### Log Levels

Six levels available (+ `silent` to disable):
- `trace` (10)
- `debug` (20)
- `info` (30) - default level
- `warn` (40)
- `error` (50)
- `fatal` (60)

Logs below the configured level are automatically filtered for optimal performance.

### Child Loggers

Create child loggers with inherited context:

```typescript
const requestLogger = logger.child({ requestId: 'req_abc123' });
requestLogger.info('Processing request');
// Automatically includes requestId in all logs
```

### Scopes

Organize your logs by module or functionality:

```typescript
const billingLogger = logger.scope('billing', 'stripe');
billingLogger.info('Payment processed');
// Output: { ..., "scope": ["billing", "stripe"] }
```

### Error Handling

Automatically serialize Error objects:

```typescript
try {
  await processPayment();
} catch (error) {
  logger.error(error, 'Payment failed', { userId: 'u_123' });
}
```

Output:

```json
{
  "timestamp": "...",
  "level": "error",
  "msg": "Payment failed",
  "context": { "userId": "u_123" },
  "error": {
    "name": "Error",
    "message": "Original error message",
    "stack": "..."
  }
}
```

### Sensitive Data Redaction

Protect sensitive data with a redaction hook:

```typescript
const logger = createLogger({
  redact: (record) => ({
    ...record,
    context: record.context
      ? redactSensitiveFields(record.context, ['password', 'token', 'cardNumber'])
      : undefined,
  }),
});
```

## API

### `createLogger(config?: LoggerConfig): Logger`

Creates a logger instance.

**Configuration options:**

```typescript
interface LoggerConfig {
  level?: LogLevel;                          // Minimum log level (default: 'info')
  mode?: 'production' | 'development';       // Display mode (default: 'production')
  service?: string;                          // Service name
  environment?: string;                      // Environment (dev/staging/prod)
  defaultContext?: Record<string, unknown>;  // Default context
  destinations?: Destination[];              // Log destinations
  redact?: (record) => record;              // Redaction hook
  timeProvider?: () => string;               // Timestamp provider (for tests)
}
```

### Logger Methods

```typescript
logger.trace(msg: string, context?: object): void
logger.debug(msg: string, context?: object): void
logger.info(msg: string, context?: object): void
logger.warn(msg: string, context?: object): void
logger.error(msg: string, context?: object): void
logger.fatal(msg: string, context?: object): void

// With Error as first argument
logger.error(error: Error, msg?: string, context?: object): void

// Child logger
logger.child(context: object): Logger

// Scoped logger
logger.scope(...names: string[]): Logger

// Clone with different level
logger.withLevel(level: LogLevel): Logger
```

## Destinations

### Console Destination

Writes to stdout (info/debug/trace) and stderr (error/fatal):

```typescript
import { createConsoleDestination } from '@ton-org/logger';

const logger = createLogger({
  destinations: [createConsoleDestination()],
});
```

### Custom Destination

Create your own destinations:

```typescript
interface Destination {
  write: (record: LogRecord) => void | Promise<void>;
  flush?: () => Promise<void>;
}

const customDestination: Destination = {
  write: async (record) => {
    await sendToElasticsearch(record);
  },
};
```

## Examples

See the `examples/` folder for complete use cases:
- `examples/basic.ts` - Basic usage

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Tests
npm test

# Tests in watch mode
npm run dev

# Type checking
npm run typecheck
```

## Roadmap

### Step 1 - Minimal Core ✅
- Level mapping
- Basic LogRecord
- createLogger with all levels
- Console destination

### Step 2 - Complete API ✅
- Error serialization ✅
- Child loggers ✅
- Scopes ✅
- Redaction hook ✅

### Step 3 - Multiple Destinations
- File destination
- Support for multiple simultaneous destinations

### Step 4 - Development Mode
- Pretty destination with colors
- Icons per level
- Readable format

### Step 5 - Polish
- Redaction utilities
- Performance benchmarks

### Step 6 - Documentation and Examples
- Next.js, Fastify examples
- Integration guide
- CI/CD

## License

MIT
