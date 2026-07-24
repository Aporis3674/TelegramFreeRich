/**
 * TelegramFreeRich — Electron Main Process
 * Handles: window management, encrypted settings, Telegram API proxy.
 * Security: token NEVER leaves main process.
 */

const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const {
  isValidToken,
  isValidChatId,
  isValidLang,
  isValidMethod,
} = require('./security/validation');

const HTTP_TIMEOUT_MS = 30000;
const MAX_RESPONSE_BYTES = 1048576;

let mainWindow;
let secureToken = '';
let secureChatId = '';
let secureLang = 'en';

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
    });
    const encrypted = safeStorage.encryptString(data);
    fs.writeFileSync(filePath, encrypted);
    return true;
  } catch (e) {
    console.error('[Settings] Failed to save:', e.message);
    return false;
  }
}

// ===================== HTTP Request with Timeout =====================

/**
 * Make an HTTPS request to Telegram API with timeout and size limit.
 * @param {string} url
 * @param {object|null} payload - null for GET, object for POST
 * @returns {Promise<object>}
 */
function tgRequest(url, payload = null) {
  return new Promise((resolve, reject) => {
    const isPost = payload !== null;
    const data = isPost ? JSON.stringify(payload) : null;

    const options = {
      method: isPost ? 'POST' : 'GET',
      headers: isPost
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          }
        : {},
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      let size = 0;

      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          req.destroy();
          reject(new Error('Response too large'));
          return;
        }
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.setTimeout(HTTP_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ===================== Window =====================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d12',
    titleBarStyle: 'hiddenInset',
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
    const built = path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html');
    const source = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(fs.existsSync(built) ? built : source);
  }
}

app.whenReady().then(() => {
  loadSecureSettings();
  createWindow();
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
ipcMain.handle('save-settings', async (_event, { token, chatId, lang }) => {
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
  const saved = saveSecureSettings();
  return saved
    ? { ok: true }
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
  };
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
