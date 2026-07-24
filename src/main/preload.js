/**
 * TelegramFreeRich — Preload Bridge
 * Exposes a minimal, secure API from main process to renderer.
 * contextIsolation: true, nodeIntegration: false.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  /**
   * Call Telegram API — token is handled securely in main process.
   * @param {string} method - API method name (e.g. 'sendRichMessage').
   * @param {object} body - Request body (without token).
   * @returns {Promise<object>} API response.
   */
  api: (method, body) => ipcRenderer.invoke('tg-api', { method, body }),

  /**
   * Save settings — encrypted via safeStorage.
   * @param {{ token?: string, chatId?: string, lang?: string }} settings
   */
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  /**
   * Load settings — returns tokenSet (boolean), chatId, lang. Never returns token.
   */
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  /**
   * Test bot connection — uses internal token.
   */
  testConnection: () => ipcRenderer.invoke('tg-test'),

  /**
   * Open native file dialog.
   * @param {Array} filters
   * @returns {Promise<string|null>} Selected file path or null.
   */
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),
});
