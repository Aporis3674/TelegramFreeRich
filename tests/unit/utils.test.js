/**
 * Unit tests for shared utilities.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  deepClone,
  sanitizeUrl,
  debounce,
  isValidToken,
  isValidChatId,
  clamp,
  escapeHtml,
} from '../../src/shared/utils.js';

describe('generateId', () => {
  it('returns unique ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^b/);
  });
});

describe('deepClone', () => {
  it('clones nested objects', () => {
    const original = { a: 1, b: { c: [2, 3] } };
    const clone = deepClone(original);
    clone.b.c[0] = 99;
    expect(original.b.c[0]).toBe(2);
  });
});

describe('sanitizeUrl', () => {
  it('allows https urls', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('blocks javascript: scheme', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('blocks data: scheme', () => {
    expect(sanitizeUrl('data:text/html,<script>')).toBe('');
  });

  it('blocks vbscript:', () => {
    expect(sanitizeUrl('vbscript:msgbox')).toBe('');
  });

  it('returns empty for non-string', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(123)).toBe('');
  });
});

describe('isValidToken', () => {
  it('accepts valid bot tokens', () => {
    expect(isValidToken('123456789:ABCdefGHIjklMNOpqrsTUVwxyz0123456789')).toBe(true);
  });

  it('rejects invalid tokens', () => {
    expect(isValidToken('')).toBe(false);
    expect(isValidToken('not-a-token')).toBe(false);
    expect(isValidToken('123:short')).toBe(false);
    expect(isValidToken(null)).toBe(false);
  });
});

describe('isValidChatId', () => {
  it('accepts numeric ids', () => {
    expect(isValidChatId('-1001234567890')).toBe(true);
    expect(isValidChatId('12345')).toBe(true);
  });

  it('accepts usernames', () => {
    expect(isValidChatId('@mychannel')).toBe(true);
  });

  it('rejects invalid', () => {
    expect(isValidChatId('@ab')).toBe(false);
    expect(isValidChatId('')).toBe(false);
    expect(isValidChatId(null)).toBe(false);
  });
});

describe('clamp', () => {
  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('<script>"x"&\'y\'</script>')).toBe(
      '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;',
    );
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
