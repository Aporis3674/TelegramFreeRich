/**
 * Unit tests for the Telegram request layer.
 *
 * A fake `net` stands in for Chromium so the timeout, the response size cap and
 * the proxy-aware error messages can be exercised without booting Electron.
 */
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequester, proxyHint } from '../../src/main/net/request.js';

/**
 * @param {{
 *   body?: string,
 *   chunks?: Array<string|Buffer>,
 *   status?: number,
 *   error?: string,
 *   silent?: boolean,
 * }} script
 */
function fakeNet(script = {}) {
  const calls = [];
  const net = {
    request(options) {
      calls.push(options);
      const request = new EventEmitter();
      request.headers = {};
      request.setHeader = vi.fn((name, value) => {
        request.headers[name] = value;
      });
      calls[calls.length - 1].headers = request.headers;
      request.write = vi.fn();
      request.abort = vi.fn();
      request.end = () => {
        if (script.silent) return; // never answers — exercises the timeout
        setImmediate(() => {
          if (script.error) {
            request.emit('error', new Error(script.error));
            return;
          }
          const response = new EventEmitter();
          if (script.status) response.statusCode = script.status;
          request.emit('response', response);
          for (const chunk of script.chunks || [script.body ?? '{}']) {
            response.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          response.emit('end');
        });
      };
      return request;
    },
  };
  return { net, calls };
}

const make = (script, options = {}) => {
  const { net, calls } = fakeNet(script);
  const sessionReads = [];
  const request = createRequester({
    net,
    getSession: () => {
      sessionReads.push(true);
      return { id: 'default' };
    },
    getProxy: () => options.proxy || { mode: 'system' },
    timeoutMs: options.timeoutMs ?? 1000,
    maxBytes: options.maxBytes ?? 1048576,
  });
  return { request, calls, sessionReads };
};

describe('createRequester', () => {
  it('parses a JSON response', async () => {
    const { request } = make({ body: '{"ok":true,"result":{"username":"bot"}}' });
    await expect(request('https://api.telegram.org/botX/getMe')).resolves.toEqual({
      ok: true,
      result: { username: 'bot' },
    });
  });

  it('sends GET without a body and POST with one', async () => {
    const get = make({ body: '{"ok":true}' });
    await get.request('https://api.telegram.org/botX/getMe');
    expect(get.calls[0].method).toBe('GET');

    const post = make({ body: '{"ok":true}' });
    await post.request('https://api.telegram.org/botX/sendRichMessage', { chat_id: '@c' });
    expect(post.calls[0].method).toBe('POST');
  });

  it('runs on the session it was given, so the proxy applies', async () => {
    const { request, calls } = make({ body: '{"ok":true}' });
    await request('https://api.telegram.org/botX/getMe');
    expect(calls[0].session).toEqual({ id: 'default' });
    expect(calls[0].useSessionCookies).toBe(false);
  });

  it('never sets Content-Length on a POST', async () => {
    // Chromium derives it from the body and rejects a manual value with
    // net::ERR_INVALID_ARGUMENT — which failed every send while the GET-only
    // connection test kept passing.
    const { request, calls } = make({ body: '{"ok":true}' });
    await request('https://api.telegram.org/botX/sendRichMessage', { chat_id: '@c' });
    expect(calls[0].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('reads the session per request, not while being built', async () => {
    // `session.defaultSession` throws unless the app is ready, so touching it
    // at construction time crashed the main process on startup.
    const { request, sessionReads } = make({ body: '{"ok":true}' });
    expect(sessionReads).toHaveLength(0);
    await request('https://api.telegram.org/botX/getMe');
    expect(sessionReads).toHaveLength(1);
  });

  it('rejects on invalid JSON', async () => {
    const { request } = make({ body: '<html>blocked</html>' });
    await expect(request('https://api.telegram.org/')).rejects.toThrow('Invalid JSON response');
  });

  it('reports the status with it, so a portal page can be told apart', async () => {
    const { request } = make({ body: '<html>blocked</html>', status: 403 });
    await expect(request('https://api.telegram.org/')).rejects.toThrow('(HTTP 403)');
  });

  it('decodes a UTF-8 character split across two chunks', async () => {
    // Chromium picks chunk boundaries; they do not respect character
    // boundaries. Decoding each chunk on its own turns a split character into
    // replacement characters, and breaks the parse when the split is inside a
    // JSON string. Persian bot names hit this every time.
    const body = Buffer.from('{"ok":true,"result":{"first_name":"ربات آزاد"}}', 'utf8');
    const cut = body.indexOf(Buffer.from('ربات', 'utf8')) + 1; // mid-character
    const { request } = make({ chunks: [body.subarray(0, cut), body.subarray(cut)] });
    await expect(request('https://api.telegram.org/botX/getMe')).resolves.toEqual({
      ok: true,
      result: { first_name: 'ربات آزاد' },
    });
  });

  it('rejects when the response exceeds the size cap', async () => {
    const { request } = make({ chunks: ['x'.repeat(64), 'y'.repeat(64)] }, { maxBytes: 100 });
    await expect(request('https://api.telegram.org/')).rejects.toThrow('Response too large');
  });

  it('times out when nothing answers', async () => {
    const { request } = make({ silent: true }, { timeoutMs: 20 });
    await expect(request('https://api.telegram.org/')).rejects.toThrow('Request timeout');
  });

  it('names the proxy when the tunnel fails', async () => {
    const { request } = make(
      { error: 'net::ERR_PROXY_CONNECTION_FAILED' },
      { proxy: { mode: 'manual', scheme: 'socks5', host: '127.0.0.1', port: 10808 } },
    );
    await expect(request('https://api.telegram.org/')).rejects.toThrow(
      'check the proxy (socks5://127.0.0.1:10808)',
    );
  });
});

describe('proxyHint', () => {
  const manual = { mode: 'manual', scheme: 'socks5', host: '127.0.0.1', port: 10808 };

  it('flags a TLS-intercepting proxy', () => {
    expect(proxyHint(new Error('net::ERR_CERT_AUTHORITY_INVALID'), manual)).toContain(
      'intercepting TLS',
    );
  });

  it('flags proxy and SOCKS failures', () => {
    expect(proxyHint(new Error('net::ERR_PROXY_CONNECTION_FAILED'), manual)).toContain(
      'socks5://127.0.0.1:10808',
    );
    expect(proxyHint(new Error('net::ERR_SOCKS_CONNECTION_FAILED'), manual)).toContain('check the proxy');
  });

  it('mentions the proxy for generic failures while one is configured', () => {
    expect(proxyHint(new Error('net::ERR_CONNECTION_TIMED_OUT'), manual)).toContain(
      'proxy: socks5://127.0.0.1:10808',
    );
  });

  it('stays quiet about the proxy in direct mode', () => {
    const message = proxyHint(new Error('net::ERR_CONNECTION_TIMED_OUT'), { mode: 'direct' });
    expect(message).toBe('net::ERR_CONNECTION_TIMED_OUT');
  });

  it('falls back to a generic message', () => {
    expect(proxyHint(null, { mode: 'system' })).toBe('Network error');
  });
});
