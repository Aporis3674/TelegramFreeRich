const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  // Telegram API — token is handled securely in main process
  api: (method, body) => ipcRenderer.invoke('tg-api', { method, body }),

  // Settings — encrypted via safeStorage, token NEVER leaves main
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // Test connection — uses internal token
  testConnection: () => ipcRenderer.invoke('tg-test'),

  // File dialog
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),
});
