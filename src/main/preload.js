/**
 * TelegramFreeRich — Preload Bridge
 * Exposes a minimal, secure API from main process to renderer.
 * contextIsolation: true, nodeIntegration: false.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  /** Host platform, so the renderer can hide its title bar controls on macOS. */
  platform: process.platform,

  /** Window controls for the renderer-drawn title bar. */
  win: {
    minimize: () => ipcRenderer.invoke('window-control', { action: 'minimize' }),
    toggleMaximize: () => ipcRenderer.invoke('window-control', { action: 'toggle-maximize' }),
    close: () => ipcRenderer.invoke('window-control', { action: 'close' }),
    isMaximized: () => ipcRenderer.invoke('window-control', { action: 'is-maximized' }),
  },

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
   * Check the network path: which proxy Chromium resolves for api.telegram.org
   * and whether the host is reachable through it.
   * @returns {Promise<{ ok: boolean, reachable: boolean, resolved: string, mode: string, description?: string }>}
   */
  testProxy: () => ipcRenderer.invoke('proxy-test'),

  /**
   * Open native file dialog.
   * @param {Array} filters
   * @returns {Promise<string|null>} Selected file path or null.
   */
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),
});
