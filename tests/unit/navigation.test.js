/**
 * Navigation guards.
 *
 * The window this protects has a preload bridge that signs Telegram calls with
 * the stored bot token. The bridge belongs to the webContents rather than to
 * the document, so it survives a navigation — a page the window is talked into
 * loading keeps `window.app.api()`. These tests pin the policy that stops that.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  DEV_ORIGIN,
  isOwnPage,
  isExternallyOpenable,
  attachNavigationGuards,
} = require('../../src/main/security/navigation.js');

/** A stand-in for WebContents that records what was attached and lets us fire it. */
function fakeContents() {
  const listeners = new Map();
  return {
    openHandler: null,
    on(name, fn) {
      listeners.set(name, fn);
    },
    setWindowOpenHandler(fn) {
      this.openHandler = fn;
    },
    /** Fire an event and report whether the handler called preventDefault. */
    emit(name, ...args) {
      let prevented = false;
      const event = {
        preventDefault() {
          prevented = true;
        },
      };
      const fn = listeners.get(name);
      if (!fn) throw new Error(`no listener for ${name}`);
      fn(event, ...args);
      return prevented;
    },
    has(name) {
      return listeners.has(name);
    },
  };
}

describe('isOwnPage', () => {
  it('accepts the packaged UI, which loads over file:', () => {
    expect(isOwnPage('file:///opt/app/build/renderer/index.html')).toBe(true);
  });

  it('accepts the dev server only in a dev build', () => {
    expect(isOwnPage(`${DEV_ORIGIN}/index.html`, true)).toBe(true);
    expect(isOwnPage(`${DEV_ORIGIN}/index.html`, false)).toBe(false);
  });

  it('is not fooled by a hostname that merely starts with the dev origin', () => {
    // A prefix test would have accepted this one.
    expect(isOwnPage('http://localhost:5173.evil.example/', true)).toBe(false);
    expect(isOwnPage('http://localhost:51730/', true)).toBe(false);
    expect(isOwnPage('https://localhost:5173/', true)).toBe(false);
  });

  it('rejects remote pages and junk', () => {
    expect(isOwnPage('https://evil.example')).toBe(false);
    expect(isOwnPage('data:text/html,<h1>hi')).toBe(false);
    expect(isOwnPage('not a url')).toBe(false);
    expect(isOwnPage('')).toBe(false);
    expect(isOwnPage(null)).toBe(false);
  });
});

describe('isExternallyOpenable', () => {
  it('hands web links and mail to the OS', () => {
    expect(isExternallyOpenable('https://example.com')).toBe(true);
    expect(isExternallyOpenable('http://example.com')).toBe(true);
    expect(isExternallyOpenable('mailto:someone@example.com')).toBe(true);
  });

  it('refuses anything the OS would open with another program', () => {
    // shell.openExternal on a file: URL runs whatever is registered for it.
    expect(isExternallyOpenable('file:///etc/passwd')).toBe(false);
    expect(isExternallyOpenable('data:text/html,<h1>hi')).toBe(false);
    expect(isExternallyOpenable('javascript:alert(1)')).toBe(false);
    expect(isExternallyOpenable('ms-msdt:/id')).toBe(false);
    expect(isExternallyOpenable('smb://host/share')).toBe(false);
    expect(isExternallyOpenable('not a url')).toBe(false);
    expect(isExternallyOpenable('')).toBe(false);
  });
});

describe('attachNavigationGuards', () => {
  /** @param {object} [options] */
  function attach(options = {}) {
    const contents = fakeContents();
    const openExternal = vi.fn();
    attachNavigationGuards(contents, { openExternal, ...options });
    return { contents, openExternal };
  }

  it('lets the app navigate within its own UI', () => {
    const { contents, openExternal } = attach();
    const prevented = contents.emit('will-navigate', 'file:///opt/app/index.html');
    expect(prevented).toBe(false);
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('blocks navigation to a remote page and opens it in the browser instead', () => {
    const { contents, openExternal } = attach();
    const prevented = contents.emit('will-navigate', 'https://evil.example/steal');
    expect(prevented).toBe(true);
    expect(openExternal).toHaveBeenCalledWith('https://evil.example/steal');
  });

  it('blocks a data: URL without handing it anywhere', () => {
    const { contents, openExternal } = attach();
    const prevented = contents.emit('will-navigate', 'data:text/html,<h1>attacker');
    expect(prevented).toBe(true);
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('blocks the dev server in a packaged build', () => {
    const { contents } = attach({ isDev: false });
    expect(contents.emit('will-navigate', `${DEV_ORIGIN}/`)).toBe(true);
  });

  it('opens target="_blank" links externally and never in an app window', () => {
    const { contents, openExternal } = attach();
    const result = contents.openHandler({ url: 'https://example.com/docs' });
    expect(result).toEqual({ action: 'deny' });
    expect(openExternal).toHaveBeenCalledWith('https://example.com/docs');
  });

  it('denies a window even when the URL is not one it will open', () => {
    const { contents, openExternal } = attach();
    expect(contents.openHandler({ url: 'file:///etc/passwd' })).toEqual({ action: 'deny' });
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('refuses to attach a <webview>', () => {
    const { contents } = attach();
    expect(contents.emit('will-attach-webview')).toBe(true);
  });

  it('reports what it refused, so it can be logged', () => {
    const onBlocked = vi.fn();
    const contents = fakeContents();
    attachNavigationGuards(contents, { openExternal: vi.fn(), onBlocked });
    contents.emit('will-navigate', 'https://evil.example');
    expect(onBlocked).toHaveBeenCalledWith(
      'blocked in-app navigation to',
      'https://evil.example',
    );
  });
});

describe('the main process wires the guards up', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const main = fs.readFileSync(
    path.resolve(__dirname, '../../src/main/main.js'),
    'utf8',
  );

  it('attaches them to the window it creates', () => {
    expect(main).toMatch(/attachNavigationGuards\(mainWindow\.webContents/);
  });

  it('keeps the renderer sandboxed', () => {
    expect(main).toMatch(/nodeIntegration:\s*false/);
    expect(main).toMatch(/contextIsolation:\s*true/);
  });
});
