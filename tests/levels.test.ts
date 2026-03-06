import { describe, it, expect } from 'vitest';
import { getLevelValue, shouldLog, LOG_LEVELS } from '../src/core/levels.js';

describe('levels', () => {
  describe('getLevelValue', () => {
    it('should return correct numeric values for each level', () => {
      expect(getLevelValue('trace')).toBe(10);
      expect(getLevelValue('debug')).toBe(20);
      expect(getLevelValue('info')).toBe(30);
      expect(getLevelValue('warn')).toBe(40);
      expect(getLevelValue('error')).toBe(50);
      expect(getLevelValue('fatal')).toBe(60);
      expect(getLevelValue('silent')).toBe(Infinity);
    });
  });

  describe('shouldLog', () => {
    it('should allow logs at or above configured level', () => {
      // Configured level: info (30)
      expect(shouldLog('trace', 'info')).toBe(false); // 10 < 30
      expect(shouldLog('debug', 'info')).toBe(false); // 20 < 30
      expect(shouldLog('info', 'info')).toBe(true);   // 30 >= 30
      expect(shouldLog('warn', 'info')).toBe(true);   // 40 >= 30
      expect(shouldLog('error', 'info')).toBe(true);  // 50 >= 30
      expect(shouldLog('fatal', 'info')).toBe(true);  // 60 >= 30
    });

    it('should block all logs when level is silent', () => {
      expect(shouldLog('trace', 'silent')).toBe(false);
      expect(shouldLog('debug', 'silent')).toBe(false);
      expect(shouldLog('info', 'silent')).toBe(false);
      expect(shouldLog('warn', 'silent')).toBe(false);
      expect(shouldLog('error', 'silent')).toBe(false);
      expect(shouldLog('fatal', 'silent')).toBe(false);
    });

    it('should allow all logs when level is trace', () => {
      expect(shouldLog('trace', 'trace')).toBe(true);
      expect(shouldLog('debug', 'trace')).toBe(true);
      expect(shouldLog('info', 'trace')).toBe(true);
      expect(shouldLog('warn', 'trace')).toBe(true);
      expect(shouldLog('error', 'trace')).toBe(true);
      expect(shouldLog('fatal', 'trace')).toBe(true);
    });
  });

  describe('LOG_LEVELS', () => {
    it('should have levels in ascending order', () => {
      expect(LOG_LEVELS.trace).toBeLessThan(LOG_LEVELS.debug);
      expect(LOG_LEVELS.debug).toBeLessThan(LOG_LEVELS.info);
      expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.warn);
      expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.error);
      expect(LOG_LEVELS.error).toBeLessThan(LOG_LEVELS.fatal);
      expect(LOG_LEVELS.fatal).toBeLessThan(LOG_LEVELS.silent);
    });
  });
});
