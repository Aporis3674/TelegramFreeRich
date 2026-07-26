/**
 * Unit tests for the i18n layer.
 */
import { describe, it, expect } from 'vitest';
import {
  RTL_LANGS,
  getLanguage,
  isRtlLang,
  locales,
  setLanguage,
  t,
  translate,
} from '../../src/renderer/i18n/index.js';

describe('locales', () => {
  it('ships English and Persian', () => {
    expect(Object.keys(locales).sort()).toEqual(['en', 'fa']);
  });

  it('defines the same keys in every locale', () => {
    const enKeys = Object.keys(locales.en).sort();
    for (const [lang, table] of Object.entries(locales)) {
      expect(Object.keys(table).sort(), `${lang} key set`).toEqual(enKeys);
    }
  });

  it('has no empty strings', () => {
    for (const [lang, table] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(table)) {
        expect(String(value).trim().length, `${lang}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps placeholders consistent between locales', () => {
    const placeholders = (value) => (String(value).match(/\{\w+\}/g) || []).sort();
    for (const [key, value] of Object.entries(locales.en)) {
      expect(placeholders(locales.fa[key]), `fa:${key}`).toEqual(placeholders(value));
    }
  });

});

describe('translate', () => {
  it('returns the value for a known key', () => {
    expect(translate('en', 'settings.title')).toBe('Settings');
    expect(translate('fa', 'settings.title')).toBe('تنظیمات');
  });

  it('falls back to English for an unknown language', () => {
    expect(translate('de', 'settings.title')).toBe('Settings');
  });

  it('falls back to the key itself when nothing matches', () => {
    expect(translate('en', 'nope.missing')).toBe('nope.missing');
  });

  it('substitutes every occurrence of a placeholder', () => {
    expect(translate('en', 'bottom.chars', { count: '12', max: '32,768' })).toBe('12 / 32,768');
  });
});

describe('module-level language', () => {
  it('sets and reads the active language', () => {
    setLanguage('fa');
    expect(getLanguage()).toBe('fa');
    expect(t('settings.save')).toBe('ذخیره');
    expect(isRtlLang()).toBe(true);

    setLanguage('en');
    expect(t('settings.save')).toBe('Save');
    expect(isRtlLang()).toBe(false);
  });

  it('ignores unknown languages', () => {
    setLanguage('en');
    setLanguage('klingon');
    expect(getLanguage()).toBe('en');
  });

  it('lists Persian as right-to-left', () => {
    expect(RTL_LANGS).toContain('fa');
    expect(isRtlLang('fa')).toBe(true);
    expect(isRtlLang('en')).toBe(false);
  });
});

