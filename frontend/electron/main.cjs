const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog, shell } = require('electron');
const path = require('path');

// 禁用 GPU 加速（解决某些 Windows 问题）
app.disableHardwareAcceleration();

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 创建主窗口
function createWindow() {
  log('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false, // 无边框窗口，使用自定义标题栏
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false, // 等待准备好再显示
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 准备好后显示窗口
  mainWindow.once('ready-to-show', () => {
    log('Window ready to show');
    mainWindow.show();
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 最小化到托盘
  mainWindow.on('minimize', (event) => {
    // 可以选择最小化到托盘
    // event.preventDefault();
    // mainWindow.hide();
  });

  // 拦截新窗口打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  log('Main window created');
}

// 创建系统托盘
function createTray() {
  // 创建一个简单的图标
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AI+作家助手');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建作品',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-book');
          }
        },
        {
          label: '新建章节',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-chapter');
          }
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 AI+作家助手',
              message: 'AI+作家助手 v1.0.0',
              detail: '一款专为作家打造的写作助手应用'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 处理器 - 窗口控制
ipcMain.handle('window-minimize', () => {
  log('Window minimize');
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  log('Window maximize/restore');
  if (mainWindow?.isMaximized()) {
    mainWindow.restore();
    return false;
  } else {
    mainWindow?.maximize();
    return true;
  }
});

ipcMain.handle('window-close', () => {
  log('Window close');
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() || false;
});

// IPC 处理器 - 文件对话框
ipcMain.handle('dialog-open-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog-save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// IPC 处理器 - 系统信息
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 应用就绪
app.whenReady().then(() => {
  log('App ready');
  createWindow();
  createTray();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 窗口全部关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 异常处理
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection: ${reason}`);
  console.error(reason);
});

log('Electron main process started');
