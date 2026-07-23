const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

let mainWindow;
let secureToken = '';
let secureChatId = '';
let secureLang = 'en';

// --- Secure Settings Path ---
function getSettingsPath() {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'settings.enc');
}

// --- Load encrypted settings from disk ---
function loadSecureSettings() {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return;

  try {
    const raw = fs.readFileSync(filePath);
    const decrypted = safeStorage.decryptString(raw);
    const parsed = JSON.parse(decrypted);
    secureToken = parsed.token || '';
    secureChatId = parsed.chatId || '';
    secureLang = parsed.lang || 'en';
  } catch (e) {
    console.error('Failed to load secure settings:', e.message);
  }
}

// --- Save encrypted settings to disk ---
function saveSecureSettings() {
  const filePath = getSettingsPath();
  try {
    const data = JSON.stringify({
      token: secureToken,
      chatId: secureChatId,
      lang: secureLang,
    });
    const encrypted = safeStorage.encryptString(data);
    fs.writeFileSync(filePath, encrypted);
  } catch (e) {
    console.error('Failed to save secure settings:', e.message);
  }
}

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

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
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

// === IPC Handlers ===

// Telegram API call — token NEVER leaves main process
ipcMain.handle('tg-api', async (event, { method, body }) => {
  if (!secureToken) {
    return { ok: false, description: 'Bot token not configured' };
  }

  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${secureToken}/${method}`;
    const data = JSON.stringify(body);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
});

// Save settings — token encrypted via safeStorage
ipcMain.handle('save-settings', async (event, { token, chatId, lang }) => {
  if (token !== undefined) secureToken = token;
  if (chatId !== undefined) secureChatId = chatId;
  if (lang !== undefined) secureLang = lang;
  saveSecureSettings();
  return { ok: true };
});

// Load settings — returns everything EXCEPT token (security)
ipcMain.handle('load-settings', async () => {
  return {
    tokenSet: !!secureToken,
    chatId: secureChatId,
    lang: secureLang,
  };
});

// Test connection — uses internal token
ipcMain.handle('tg-test', async () => {
  if (!secureToken) {
    return { ok: false, description: 'Bot token not configured' };
  }
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${secureToken}/getMe`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
});

// File dialog for image/media selection
ipcMain.handle('open-file', async (event, { filters }) => {
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
