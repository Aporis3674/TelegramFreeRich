/**
 * Shared utility functions for TelegramFreeRich.
 * @module shared/utils
 */

let _idCounter = 0;

/**
 * Generate a unique ID for blocks.
 * Uses a simple counter + timestamp combo — sufficient for client-side uniqueness.
 * @returns {string}
 */
export function generateId() {
  _idCounter++;
  return `b${Date.now().toString(36)}${_idCounter.toString(36)}`;
}

/**
 * Deep clone a plain JSON-serializable value.
 * @param {*} value
 * @returns {*}
 */
export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Sanitize a URL to prevent XSS via javascript: or data: schemes.
 * @param {string} url
 * @returns {string} The original URL if safe, or empty string if dangerous.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  return url;
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Validate a Telegram Bot token format.
 * Format: digits:alphanumeric_string (e.g. "123456:ABC-DEF...")
 * @param {string} token
 * @returns {boolean}
 */
export function isValidToken(token) {
  return typeof token === 'string' && /^\d+:[A-Za-z0-9_-]{35,}$/.test(token);
}

/**
 * Validate a Telegram chat ID.
 * Accepts numeric IDs (e.g. "-1001234567890") or @usernames (e.g. "@channel").
 * @param {string} chatId
 * @returns {boolean}
 */
export function isValidChatId(chatId) {
  return typeof chatId === 'string' && (/^-?\d+$/.test(chatId) || /^@[\w]{5,}$/.test(chatId));
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (ch) => map[ch]);
}
