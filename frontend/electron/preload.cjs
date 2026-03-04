const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // 文件对话框
  openFile: (options) => ipcRenderer.invoke('dialog-open-file', options),
  saveFile: (options) => ipcRenderer.invoke('dialog-save-file', options),

  // 系统信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 菜单事件监听
  onMenuNewBook: (callback) => {
    ipcRenderer.on('menu-new-book', callback);
    return () => ipcRenderer.removeListener('menu-new-book', callback);
  },
  onMenuNewChapter: (callback) => {
    ipcRenderer.on('menu-new-chapter', callback);
    return () => ipcRenderer.removeListener('menu-new-chapter', callback);
  },
  onMenuSave: (callback) => {
    ipcRenderer.on('menu-save', callback);
    return () => ipcRenderer.removeListener('menu-save', callback);
  },

  // 平台信息
  platform: process.platform,
});

console.log('Preload script loaded');
