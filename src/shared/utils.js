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

/** Schemes a link may use. Everything else is refused. */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:', 'tg:'];

/**
 * Keep a URL only if its scheme is one we allow.
 *
 * This used to reject `javascript:`, `data:` and `vbscript:` by prefix, which is
 * the wrong way round. A denylist has to anticipate every dangerous scheme, and
 * it misses the ones written to defeat it: browsers ignore control characters
 * inside a scheme, so `java&#9;script:` survives a `startsWith('javascript:')`
 * test and still runs. An allowlist cannot be widened by an input nobody thought
 * of, and it matches the vocabulary `html-serializer.js` already enforces on the
 * wire — so what the editor accepts is what Telegram will accept.
 *
 * @param {string} url
 * @returns {string} A usable URL, or '' when it is not acceptable.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // In-document anchors are addresses, not schemes.
  if (trimmed.startsWith('#')) return trimmed;
  // Relative and protocol-relative forms have no meaning in a sent message.
  if (trimmed.startsWith('/')) return '';

  const scheme = (trimmed.match(/^([a-zA-Z][\w+.-]*:)/) || [])[1];
  if (scheme) {
    return SAFE_SCHEMES.includes(scheme.toLowerCase()) ? trimmed : '';
  }

  // No scheme at all — someone typed "example.com". Assume https rather than
  // dropping it later on the wire. A colon anywhere means it was trying to be a
  // scheme and the regex refused it, so that is rejected instead of guessed at.
  return trimmed.includes(':') ? '' : `https://${trimmed}`;
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
