/**
 * Unit tests for the proxy configuration helpers.
 *
 * The point of this module: Node's `https` ignores the OS proxy, so behind a
 * v2rayN "Set system proxy" setup every Telegram request used to fail. These
 * tests pin the shape of what we hand to `session.setProxy()` and make sure a
 * bad stored configuration can never break startup.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PROXY,
  PROXY_MODES,
  PROXY_SCHEMES,
  V2RAYN_PORTS,
  buildProxyRules,
  buildSessionProxyConfig,
  describeProxy,
  isValidProxyConfig,
  isValidProxyHost,
  isValidProxyPort,
  normalizeProxyConfig,
  publicProxyConfig,
} from '../../src/main/net/proxy.js';

describe('defaults', () => {
  it('starts on the system proxy so a VPN client just works', () => {
    expect(DEFAULT_PROXY.mode).toBe('system');
  });

  it('defaults the manual endpoint to v2rayN SOCKS5', () => {
    expect(DEFAULT_PROXY.scheme).toBe('socks5');
    expect(DEFAULT_PROXY.host).toBe('127.0.0.1');
    expect(DEFAULT_PROXY.port).toBe(V2RAYN_PORTS.socks);
  });

  it('offers exactly the modes and schemes Chromium accepts', () => {
    expect(PROXY_MODES).toEqual(['system', 'manual', 'direct']);
    expect(PROXY_SCHEMES).toEqual(['http', 'https', 'socks4', 'socks5']);
  });
});

describe('isValidProxyHost', () => {
  it('accepts IPv4, bracketed IPv6 and hostnames', () => {
    expect(isValidProxyHost('127.0.0.1')).toBe(true);
    expect(isValidProxyHost('10.0.0.255')).toBe(true);
    expect(isValidProxyHost('[::1]')).toBe(true);
    expect(isValidProxyHost('proxy.local')).toBe(true);
    expect(isValidProxyHost('my-proxy')).toBe(true);
  });

  it('rejects octets above 255', () => {
    expect(isValidProxyHost('999.1.1.1')).toBe(false);
  });

  it('rejects anything carrying a scheme, path, credentials or spaces', () => {
    expect(isValidProxyHost('http://127.0.0.1')).toBe(false);
    expect(isValidProxyHost('127.0.0.1/path')).toBe(false);
    expect(isValidProxyHost('user@host')).toBe(false);
    expect(isValidProxyHost('a host')).toBe(false);
    expect(isValidProxyHost('')).toBe(false);
    expect(isValidProxyHost(null)).toBe(false);
  });
});

describe('isValidProxyPort', () => {
  it('accepts 1–65535', () => {
    expect(isValidProxyPort(1)).toBe(true);
    expect(isValidProxyPort('10808')).toBe(true);
    expect(isValidProxyPort(65535)).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isValidProxyPort(0)).toBe(false);
    expect(isValidProxyPort(65536)).toBe(false);
    expect(isValidProxyPort(-1)).toBe(false);
    expect(isValidProxyPort(80.5)).toBe(false);
    expect(isValidProxyPort('abc')).toBe(false);
  });
});

describe('isValidProxyConfig', () => {
  it('needs only a known mode for system and direct', () => {
    expect(isValidProxyConfig({ mode: 'system' })).toBe(true);
    expect(isValidProxyConfig({ mode: 'direct' })).toBe(true);
  });

  it('needs a full endpoint for manual', () => {
    expect(isValidProxyConfig({ mode: 'manual', scheme: 'socks5', host: '127.0.0.1', port: 10808 })).toBe(true);
    expect(isValidProxyConfig({ mode: 'manual', scheme: 'socks5', host: '127.0.0.1' })).toBe(false);
    expect(isValidProxyConfig({ mode: 'manual', scheme: 'ftp', host: '127.0.0.1', port: 1 })).toBe(false);
    expect(isValidProxyConfig({ mode: 'manual', scheme: 'http', host: 'bad host', port: 1 })).toBe(false);
  });

  it('rejects unknown modes and non-objects', () => {
    expect(isValidProxyConfig({ mode: 'tor' })).toBe(false);
    expect(isValidProxyConfig(null)).toBe(false);
    expect(isValidProxyConfig('system')).toBe(false);
  });
});

describe('normalizeProxyConfig', () => {
  it('fills in the defaults', () => {
    expect(normalizeProxyConfig()).toEqual(DEFAULT_PROXY);
  });

  it('keeps valid values and repairs invalid ones', () => {
    expect(normalizeProxyConfig({ mode: 'manual', scheme: 'http', host: '10.0.0.2', port: '8080' })).toEqual({
      mode: 'manual',
      scheme: 'http',
      host: '10.0.0.2',
      port: 8080,
      username: '',
      password: '',
    });
    const repaired = normalizeProxyConfig({ mode: 'nope', scheme: 'ftp', host: 'bad host', port: 99999 });
    expect(repaired.mode).toBe('system');
    expect(repaired.scheme).toBe('socks5');
    expect(repaired.host).toBe('127.0.0.1');
    expect(repaired.port).toBe(10808);
  });

  it('survives junk instead of an object', () => {
    expect(normalizeProxyConfig('garbage')).toEqual(DEFAULT_PROXY);
    expect(normalizeProxyConfig(null)).toEqual(DEFAULT_PROXY);
  });

  it('trims the host', () => {
    expect(normalizeProxyConfig({ host: '  127.0.0.1  ' }).host).toBe('127.0.0.1');
  });
});

describe('buildProxyRules', () => {
  it('writes scheme://host:port', () => {
    expect(buildProxyRules({ mode: 'manual', scheme: 'socks5', host: '127.0.0.1', port: 10808 })).toBe(
      'socks5://127.0.0.1:10808',
    );
    expect(buildProxyRules({ mode: 'manual', scheme: 'http', host: '127.0.0.1', port: 10809 })).toBe(
      'http://127.0.0.1:10809',
    );
  });
});

describe('buildSessionProxyConfig', () => {
  it('asks Chromium to follow the OS settings in system mode', () => {
    expect(buildSessionProxyConfig({ mode: 'system' })).toEqual({ mode: 'system' });
  });

  it('disables the proxy in direct mode', () => {
    expect(buildSessionProxyConfig({ mode: 'direct' })).toEqual({ mode: 'direct' });
  });

  it('passes rules and a local bypass in manual mode', () => {
    expect(
      buildSessionProxyConfig({ mode: 'manual', scheme: 'socks5', host: '127.0.0.1', port: 10808 }),
    ).toEqual({ proxyRules: 'socks5://127.0.0.1:10808', proxyBypassRules: '<local>' });
  });

  it('falls back to system mode for a broken configuration', () => {
    expect(buildSessionProxyConfig({ mode: 'whatever' })).toEqual({ mode: 'system' });
  });
});

describe('describeProxy', () => {
  it('summarizes each mode', () => {
    expect(describeProxy({ mode: 'system' })).toBe('system');
    expect(describeProxy({ mode: 'direct' })).toBe('direct');
    expect(describeProxy({ mode: 'manual', scheme: 'socks5', host: '1.2.3.4', port: 1080 })).toBe(
      'socks5://1.2.3.4:1080',
    );
  });
});

describe('publicProxyConfig', () => {
  it('never exposes the password to the renderer', () => {
    const view = publicProxyConfig({
      mode: 'manual',
      scheme: 'http',
      host: '127.0.0.1',
      port: 10809,
      username: 'u',
      password: 'secret',
    });
    expect(view).toEqual({
      mode: 'manual',
      scheme: 'http',
      host: '127.0.0.1',
      port: 10809,
      username: 'u',
      hasPassword: true,
    });
    expect(JSON.stringify(view)).not.toContain('secret');
  });

  it('reports when no password is stored', () => {
    expect(publicProxyConfig({ mode: 'system' }).hasPassword).toBe(false);
  });
});
