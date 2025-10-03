import { formatDate, capitalize, generateId } from '../utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format a date correctly', () => {
      const date = new Date('2023-12-25');
      const result = formatDate(date);
      expect(result).toBe('December 25, 2023');
    });

    it('should handle different dates', () => {
      const date = new Date('2023-01-01');
      const result = formatDate(date);
      expect(result).toBe('January 1, 2023');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single characters', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of reasonable length', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(30);
    });
  });
});
