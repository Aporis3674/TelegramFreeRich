/**
 * The IPC surface.
 *
 * Everything the renderer can reach in the main process goes through the
 * preload bridge, and every one of those calls runs with the user's bot token.
 * The surface is worth pinning in both directions: an exposed method with no
 * handler behind it is dead code that still widens the bridge, and a method the
 * renderer sends but the allowlist does not know about fails only at runtime,
 * as "Invalid API method" on a send the user was trying to make.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ALLOWED_METHODS } = require('../../src/main/security/validation.js');

const ROOT = path.resolve(__dirname, '../..');
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

const preload = read('src', 'main', 'preload.js');
const main = read('src', 'main', 'main.js');

/** @param {string} source @param {RegExp} pattern */
const collect = (source, pattern) =>
  [...source.matchAll(pattern)].map((m) => m[1]).sort();

const invoked = [...new Set(collect(preload, /ipcRenderer\.invoke\(\s*'([^']+)'/g))];
const handled = [...new Set(collect(main, /ipcMain\.handle\(\s*'([^']+)'/g))];

describe('preload bridge and main-process handlers', () => {
  it('exposes exactly the channels the main process answers', () => {
    expect(invoked).toEqual(handled);
  });

  it('does not expose a channel with nothing behind it', () => {
    // `open-file` was exactly this: a handler and a bridge method that no part
    // of the renderer ever called.
    for (const channel of invoked) {
      expect(handled, `preload invokes '${channel}' with no handler`).toContain(channel);
    }
  });

  it('keeps the bot token out of the renderer', () => {
    // load-settings reports whether a token is set, never the token itself.
    expect(main).toMatch(/tokenSet:\s*!!secureToken/);
    const loadHandler = main.slice(main.indexOf("ipcMain.handle('load-settings'"));
    const body = loadHandler.slice(0, loadHandler.indexOf('});'));
    expect(body).not.toMatch(/token:\s*secureToken/);
  });
});

describe('the renderer only asks for methods the allowlist permits', () => {
  const rendererDir = path.join(ROOT, 'src', 'renderer');

  /** @param {string} dir @returns {string[]} */
  function jsFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return jsFiles(full);
      return /\.jsx?$/.test(entry.name) ? [full] : [];
    });
  }

  const requested = new Set();
  for (const file of jsFiles(rendererDir)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/\.api\(\s*\n?\s*'([^']+)'/g)) requested.add(m[1]);
  }

  it('finds the calls it is meant to be checking', () => {
    // Guard against the regex silently matching nothing and passing.
    expect(requested.size).toBeGreaterThan(0);
  });

  it('sends nothing the main process would refuse', () => {
    for (const method of requested) {
      expect(ALLOWED_METHODS, `renderer sends '${method}'`).toContain(method);
    }
  });
});
