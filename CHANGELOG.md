# Changelog

All notable changes to this project will be documented in this file.

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
