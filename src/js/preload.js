const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcApp', {
    transferredData: (data) => ipcRenderer.invoke('transferredData', data)
});