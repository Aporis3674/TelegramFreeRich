/**
 * Input validation for IPC handlers.
 * Pure functions — no Electron dependency so unit-testable.
 */

/**
 * Validate a Telegram Bot token format.
 * Format: digits:alphanumeric_string (e.g. "123456:ABC-DEF...")
 * @param {string} token
 * @returns {boolean}
 */
function isValidToken(token) {
  return typeof token === 'string' && /^\d+:[A-Za-z0-9_-]{35,}$/.test(token);
}

/**
 * Validate a Telegram chat ID.
 * Accepts numeric IDs (e.g. "-1001234567890") or @usernames (e.g. "@channel").
 * @param {string} chatId
 * @returns {boolean}
 */
function isValidChatId(chatId) {
  return typeof chatId === 'string' && (/^-?\d+$/.test(chatId) || /^@[\w]{5,}$/.test(chatId));
}

/**
 * Validate a language code.
 * @param {string} lang
 * @returns {boolean}
 */
function isValidLang(lang) {
  return typeof lang === 'string' && ['en', 'fa'].includes(lang);
}

/**
 * Validate a Telegram API method name (alphanumeric only).
 * @param {string} method
 * @returns {boolean}
 */
function isValidMethod(method) {
  return typeof method === 'string' && /^[a-zA-Z]{3,64}$/.test(method);
}

module.exports = {
  isValidToken,
  isValidChatId,
  isValidLang,
  isValidMethod,
};
