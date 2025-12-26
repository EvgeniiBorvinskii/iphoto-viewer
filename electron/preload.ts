import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // iPhone connection
  connectUSB: () => ipcRenderer.invoke('connect-iphone-usb'),
  connectWiFi: (ipAddress: string) => ipcRenderer.invoke('connect-iphone-wifi', ipAddress),
  discoverIPhones: () => ipcRenderer.invoke('discover-iphones'),

  // Photo operations
  getPhotos: (offset: number, limit: number) => ipcRenderer.invoke('get-photos', offset, limit),
  getPhotoThumbnail: (photoId: string) => ipcRenderer.invoke('get-photo-thumbnail', photoId),
  getPhotoFull: (photoId: string) => ipcRenderer.invoke('get-photo-full', photoId),
  transferPhotos: (photoIds: string[], destination: string) => 
    ipcRenderer.invoke('transfer-photos', photoIds, destination),
});

export type ElectronAPI = typeof electron;

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
