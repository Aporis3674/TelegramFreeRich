/**
 * TelegramFreeRich — Electron Main Process
 * Handles: window management, encrypted settings, Telegram API proxy.
 * Security: token NEVER leaves main process.
 */

const { app, BrowserWindow, ipcMain, dialog, net, safeStorage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  isValidToken,
  isValidChatId,
  isValidLang,
  isValidMethod,
} = require('./security/validation');
const {
  buildSessionProxyConfig,
  isValidProxyConfig,
  normalizeProxyConfig,
  publicProxyConfig,
} = require('./net/proxy');
const { createRequester } = require('./net/request');

const TELEGRAM_PROBE_URL = 'https://api.telegram.org/';

let mainWindow;
let secureToken = '';
let secureChatId = '';
let secureLang = 'en';
let secureProxy = normalizeProxyConfig();

// ===================== Encrypted Settings =====================

function getSettingsPath() {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'settings.enc');
}

function loadSecureSettings() {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return;
  try {
    const raw = fs.readFileSync(filePath);
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('[Settings] Encryption not available on this system');
      return;
    }
    const decrypted = safeStorage.decryptString(raw);
    const parsed = JSON.parse(decrypted);
    secureToken = parsed.token || '';
    secureChatId = parsed.chatId || '';
    secureLang = parsed.lang || 'en';
    secureProxy = normalizeProxyConfig(parsed.proxy);
  } catch (e) {
    console.error('[Settings] Failed to load:', e.message);
  }
}

function saveSecureSettings() {
  const filePath = getSettingsPath();
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('[Settings] Encryption not available — settings not saved');
      return false;
    }
    const data = JSON.stringify({
      token: secureToken,
      chatId: secureChatId,
      lang: secureLang,
      proxy: secureProxy,
    });
    const encrypted = safeStorage.encryptString(data);
    fs.writeFileSync(filePath, encrypted);
    return true;
  } catch (e) {
    console.error('[Settings] Failed to save:', e.message);
    return false;
  }
}

// ===================== Proxy =====================

/**
 * Apply the stored proxy configuration to the default session.
 * Every Telegram request rides on this session, so "system" mode picks up
 * whatever v2rayN (or any other client) set as the OS proxy.
 * @returns {Promise<void>}
 */
async function applyProxy() {
  try {
    await session.defaultSession.setProxy(buildSessionProxyConfig(secureProxy));
  } catch (e) {
    console.error('[Proxy] Failed to apply:', e.message);
  }
}

/**
 * Ask Chromium which proxy it would use for the Telegram API.
 * @returns {Promise<string>} e.g. `PROXY 127.0.0.1:10809` or `DIRECT`
 */
async function resolveTelegramProxy() {
  try {
    return await session.defaultSession.resolveProxy(TELEGRAM_PROBE_URL);
  } catch (e) {
    return `error: ${e.message}`;
  }
}

// ===================== HTTP Request =====================

/**
 * Telegram requests ride Chromium's stack, so they follow the proxy resolved
 * above — that is what makes a system proxy (v2rayN and friends) work.
 */
const tgRequest = createRequester({
  net,
  session: session.defaultSession,
  getProxy: () => secureProxy,
});

// ===================== Window =====================

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 520,
    height: 700,
    minWidth: 420,
    minHeight: 480,
    backgroundColor: '#212d3b',
    // Frameless on Windows/Linux (the renderer draws its own title bar);
    // hidden title bar with native traffic lights on macOS.
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 12, y: 8 } : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // In dev with Vite, load from localhost; otherwise load built file
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Prefer Vite build output, fall back to source HTML
    const built = path.join(__dirname, '..', '..', 'build', 'renderer', 'index.html');
    const source = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(fs.existsSync(built) ? built : source);
  }
}

app.whenReady().then(async () => {
  loadSecureSettings();
  await applyProxy();
  createWindow();
});

