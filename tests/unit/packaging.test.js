/**
 * Packaging guards.
 *
 * A broken Windows installer cannot be caught by any test that runs here, and
 * it is only discovered by a user who cannot upgrade. These tests pin the
 * pieces that made upgrades fail with "Failed to uninstall old application
 * files ...: 2" so they cannot quietly disappear from the config again.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

describe('electron-builder configuration', () => {
  const build = pkg.build;

  it('keeps the renderer out of the installer output directory', () => {
    // electron-builder excludes its own output dir from the package, so the
    // renderer must not be built into it — that shipped a UI-less app once.
    expect(build.directories.output).toBe('dist');
    expect(build.files).toContain('build/renderer/**/*');
  });

  it('reads NSIS customisation from a directory that is committed', () => {
    const buildResources = build.directories.buildResources;
    expect(buildResources).toBe('installer');

    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    const ignored = gitignore
      .split('\n')
      .map((line) => line.trim().replace(/\/$/, ''))
      .filter(Boolean);
    expect(ignored).not.toContain(buildResources);
  });

  it('ships an installer and a no-install portable build for Windows', () => {
    expect(build.win.target).toEqual(expect.arrayContaining(['nsis', 'portable']));
  });

  it('installs per user, so closing the app never needs elevation', () => {
    expect(build.nsis.perMachine).toBe(false);
    expect(build.nsis.oneClick).toBe(false);
  });

  it('keeps settings across an upgrade', () => {
    expect(build.nsis.deleteAppDataOnUninstall).toBe(false);
  });

  it('points at the custom NSIS script', () => {
    expect(build.nsis.include).toBe('installer/installer.nsh');
    expect(fs.existsSync(path.join(ROOT, build.nsis.include))).toBe(true);
  });
});

describe('installer.nsh', () => {
  const nsh = fs.readFileSync(path.join(ROOT, 'installer', 'installer.nsh'), 'utf8');
  /** The same script with `;` comments stripped, so prose is not asserted on. */
  const code = nsh
    .split('\n')
    .filter((line) => !line.trim().startsWith(';'))
    .join('\n');

  it('closes the app before the old uninstaller looks for it', () => {
    expect(nsh).toMatch(/!macro customInit\b/);
    expect(nsh).toMatch(/taskkill\.exe" \/IM "\$\{APP_EXECUTABLE_FILENAME}"/);
    // Chromium's helper processes hold the same files open as the main one.
    expect(nsh).toMatch(/taskkill\.exe" \/F \/T \/IM "\$\{APP_EXECUTABLE_FILENAME}"/);
  });

  it('closes the app before a standalone uninstall too', () => {
    expect(nsh).toMatch(/!macro customUnInit\b/);
  });

  it('does not abort the install when the old uninstaller reports an error', () => {
    expect(nsh).toMatch(/!macro customUnInstallCheck\b/);
    expect(nsh).toMatch(/!macro customUnInstallCheckCurrentUser\b/);
    // The default handling this replaces is a MessageBox followed by Quit.
    expect(code).not.toMatch(/\bQuit\b/);
    expect(code).not.toMatch(/MessageBox/);
  });

  it('has balanced macro definitions', () => {
    const opened = nsh.match(/^!macro\b/gm) || [];
    const closed = nsh.match(/^!macroend\b/gm) || [];
    expect(closed.length).toBe(opened.length);
  });
});

describe('main process', () => {
  const main = fs.readFileSync(path.join(ROOT, 'src', 'main', 'main.js'), 'utf8');

  it('allows a single instance only', () => {
    expect(main).toMatch(/requestSingleInstanceLock\(\)/);
    expect(main).toMatch(/'second-instance'/);
  });

  it('never touches session.defaultSession while the module is loading', () => {
    // Electron throws "Session can only be received when app is ready" — read
    // it at module scope and the app dies before a window exists. Every use
    // must therefore be deferred: behind an arrow, or inside a function that
    // only runs after `whenReady`.
    const eager = main
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !/^(\*|\/\/|\/\*)/.test(line))
      .filter((line) => line.includes('session.defaultSession'))
      .filter((line) => !/=>|\bawait\b|\breturn\b/.test(line));
    expect(eager).toEqual([]);
  });
});
