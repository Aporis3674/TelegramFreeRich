const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tgAPI', {
  send: (token, method, body) => ipcRenderer.invoke('tg-api', { token, method, body }),
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),
});