// Answer proxy authentication challenges with the stored credentials.
app.on('login', (event, _webContents, _details, authInfo, callback) => {
  if (!authInfo.isProxy) return;
  event.preventDefault();
  callback(secureProxy.username, secureProxy.password);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ===================== IPC Handlers =====================

/**
 * Telegram API call — token is added here, NEVER in renderer.
 */
ipcMain.handle('tg-api', async (_event, { method, body }) => {
  if (!secureToken) {
    return { ok: false, description: 'Bot token not configured' };
  }
  if (!isValidMethod(method)) {
    return { ok: false, description: 'Invalid API method' };
  }
  if (!body || typeof body !== 'object') {
    return { ok: false, description: 'Invalid request body' };
  }

  try {
    const url = `https://api.telegram.org/bot${secureToken}/${method}`;
    return await tgRequest(url, body);
  } catch (e) {
    return { ok: false, description: e.message || 'Network error' };
  }
});

/**
 * Save settings — encrypted via safeStorage. Token is validated.
 */
ipcMain.handle('save-settings', async (_event, { token, chatId, lang, proxy }) => {
  if (token !== undefined) {
    if (typeof token === 'string' && token.length > 0 && !isValidToken(token)) {
      return { ok: false, description: 'Invalid bot token format' };
    }
    secureToken = token || '';
  }
  if (chatId !== undefined) {
    if (typeof chatId === 'string' && chatId.length > 0 && !isValidChatId(chatId)) {
      return { ok: false, description: 'Invalid chat ID format' };
    }
    secureChatId = chatId || '';
  }
  if (lang !== undefined) {
    if (!isValidLang(lang)) {
      return { ok: false, description: 'Invalid language' };
    }
    secureLang = lang;
  }
  if (proxy !== undefined) {
    const candidate = normalizeProxyConfig({
      ...proxy,
      // An omitted password means "keep the stored one".
      password: typeof proxy.password === 'string' ? proxy.password : secureProxy.password,
    });
    if (!isValidProxyConfig(candidate)) {
      return { ok: false, description: 'Invalid proxy configuration' };
    }
    secureProxy = candidate;
    await applyProxy();
  }

  const saved = saveSecureSettings();
  return saved
    ? { ok: true, proxy: publicProxyConfig(secureProxy) }
    : { ok: false, description: 'Failed to encrypt/save settings' };
});

/**
 * Load settings — returns everything EXCEPT the token (security).
 */
ipcMain.handle('load-settings', async () => {
  return {
    tokenSet: !!secureToken,
    chatId: secureChatId,
    lang: secureLang,
    proxy: publicProxyConfig(secureProxy),
  };
});

/**
 * Report which proxy Chromium resolves for the Telegram API, and whether a
 * plain HTTPS request to it gets through. Used by the Settings panel so a
 * blocked connection can be told apart from a bad token.
 */
ipcMain.handle('proxy-test', async () => {
  const resolved = await resolveTelegramProxy();
  try {
    await tgRequest(`${TELEGRAM_PROBE_URL}bot0:invalid/getMe`, null);
    // Telegram answered — even a 401 body means the tunnel works.
    return { ok: true, reachable: true, resolved, mode: secureProxy.mode };
  } catch (e) {
    return {
      ok: false,
      reachable: false,
      resolved,
      mode: secureProxy.mode,
      description: e.message,
    };
  }
});

/**
 * Test connection — uses internal token, never exposes it.
 * Uses GET (getMe has no body).
 */
ipcMain.handle('tg-test', async () => {
  if (!secureToken) {
    return { ok: false, description: 'Bot token not configured' };
  }
  try {
    const url = `https://api.telegram.org/bot${secureToken}/getMe`;
    return await tgRequest(url, null);
  } catch (e) {
    return { ok: false, description: e.message || 'Network error' };
  }
});

/**
 * Window controls for the renderer-drawn title bar.
 */
ipcMain.handle('window-control', async (event, { action } = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (!win) return false;

  switch (action) {
    case 'minimize':
      win.minimize();
      return true;
    case 'toggle-maximize':
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
      return win.isMaximized();
    case 'close':
      win.close();
      return true;
    case 'is-maximized':
      return win.isMaximized();
    default:
      return false;
  }
});

/**
 * File dialog for image/media selection.
 */
ipcMain.handle('open-file', async (_event, { filters } = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      { name: 'Video', extensions: ['mp4', 'mov', 'webm'] },
      { name: 'Audio', extensions: ['mp3', 'ogg', 'wav'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});
