// Global type definitions for Electron API

export interface Photo {
  id: string;
  filename: string;
  dateCreated: Date;
  dateModified: Date;
  size: number;
  width: number;
  height: number;
  thumbnail?: string;
}

export interface PhotosResponse {
  photos: Photo[];
  total: number;
}

export interface IPhoneDevice {
  id: string;
  name: string;
  type: 'usb' | 'wifi';
  ipAddress?: string;
  connected: boolean;
}

export interface ConnectionResult {
  success: boolean;
  device?: IPhoneDevice;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  transferred: number;
  error?: string;
}

declare global {
  interface Window {
    electron: {
      // Window controls
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;

      // iPhone connection
      connectUSB: () => Promise<ConnectionResult>;
      connectWiFi: (ipAddress: string) => Promise<ConnectionResult>;
      discoverIPhones: () => Promise<IPhoneDevice[]>;

      // Photo operations
      getPhotos: (offset: number, limit: number) => Promise<PhotosResponse>;
      getPhotoThumbnail: (photoId: string) => Promise<string | null>;
      getPhotoFull: (photoId: string) => Promise<string | null>;
      transferPhotos: (photoIds: string[], destination: string) => Promise<TransferResult>;
    };
  }
}

export {};
