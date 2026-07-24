/**
 * Unit tests for main-process validation helpers.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  isValidToken,
  isValidChatId,
  isValidLang,
  isValidMethod,
} = require('../../src/main/security/validation.js');

describe('isValidToken', () => {
  it('accepts valid tokens', () => {
    expect(isValidToken('123456789:ABCdefGHIjklMNOpqrsTUVwxyz0123456789')).toBe(true);
  });

  it('rejects invalid tokens', () => {
    expect(isValidToken('')).toBe(false);
    expect(isValidToken('short')).toBe(false);
    expect(isValidToken(null)).toBe(false);
  });
});

describe('isValidChatId', () => {
  it('accepts numeric and @username', () => {
    expect(isValidChatId('-1001234567890')).toBe(true);
    expect(isValidChatId('@channel')).toBe(true);
  });

  it('rejects bad values', () => {
    expect(isValidChatId('@ab')).toBe(false);
    expect(isValidChatId('')).toBe(false);
  });
});

describe('isValidLang', () => {
  it('accepts en and fa', () => {
    expect(isValidLang('en')).toBe(true);
    expect(isValidLang('fa')).toBe(true);
    expect(isValidLang('de')).toBe(false);
  });
});

describe('isValidMethod', () => {
  it('accepts API method names', () => {
    expect(isValidMethod('sendRichMessage')).toBe(true);
    expect(isValidMethod('getMe')).toBe(true);
  });

  it('rejects injection attempts', () => {
    expect(isValidMethod('../evil')).toBe(false);
    expect(isValidMethod('send message')).toBe(false);
    expect(isValidMethod('')).toBe(false);
  });
});
