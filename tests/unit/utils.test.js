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
  it('allows the schemes a message can carry', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(sanitizeUrl('tel:+15551234')).toBe('tel:+15551234');
    expect(sanitizeUrl('tg://resolve?domain=telegram')).toBe('tg://resolve?domain=telegram');
  });

  it('is case-insensitive about the scheme', () => {
    expect(sanitizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
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

  it('blocks schemes a denylist would not have thought of', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    expect(sanitizeUrl('blob:https://example.com/abc')).toBe('');
    expect(sanitizeUrl('ws://example.com')).toBe('');
    expect(sanitizeUrl('chrome://settings')).toBe('');
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBe('');
  });

  it('assumes https when no scheme was typed', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl('  example.com/path?q=1  ')).toBe('https://example.com/path?q=1');
  });

  it('keeps in-document anchors as written', () => {
    expect(sanitizeUrl('#section-2')).toBe('#section-2');
  });

  it('drops relative and protocol-relative forms', () => {
    // A sent message has no document to be relative to.
    expect(sanitizeUrl('/local/path')).toBe('');
    expect(sanitizeUrl('//evil.example')).toBe('');
  });

  it('does not guess https for something that tried to be a scheme', () => {
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('');
    expect(sanitizeUrl('1foo:bar')).toBe('');
  });

  it('returns empty for non-string and empty input', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(123)).toBe('');
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl('   ')).toBe('');
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
