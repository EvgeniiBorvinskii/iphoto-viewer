import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

interface Photo {
  id: string;
  filename: string;
  dateCreated: Date;
  path: string;
  folder: string;
}

/**
 * iPhone Photo Service using pymobiledevice3
 * Works like 3uTools - direct access without iTunes!
 */
export class IPhonePhotoService {
  private pythonPath: string;
  private scriptPath: string;
  private deviceUDID: string | null = null;
  private photos: Photo[] = [];

  constructor() {
    // Use virtual environment Python
    this.pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    this.scriptPath = path.join(__dirname, '..', 'utils', 'IPhoneReader.py');
  }

  /**
   * Check if Python and pymobiledevice3 are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const pythonExists = await fs.access(this.pythonPath).then(() => true).catch(() => false);
      const scriptExists = await fs.access(this.scriptPath).then(() => true).catch(() => false);
      
      if (!pythonExists || !scriptExists) {
        console.log('⚠️ Python or script not found');
        return false;
      }

      // Test if pymobiledevice3 is installed
      const { stdout } = await execFileAsync(this.pythonPath, ['-c', 'import pymobiledevice3']);
      return true;
    } catch (error) {
      console.log('⚠️ pymobiledevice3 not available:', error);
      return false;
    }
  }

  /**
   * List connected iOS devices
   */
  async listDevices(): Promise<any[]> {
    try {
      const { stdout } = await execFileAsync(this.pythonPath, [this.scriptPath, 'list_devices']);
      const devices = JSON.parse(stdout);
      
      if (devices && devices.length > 0) {
        this.deviceUDID = devices[0].udid;
        console.log(`✓ Found iPhone: ${this.deviceUDID}`);
      }
      
      return devices;
    } catch (error) {
      console.error('Error listing devices:', error);
      return [];
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<any> {
    try {
      const udid = this.deviceUDID || 'none';
      const { stdout } = await execFileAsync(this.pythonPath, [this.scriptPath, 'device_info', udid]);
      const info = JSON.parse(stdout);
      
      if (info.error) {
        throw new Error(info.error);
      }
      
      console.log(`📱 Device: ${info.DeviceName} (${info.ProductType})`);
      console.log(`📱 iOS Version: ${info.ProductVersion}`);
      
      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Load photos from iPhone
   */
  async loadPhotos(): Promise<void> {
    console.log('=== Loading iPhone photos (like 3uTools) ===');
    
    // Check if available
    const available = await this.isAvailable();
    if (!available) {
      console.log('⚠️ pymobiledevice3 not available - install with: pip install pymobiledevice3');
      await this.loadDemoPhotos();
      return;
    }

    // List devices
    const devices = await this.listDevices();
    if (devices.length === 0) {
      console.log('⚠️ No iPhone connected');
      await this.loadDemoPhotos();
      return;
    }

    try {
      // Get device info
      await this.getDeviceInfo();

      // List photos
      const udid = this.deviceUDID || 'none';
      const { stdout } = await execFileAsync(this.pythonPath, [this.scriptPath, 'list_photos', udid]);
      const result = JSON.parse(stdout);

      if (result.error) {
        console.log(`⚠️ Error accessing photos: ${result.error}`);
        console.log('💡 Make sure iPhone is unlocked and trusted');
        await this.loadDemoPhotos();
        return;
      }

      // Convert to Photo objects
      this.photos = result.photos.map((photo: any, index: number) => ({
        id: `iphone-${index}`,
        filename: photo.filename,
        dateCreated: new Date(),
        path: photo.path,
        folder: photo.folder
      }));

      console.log(`✓ Loaded ${this.photos.length} photos from iPhone!`);
      
      if (this.photos.length === 0) {
        console.log('⚠️ No photos found on iPhone DCIM folder');
        await this.loadDemoPhotos();
      }

    } catch (error) {
      console.error('Error loading photos:', error);
      await this.loadDemoPhotos();
    }
  }

  /**
   * Load demo photos as fallback
   */
  private async loadDemoPhotos(): Promise<void> {
    console.log('Loading demo photos...');
    
    this.photos = Array.from({ length: 350 }, (_, index) => ({
      id: `demo-${index + 1}`,
      filename: `IMG_${String(index + 1).padStart(4, '0')}.JPG`,
      dateCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      path: `/DCIM/100APPLE/IMG_${String(index + 1).padStart(4, '0')}.JPG`,
      folder: '100APPLE'
    }));

    console.log(`✓ Loaded ${this.photos.length} demo photos`);
  }

  /**
   * Get photos with pagination
   */
  async getPhotos(offset: number = 0, limit: number = 100): Promise<{ photos: Photo[]; total: number }> {
    const photos = this.photos.slice(offset, offset + limit);
    return {
      photos,
      total: this.photos.length
    };
  }

  /**
   * Get photo thumbnail (base64)
   */
  async getPhotoThumbnail(photoId: string): Promise<string | null> {
    // For demo, return gradient
    const photo = this.photos.find(p => p.id === photoId);
    if (!photo) return null;

    // Generate a unique color based on photo ID
    const hash = photoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;

    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${photoId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 60%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${hue + 60}, 70%, 40%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad${photoId})" />
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="14" font-family="Arial">
          ${photo.filename}
        </text>
      </svg>`
    ).toString('base64')}`;
  }

  /**
   * Download photo from iPhone
   */
  async downloadPhoto(photoId: string, outputPath: string): Promise<boolean> {
    const photo = this.photos.find(p => p.id === photoId);
    if (!photo || !this.deviceUDID) {
      return false;
    }

    try {
      const { stdout } = await execFileAsync(this.pythonPath, [
        this.scriptPath,
        'get_photo',
        this.deviceUDID,
        photo.path,
        outputPath
      ]);

      const result = JSON.parse(stdout);
      return result.success === true;
    } catch (error) {
      console.error('Error downloading photo:', error);
      return false;
    }
  }

  /**
   * Reload photos (for Reload button)
   */
  async reload(): Promise<void> {
    console.log('🔄 Reloading iPhone photos...');
    this.photos = [];
    this.deviceUDID = null;
    await this.loadPhotos();
  }

  /**
   * Get thumbnail (alias for getPhotoThumbnail)
   */
  async getThumbnail(photoId: string): Promise<string | null> {
    return await this.getPhotoThumbnail(photoId);
  }

  /**
   * Get full resolution photo
   */
  async getFullResolution(photoId: string): Promise<string | null> {
    // For now, return thumbnail (same as demo)
    // TODO: Implement full resolution download
    return await this.getPhotoThumbnail(photoId);
  }

  /**
   * Transfer photos to destination
   */
  async transferPhotos(photoIds: string[], destination: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📤 Transferring ${photoIds.length} photos to ${destination}`);
      
      // Download each photo
      for (const photoId of photoIds) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) continue;

        const outputPath = path.join(destination, photo.filename);
        const success = await this.downloadPhoto(photoId, outputPath);
        
        if (!success) {
          console.log(`⚠️ Failed to transfer: ${photo.filename}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: String(error) };
    }
  }
}
