/**
 * Telegram request layer.
 *
 * Requests go through Electron's `net` module — Chromium's network stack —
 * rather than Node's `https`. That is the whole reason the app works behind a
 * system proxy: Node ignores the operating system's proxy settings, Chromium
 * follows them (including PAC scripts), which is what a VPN client's
 * "Set system proxy" option configures.
 *
 * The Electron objects are injected so this module can be exercised without
 * booting a window.
 *
 * @module main/net/request
 */

const { describeProxy } = require('./proxy');

const HTTP_TIMEOUT_MS = 30000;
const MAX_RESPONSE_BYTES = 1048576;

/**
 * Turn a network failure into a message that points at the proxy when that is
 * the likely cause — the common case where Telegram is blocked.
 * @param {Error} error
 * @param {object} proxyConfig
 * @returns {string}
 */
function proxyHint(error, proxyConfig) {
  const message = (error && error.message) || 'Network error';
  if (/ERR_CERT/i.test(message)) {
    // A proxy that terminates TLS with a certificate the OS does not trust.
    return `${message} — the proxy is intercepting TLS; install its certificate or switch proxy`;
  }
  if (/PROXY|TUNNEL|ERR_SOCKS/i.test(message)) {
    return `${message} — check the proxy (${describeProxy(proxyConfig)})`;
  }
  if (
    proxyConfig.mode !== 'direct' &&
    /ERR_CONNECTION|ERR_TIMED_OUT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_EMPTY/i.test(message)
  ) {
    return `${message} — proxy: ${describeProxy(proxyConfig)}`;
  }
  return message;
}

/**
 * Build the request function.
 *
 * `getSession` is a getter rather than a session, because Electron's
 * `session.defaultSession` throws unless the app is already ready — reading it
 * while the main process is still loading its modules crashes the app before a
 * window exists.
 *
 * @param {{
 *   net: object,
 *   getSession: () => object,
 *   getProxy: () => object,
 *   timeoutMs?: number,
 *   maxBytes?: number,
 * }} deps
 * @returns {(url: string, payload?: object|null) => Promise<object>}
 */
function createRequester({
  net,
  getSession,
  getProxy,
  timeoutMs = HTTP_TIMEOUT_MS,
  maxBytes = MAX_RESPONSE_BYTES,
}) {
  return function tgRequest(url, payload = null) {
    return new Promise((resolve, reject) => {
      const isPost = payload !== null;
      const data = isPost ? JSON.stringify(payload) : null;

      const request = net.request({
        method: isPost ? 'POST' : 'GET',
        url,
        session: getSession(),
        useSessionCookies: false,
      });

      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          request.abort();
        } catch {
          /* already gone */
        }
        reject(new Error(proxyHint(error, getProxy())));
      };
      const succeed = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };

      const timer = setTimeout(() => fail(new Error('Request timeout')), timeoutMs);

      if (isPost) {
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Content-Length', String(Buffer.byteLength(data)));
      }

      request.on('response', (response) => {
        let body = '';
        let size = 0;

        response.on('data', (chunk) => {
          size += chunk.length;
          if (size > maxBytes) {
            fail(new Error('Response too large'));
            return;
          }
          body += chunk;
        });

        response.on('end', () => {
          if (settled) return;
          try {
            succeed(JSON.parse(body));
          } catch {
            fail(new Error('Invalid JSON response'));
          }
        });

        response.on('error', fail);
      });

      request.on('error', fail);

      if (data) request.write(data);
      request.end();
    });
  };
}

module.exports = { createRequester, proxyHint, HTTP_TIMEOUT_MS, MAX_RESPONSE_BYTES };
