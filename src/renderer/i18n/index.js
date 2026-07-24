/**
 * Simple i18n loader for TelegramFreeRich.
 * @module i18n
 */

import en from './en.json';
import fa from './fa.json';

const locales = { en, fa };
let currentLang = 'en';

/**
 * Set the active language.
 * @param {string} lang - 'en' | 'fa'
 */
export function setLanguage(lang) {
  if (locales[lang]) currentLang = lang;
}

/**
 * Get the active language code.
 * @returns {string}
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Translate a key. Falls back to English, then to the key itself.
 * @param {string} key
 * @param {Record<string, string>} [params] - Optional {name} replacements.
 * @returns {string}
 */
export function t(key, params) {
  let str = locales[currentLang]?.[key] ?? locales.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}

/**
 * Whether the current language is RTL.
 * @returns {boolean}
 */
export function isRtlLang() {
  return currentLang === 'fa';
}
