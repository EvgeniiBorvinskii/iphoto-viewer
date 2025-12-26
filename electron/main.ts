import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import { IPhoneService } from './services/IPhoneService';
import { PhotoService } from './services/PhotoService';

let mainWindow: BrowserWindow | null = null;
let iPhoneService: IPhoneService;
let photoService: PhotoService;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.85),
    height: Math.floor(height * 0.85),
    minWidth: 1024,
    minHeight: 768,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../react/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  iPhoneService = new IPhoneService();
  photoService = new PhotoService();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  setupIPCHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIPCHandlers() {
  // Window controls
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  // iPhone connection
  ipcMain.handle('connect-iphone-usb', async () => {
    try {
      return await iPhoneService.connectUSB();
    } catch (error) {
      console.error('USB connection error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('connect-iphone-wifi', async (_, ipAddress: string) => {
    try {
      return await iPhoneService.connectWiFi(ipAddress);
    } catch (error) {
      console.error('WiFi connection error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('discover-iphones', async () => {
    try {
      return await iPhoneService.discoverDevices();
    } catch (error) {
      console.error('Discovery error:', error);
      return [];
    }
  });

  // Photo operations
  ipcMain.handle('get-photos', async (_, offset: number, limit: number) => {
    try {
      return await photoService.getPhotos(offset, limit);
    } catch (error) {
      console.error('Get photos error:', error);
      return { photos: [], total: 0 };
    }
  });

  ipcMain.handle('get-photo-thumbnail', async (_, photoId: string) => {
    try {
      return await photoService.getThumbnail(photoId);
    } catch (error) {
      console.error('Get thumbnail error:', error);
      return null;
    }
  });

  ipcMain.handle('get-photo-full', async (_, photoId: string) => {
    try {
      return await photoService.getFullResolution(photoId);
    } catch (error) {
      console.error('Get full photo error:', error);
      return null;
    }
  });

  ipcMain.handle('transfer-photos', async (_, photoIds: string[], destination: string) => {
    try {
      return await photoService.transferPhotos(photoIds, destination);
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: String(error) };
    }
  });
}
