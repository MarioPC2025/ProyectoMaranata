import { describe, expect, it } from 'vitest';
import { BOOKS } from './books.ts';
import { USFM_CODES } from './usfm.ts';

describe('USFM_CODES', () => {
  it('has one code per book, in canonical order', () => {
    expect(USFM_CODES).toHaveLength(BOOKS.length);
    expect(USFM_CODES[BOOKS.findIndex((book) => book.id === 'John')]).toBe('JHN');
    expect(USFM_CODES[0]).toBe('GEN');
    expect(USFM_CODES.at(-1)).toBe('REV');
  });

  it('has no repeated code', () => {
    expect(new Set(USFM_CODES).size).toBe(USFM_CODES.length);
  });
});
