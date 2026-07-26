/**
 * i18n — tiny translation layer with a React binding.
 *
 * `translate()` is pure and unit-tested; `I18nProvider` / `useI18n()` expose it
 * to components together with the active language and text direction.
 *
 * @module i18n
 */

import { createContext, createElement, useContext, useMemo } from 'react';
import en from './en.json';
import fa from './fa.json';

/** All bundled locales. */
export const locales = { en, fa };

/** Languages that render right-to-left. */
export const RTL_LANGS = ['fa'];

let currentLang = 'en';

/**
 * Translate a key for an explicit language.
 * Falls back to English, then to the key itself.
 * @param {string} lang
 * @param {string} key
 * @param {Record<string, string|number>} [params] - `{name}` placeholders.
 * @returns {string}
 */
export function translate(lang, key, params) {
  const table = locales[lang] || locales.en;
  let str = table[key] ?? locales.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      str = str.split(`{${name}}`).join(String(value));
    }
  }
  return str;
}

/**
 * Set the module-level active language (used outside React).
 * @param {string} lang
 */
export function setLanguage(lang) {
  if (locales[lang]) currentLang = lang;
}

/**
 * Get the module-level active language.
 * @returns {string}
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Translate using the module-level active language.
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function t(key, params) {
  return translate(currentLang, key, params);
}

/**
 * Whether a language is right-to-left.
 * @param {string} [lang] - Defaults to the active language.
 * @returns {boolean}
 */
export function isRtlLang(lang = currentLang) {
  return RTL_LANGS.includes(lang);
}

const I18nContext = createContext({
  lang: 'en',
  dir: 'ltr',
  t: (key, params) => translate('en', key, params),
});

/**
 * Provider that binds the active language to the component tree.
 * @param {{ lang: string, children: React.ReactNode }} props
 */
export function I18nProvider({ lang, children }) {
  const value = useMemo(() => {
    setLanguage(lang);
    return {
      lang,
      dir: isRtlLang(lang) ? 'rtl' : 'ltr',
      t: (key, params) => translate(lang, key, params),
    };
  }, [lang]);

  return createElement(I18nContext.Provider, { value }, children);
}

/**
 * Access the translator inside components.
 * @returns {{ lang: string, dir: string, t: (key: string, params?: object) => string }}
 */
export function useI18n() {
  return useContext(I18nContext);
}
