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
 * The Telegram methods the renderer is allowed to ask the main process to call.
 *
 * An allowlist rather than a shape check: every call is signed with the stored
 * bot token, so anything reachable here is reachable with the user's bot
 * identity. A pattern like /^[a-zA-Z]+$/ would also admit `getUpdates` (read
 * everything the bot receives), `setWebhook` (redirect it) and
 * `banChatMember` — none of which this app has any reason to send.
 */
const ALLOWED_METHODS = Object.freeze([
  'sendRichMessage',
  'sendRichMessageDraft',
  'editMessageText',
  'sendChecklist',
  'getMe',
]);

/**
 * Validate a Telegram API method name against the allowlist.
 * @param {string} method
 * @returns {boolean}
 */
function isValidMethod(method) {
  return typeof method === 'string' && ALLOWED_METHODS.includes(method);
}

/**
 * Validate a business connection ID — the opaque token `sendChecklist` needs.
 * Telegram does not document its shape, so this only bounds the length and
 * keeps it to the characters its IDs are made of.
 * @param {string} id
 * @returns {boolean}
 */
function isValidBusinessConnectionId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{4,128}$/.test(id);
}

module.exports = {
  ALLOWED_METHODS,
  isValidToken,
  isValidChatId,
  isValidLang,
  isValidMethod,
  isValidBusinessConnectionId,
};
