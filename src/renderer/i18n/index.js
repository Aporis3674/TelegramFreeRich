/**
 * Simple i18n module for TelegramFreeRich.
 * Uses window.i18n pattern (non-ES-module, loaded via <script>).
 *
 * Usage:
 *   i18n.t('key')            → translated string for current language
 *   i18n.setLang('fa')       → switch language (persists to localStorage)
 *   i18n.getLang()            → current language code
 */
(function () {
  'use strict';

  var LANG_KEY = 'tfr-lang';
  var _currentLang = localStorage.getItem(LANG_KEY) || 'en';
  var _strings = {};

  // Cache loaded language bundles
  var _bundles = {};

  /**
   * Load a language bundle (JSON file).
   * Returns a Promise that resolves with the parsed strings.
   */
  function loadBundle(lang) {
    if (_bundles[lang]) return Promise.resolve(_bundles[lang]);

    // Map lang code to the right JSON path relative to the HTML page
    var path = 'i18n/' + lang + '.json';
    return fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + path);
        return res.json();
      })
      .then(function (data) {
        _bundles[lang] = data;
        return data;
      });
  }

  /**
   * Translate a key. Returns the key itself if translation is not found.
   * Supports simple interpolation: t('key', { username: 'Alice' })
   *   replaces {username} in the translated string.
   */
  function t(key, vars) {
    var dict = _bundles[_currentLang] || _bundles['en'] || {};
    var str = dict[key] || key;
    if (vars && typeof str === 'string') {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  /**
   * Switch language. Persists to localStorage and loads the bundle.
   * Returns a Promise that resolves once the new language is ready.
   */
  function setLang(lang) {
    _currentLang = lang || 'en';
    localStorage.setItem(LANG_KEY, _currentLang);
    return loadBundle(_currentLang);
  }

  /**
   * Get the current language code.
   */
  function getLang() {
    return _currentLang;
  }

  // Pre-load the default language
  loadBundle(_currentLang).catch(function (err) {
    console.warn('[i18n] Failed to load default language:', err);
  });

  // Expose as window.i18n
  window.i18n = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    loadBundle: loadBundle
  };
})();
