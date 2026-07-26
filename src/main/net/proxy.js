/**
 * Proxy configuration — pure helpers, no Electron dependency so they stay
 * unit-testable.
 *
 * Why this exists: Node's `https` module ignores the operating system's proxy
 * settings. Where Telegram is blocked, people run v2rayN (or a similar client)
 * with "Set system proxy" enabled — that configures Windows, and therefore
 * Chromium, but not Node. Requests made with `https.request` still go out
 * directly and time out.
 *
 * So the app sends through Electron's `net` module, which uses Chromium's
 * network stack and follows whatever this module resolves:
 *
 *   system  — obey the OS proxy / PAC script (what "Set system proxy" writes)
 *   manual  — an explicit host:port, e.g. v2rayN's SOCKS5 on 127.0.0.1:10808
 *   direct  — no proxy at all
 *
 * @module main/net/proxy
 */

/** Supported proxy modes. */
const PROXY_MODES = Object.freeze(['system', 'manual', 'direct']);

/** Schemes Chromium can route through. */
const PROXY_SCHEMES = Object.freeze(['http', 'https', 'socks4', 'socks5']);

/** Defaults matching a stock v2rayN install. */
const DEFAULT_PROXY = Object.freeze({
  mode: 'system',
  scheme: 'socks5',
  host: '127.0.0.1',
  port: 10808,
  username: '',
  password: '',
});

/** Ports v2rayN listens on out of the box. */
const V2RAYN_PORTS = Object.freeze({ socks: 10808, http: 10809 });

/**
 * Validate a proxy host: an IP literal or a hostname — no scheme, no path.
 * @param {string} host
 * @returns {boolean}
 */
function isValidProxyHost(host) {
  if (typeof host !== 'string') return false;
  const value = host.trim();
  if (!value || value.length > 255) return false;
  if (/[\s/\\@?#]/.test(value)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return value.split('.').every((part) => Number(part) <= 255);
  }
  if (/^\[[0-9a-fA-F:]+\]$/.test(value)) return true;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(
    value,
  );
}

/**
 * Validate a TCP port.
 * @param {number|string} port
 * @returns {boolean}
 */
function isValidProxyPort(port) {
  const value = Number(port);
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

/**
 * Validate a whole proxy configuration.
 * @param {object} config
 * @returns {boolean}
 */
function isValidProxyConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!PROXY_MODES.includes(config.mode)) return false;
  if (config.mode !== 'manual') return true;
  return (
    PROXY_SCHEMES.includes(config.scheme) &&
    isValidProxyHost(config.host) &&
    isValidProxyPort(config.port)
  );
}

/**
 * Coerce whatever was stored or typed into a complete, valid configuration.
 * Bad values fall back to the defaults instead of throwing, so a corrupted
 * settings file can never stop the app from starting.
 * @param {object} [raw]
 * @returns {{ mode: string, scheme: string, host: string, port: number, username: string, password: string }}
 */
function normalizeProxyConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    mode: PROXY_MODES.includes(source.mode) ? source.mode : DEFAULT_PROXY.mode,
    scheme: PROXY_SCHEMES.includes(source.scheme) ? source.scheme : DEFAULT_PROXY.scheme,
    host: isValidProxyHost(source.host) ? String(source.host).trim() : DEFAULT_PROXY.host,
    port: isValidProxyPort(source.port) ? Number(source.port) : DEFAULT_PROXY.port,
    username: typeof source.username === 'string' ? source.username : '',
    password: typeof source.password === 'string' ? source.password : '',
  };
}

/**
 * Build the `proxyRules` string Chromium expects for a manual proxy.
 * @param {object} config
 * @returns {string} e.g. `socks5://127.0.0.1:10808`
 */
function buildProxyRules(config) {
  const { scheme, host, port } = normalizeProxyConfig(config);
  return `${scheme}://${host}:${port}`;
}

/**
 * Build the argument for `session.setProxy()`.
 * @param {object} config
 * @returns {object}
 */
function buildSessionProxyConfig(config) {
  const normalized = normalizeProxyConfig(config);
  if (normalized.mode === 'direct') return { mode: 'direct' };
  if (normalized.mode === 'manual') {
    return {
      proxyRules: buildProxyRules(normalized),
      // Loopback and the local network never need the tunnel.
      proxyBypassRules: '<local>',
    };
  }
  return { mode: 'system' };
}

/**
 * A short description of where traffic will go.
 * @param {object} config
 * @returns {string}
 */
function describeProxy(config) {
  const normalized = normalizeProxyConfig(config);
  if (normalized.mode === 'direct') return 'direct';
  if (normalized.mode === 'manual') return buildProxyRules(normalized);
  return 'system';
}

/**
 * The view of the configuration the renderer is allowed to see — the proxy
 * password stays in the main process, exactly like the bot token.
 * @param {object} config
 * @returns {object}
 */
function publicProxyConfig(config) {
  const normalized = normalizeProxyConfig(config);
  return {
    mode: normalized.mode,
    scheme: normalized.scheme,
    host: normalized.host,
    port: normalized.port,
    username: normalized.username,
    hasPassword: !!normalized.password,
  };
}

module.exports = {
  PROXY_MODES,
  PROXY_SCHEMES,
  DEFAULT_PROXY,
  V2RAYN_PORTS,
  isValidProxyHost,
  isValidProxyPort,
  isValidProxyConfig,
  normalizeProxyConfig,
  buildProxyRules,
  buildSessionProxyConfig,
  describeProxy,
  publicProxyConfig,
};
