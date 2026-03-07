# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2024-01-20

### Added - Step 5: Polish ✅

#### Redaction Utilities
- **`redactSensitiveFields()`** - Utility function to redact sensitive fields from context objects
- **`createRedactionHook()`** - Factory function to create redaction hooks for loggers
- **`redactByPattern()`** - Pattern-based redaction using regex
- **`DEFAULT_SENSITIVE_FIELDS`** - Pre-configured list of common sensitive field names
- **`REDACTION_MASK`** - Default redaction mask constant
- Deep object traversal with nested object and array support
- Case-insensitive field matching
- Partial field name matching (e.g., "userPassword" matches "password")
- 22 comprehensive tests for all redaction scenarios

#### Enhanced Performance Benchmarks
- Added redaction performance benchmarks (simple and nested)
- Added summary table with all benchmark results
- 10 total benchmarks covering all major features
- Enhanced output formatting for better readability

#### Documentation
- **Graceful Shutdown Guide** (`docs/GRACEFUL_SHUTDOWN.md`)
  - Best practices for process termination
  - Examples for Express, Fastify, Next.js
  - Docker and Kubernetes considerations
  - Signal handling patterns
- Updated README with comprehensive redaction examples
- Added redaction example script (`examples/redaction.ts`)

#### Code Quality Improvements
- Created `.eslintrc.json` configuration
- Fixed README typos (`npm instal` → `npm install`)
- Fixed import paths (`@lucid-logger` → `lucid-logger`)
- Fixed package.json author email formatting

### Testing
- 79 tests passing (up from 57)
- 6 test suites (added redaction.test.ts)
- New test coverage:
  - Redaction with default fields
  - Redaction with custom fields
  - Nested object redaction
  - Array redaction
  - Case-insensitive matching
  - Pattern-based redaction
  - Redaction hook integration

### Examples
- Added `redaction.ts` - 8 comprehensive redaction examples
- Added `npm run example:redaction` script

### Performance
- Redaction overhead: Minimal impact on logging performance
- Nested redaction: Efficient deep cloning and traversal
- All existing benchmarks maintained

## [0.1.0] - 2024-01-15

### Added - Step 1: Minimal Core ✅
- Level mapping (trace → fatal + silent)
- Basic LogRecord structure
- createLogger with all log levels
- Console destination (JSON output)
- TypeScript support with strict typing
- Level filtering for performance

### Added - Step 2: Complete API ✅
- Error serialization (Error → structured object)
- Child loggers with context inheritance
- Scopes (Signale-style)
- Redaction hook for sensitive data
- Multiple method overloads (msg, error, context)

### Added - Step 3: Multiple Destinations ✅
- File destination with rotation by size
- Support for multiple simultaneous destinations
- Automatic directory creation
- Append/overwrite modes
- Flush support for graceful shutdown
- Performance benchmarks (up to 1.5M ops/sec)

### Added - Step 4: Development Mode ✅
- Pretty destination with colorized output using [chalk](https://www.npmjs.com/package/chalk)
- Icons per log level (🔍 trace, 🐛 debug, ℹ️ info, ⚠️ warn, ❌ error, 💀 fatal)
- Human-readable timestamps (HH:mm:ss.SSS)
- Formatted context and scopes
- Stack trace formatting with indentation
- Customizable colors and icons with chalk styles
- CI-friendly mode (no colors/icons)

### Dependencies
- `chalk` ^5.6.2 - Terminal string styling with colors

### Testing
- 57 tests passing (100% coverage of core features)
- 5 test suites covering:
  - Levels and filtering
  - LogRecord creation
  - Logger functionality
  - File destination
  - Pretty destination

### Examples
- `basic.ts` - Basic usage
- `multiple-destinations.ts` - Multiple destinations
- `file-rotation.ts` - File rotation demo
- `development-mode.ts` - Pretty output showcase
- `production-vs-dev.ts` - Environment-based setup

### Performance
- Logger overhead: ~1.5M ops/sec
- File destination: ~730K ops/sec
- Level filtering: ~26M ops/sec
- Multiple destinations (3 files): ~371K ops/sec

### Documentation
- Complete README with examples
- Publishing guide
- 2FA setup guide
- TypeScript declarations
- JSDoc comments

### Package
- Published to npm as `lucid-logger`
- Package size: 10.6 KB
- Node.js ≥18.0.0
- ESM-only (import)
- MIT License
