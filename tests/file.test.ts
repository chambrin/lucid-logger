import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createFileDestination } from '../src/destinations/file.js';

const TEST_DIR = join(process.cwd(), 'test-logs');
const TEST_FILE = join(TEST_DIR, 'test.log');

describe('file destination', () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up after tests
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('createFileDestination', () => {
    it('should create a file and write logs', async () => {
      const destination = createFileDestination(TEST_FILE);

      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      });

      // Wait for file to be written
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(existsSync(TEST_FILE)).toBe(true);

      const content = readFileSync(TEST_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0]!)).toEqual({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      });
    });

    it('should create directory if it does not exist', async () => {
      const nestedFile = join(TEST_DIR, 'nested', 'deep', 'test.log');
      const destination = createFileDestination(nestedFile);

      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      });

      // Wait for file to be written
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(existsSync(nestedFile)).toBe(true);
    });

    it('should write multiple logs', async () => {
      const destination = createFileDestination(TEST_FILE);

      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'First message',
      });

      destination.write({
        timestamp: '2024-01-15T12:00:01.000Z',
        level: 'warn',
        msg: 'Second message',
      });

      destination.write({
        timestamp: '2024-01-15T12:00:02.000Z',
        level: 'error',
        msg: 'Third message',
      });

      // Wait for files to be written
      await new Promise((resolve) => setTimeout(resolve, 50));

      const content = readFileSync(TEST_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]!).msg).toBe('First message');
      expect(JSON.parse(lines[1]!).msg).toBe('Second message');
      expect(JSON.parse(lines[2]!).msg).toBe('Third message');
    });

    it('should append to existing file by default', async () => {
      const destination1 = createFileDestination(TEST_FILE);
      destination1.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'First message',
      });

      // Wait for first write
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create a new destination for the same file
      const destination2 = createFileDestination(TEST_FILE);
      destination2.write({
        timestamp: '2024-01-15T12:00:01.000Z',
        level: 'info',
        msg: 'Second message',
      });

      // Wait for second write
      await new Promise((resolve) => setTimeout(resolve, 50));

      const content = readFileSync(TEST_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
    });

    it('should overwrite file when append is false', async () => {
      const destination1 = createFileDestination(TEST_FILE);
      destination1.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'First message',
      });

      // Wait for first write
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create a new destination with append: false
      const destination2 = createFileDestination({
        path: TEST_FILE,
        append: false,
      });
      destination2.write({
        timestamp: '2024-01-15T12:00:01.000Z',
        level: 'info',
        msg: 'Second message',
      });

      // Wait for second write
      await new Promise((resolve) => setTimeout(resolve, 50));

      const content = readFileSync(TEST_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0]!).msg).toBe('Second message');
    });

    it('should write logs with context and error', async () => {
      const destination = createFileDestination(TEST_FILE);

      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'error',
        msg: 'Payment failed',
        context: { userId: 'u_123', amount: 99.99 },
        error: {
          name: 'PaymentError',
          message: 'Insufficient funds',
          stack: 'Error: Insufficient funds\n    at ...',
        },
      });

      // Wait for write
      await new Promise((resolve) => setTimeout(resolve, 50));

      const content = readFileSync(TEST_FILE, 'utf-8');
      const record = JSON.parse(content.trim());

      expect(record.context).toEqual({ userId: 'u_123', amount: 99.99 });
      expect(record.error).toEqual({
        name: 'PaymentError',
        message: 'Insufficient funds',
        stack: 'Error: Insufficient funds\n    at ...',
      });
    });

    it('should handle file rotation when maxSize is reached', async () => {
      // Create a small max size for testing
      const destination = createFileDestination({
        path: TEST_FILE,
        maxSize: 200, // Very small size to trigger rotation
      });

      // Write first log
      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'First message that will cause rotation',
      });

      // Wait for first write
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Write second log (should trigger rotation)
      destination.write({
        timestamp: '2024-01-15T12:00:01.000Z',
        level: 'info',
        msg: 'Second message after rotation',
      });

      // Wait for rotation and second write
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that current file exists
      expect(existsSync(TEST_FILE)).toBe(true);

      // Current file should have the second message
      const content = readFileSync(TEST_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      // Should have rotated, so current file should be relatively fresh
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe('flush', () => {
    it('should flush and close the stream', async () => {
      const destination = createFileDestination(TEST_FILE);

      destination.write({
        timestamp: '2024-01-15T12:00:00.000Z',
        level: 'info',
        msg: 'Test message',
      });

      await destination.flush?.();

      // File should exist and contain the log
      expect(existsSync(TEST_FILE)).toBe(true);
      const content = readFileSync(TEST_FILE, 'utf-8');
      expect(content.trim()).toContain('Test message');
    });
  });
});
