/**
 * Navigation policy — what the app's own window is allowed to become, and what
 * has to be handed to the user's browser instead.
 *
 * Pure decisions live here with no Electron dependency, so they are testable;
 * `attachNavigationGuards` is the thin part that wires them to a webContents.
 *
 * Why this matters more than it looks: the preload bridge belongs to the
 * webContents, not to the document. Navigate the window to any other page and
 * that page still has `window.app.api()`, which signs every call with the
 * stored bot token. Electron navigates a window by default when a link or a
 * file is dropped onto it, so without a guard a dropped link is enough to hand
 * the token to a remote page.
 *
 * @module main/security/navigation
 */

/** The dev server the `--dev` build loads from. */
const DEV_ORIGIN = 'http://localhost:5173';

/** Schemes that are safe to hand to the operating system's default handler. */
const EXTERNAL_SCHEMES = Object.freeze(['http:', 'https:', 'mailto:']);

/**
 * Is this the app's own UI?
 *
 * Packaged builds load over `file:`; dev builds also load from Vite. Matching
 * the dev origin is done on the parsed origin rather than a prefix, so
 * `http://localhost:5173.evil.example` is not mistaken for it.
 *
 * @param {string} url
 * @param {boolean} [isDev] - Dev builds also live on the Vite origin.
 * @returns {boolean}
 */
function isOwnPage(url, isDev = false) {
  if (typeof url !== 'string' || !url) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === 'file:') return true;
  return isDev && parsed.origin === DEV_ORIGIN;
}

/**
 * Should this URL be opened in the user's real browser?
 *
 * Deliberately narrower than "not our page": `file:` would open a local file
 * with whatever program claims it, and a custom scheme hands the URL to any
 * program that registered for it. Neither is something a link inside a message
 * preview should be able to reach.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isExternallyOpenable(url) {
  if (typeof url !== 'string' || !url) return false;
  try {
    return EXTERNAL_SCHEMES.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Attach the guards to a webContents.
 *
 * @param {object} contents - An Electron WebContents (or anything with the
 *   same `on`/`setWindowOpenHandler` shape, which is what the tests pass).
 * @param {object} options
 * @param {boolean} [options.isDev] - Allow the Vite dev origin as our own page.
 * @param {(url: string) => void} options.openExternal - Usually `shell.openExternal`.
 * @param {(message: string, url: string) => void} [options.onBlocked] - Told about
 *   anything refused, so it can be logged.
 */
function attachNavigationGuards(contents, { isDev = false, openExternal, onBlocked } = {}) {
  const hand = (url) => {
    if (isExternallyOpenable(url)) openExternal(url);
    else if (onBlocked) onBlocked('refused to open', url);
  };

  contents.on('will-navigate', (event, url) => {
    if (isOwnPage(url, isDev)) return;
    event.preventDefault();
    if (onBlocked) onBlocked('blocked in-app navigation to', url);
    hand(url);
  });

  // A link in the preview carries target="_blank". Hand it to the real browser
  // rather than opening a frameless Electron window with no address bar.
  contents.setWindowOpenHandler(({ url }) => {
    hand(url);
    return { action: 'deny' };
  });

  // Nothing in this app embeds a <webview>; refuse to start one.
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
    if (onBlocked) onBlocked('refused a <webview>', '');
  });
}

module.exports = {
  DEV_ORIGIN,
  EXTERNAL_SCHEMES,
  isOwnPage,
  isExternallyOpenable,
  attachNavigationGuards,
};
