/**
 * Application-wide constants for TelegramFreeRich.
 * @module shared/constants
 */

/** Maximum characters allowed in a Telegram message. */
export const MAX_CHARS = 32768;

/** Warning threshold (percentage of max chars) to show orange counter. */
export const CHAR_WARN_THRESHOLD = 0.9;

/** HTTP request timeout for Telegram API (milliseconds). */
export const HTTP_TIMEOUT_MS = 30000;

/** Maximum response body size in bytes (1 MB). */
export const MAX_RESPONSE_BYTES = 1048576;

/** Default language code. */
export const DEFAULT_LANG = 'en';

/** Default theme. */
export const DEFAULT_THEME = 'dark';

/** Supported languages. */
export const SUPPORTED_LANGS = ['en', 'fa'];

/** Telegram Bot API base URL. */
export const TG_API_BASE = 'https://api.telegram.org';

/** Maximum undo stack depth. */
export const MAX_UNDO_DEPTH = 100;

/** Debounce delay for input events (ms). */
export const INPUT_DEBOUNCE_MS = 150;

/** Toast display duration (ms). */
export const TOAST_DURATION_MS = 2500;
