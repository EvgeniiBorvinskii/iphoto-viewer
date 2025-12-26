import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execFileAsync = promisify(execFile);

/**
 * LibIMobileDevice Service - Direct iPhone communication without iTunes
 * Based on libimobiledevice library (like 3uTools uses)
 */
export class LibIMobileDevice {
  private libPath: string;
  private deviceUDID: string | null = null;

  constructor() {
    // Path to libimobiledevice binaries
    this.libPath = path.join(__dirname, '..', 'libs', 'libimobiledevice');
  }

  /**
   * Check if libimobiledevice binaries are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const ideviceinfoPath = path.join(this.libPath, 'ideviceinfo.exe');
      return fs.existsSync(ideviceinfoPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of connected iOS devices
   */
  async getDevices(): Promise<string[]> {
    try {
      const ideviceListPath = path.join(this.libPath, 'idevice_id.exe');
      
      if (!fs.existsSync(ideviceListPath)) {
        console.log('⚠️ libimobiledevice not found - using fallback method');
        return [];
      }

      const { stdout } = await execFileAsync(ideviceListPath, ['-l']);
      const devices = stdout.trim().split('\n').filter(Boolean);
      
      if (devices.length > 0) {
        this.deviceUDID = devices[0]; // Use first device
        console.log(`✓ Found iPhone with UDID: ${this.deviceUDID}`);
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
    if (!this.deviceUDID) {
      await this.getDevices();
    }

    if (!this.deviceUDID) {
      throw new Error('No iPhone connected');
    }

    try {
      const ideviceinfoPath = path.join(this.libPath, 'ideviceinfo.exe');
      const { stdout } = await execFileAsync(ideviceinfoPath, ['-u', this.deviceUDID]);
      
      const info: any = {};
      stdout.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          info[key.trim()] = valueParts.join(':').trim();
        }
      });
      
      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Mount AFC (Apple File Connection) to access media
   */
  async mountAFC(): Promise<boolean> {
    if (!this.deviceUDID) {
      await this.getDevices();
    }

    if (!this.deviceUDID) {
      return false;
    }

    try {
      const ifusePath = path.join(this.libPath, 'ifuse.exe');
      
      if (!fs.existsSync(ifusePath)) {
        console.log('⚠️ ifuse not available - trying alternative method');
        return false;
      }

      // Mount iPhone filesystem
      const mountPoint = path.join(process.env.TEMP || 'C:\\Temp', 'iphone_mount');
      
      if (!fs.existsSync(mountPoint)) {
        fs.mkdirSync(mountPoint, { recursive: true });
      }

      await execFileAsync(ifusePath, ['-u', this.deviceUDID, mountPoint]);
      console.log(`✓ Mounted iPhone at: ${mountPoint}`);
      
      return true;
    } catch (error) {
      console.error('Error mounting AFC:', error);
      return false;
    }
  }

  /**
   * Get photos from iPhone using ifuse or idevice tools
   */
  async getPhotos(): Promise<any[]> {
    if (!this.deviceUDID) {
      const devices = await this.getDevices();
      if (devices.length === 0) {
        console.log('⚠️ No iPhone connected');
        return [];
      }
    }

    try {
      // Try to access DCIM folder via libimobiledevice
      const idevicebackupPath = path.join(this.libPath, 'idevicebackup2.exe');
      
      if (fs.existsSync(idevicebackupPath)) {
        console.log('✓ Using idevicebackup2 to access photos');
        // TODO: Implement photo extraction via backup API
      }

      // For now, return empty array - we'll implement photo extraction next
      console.log('📸 Photo extraction via libimobiledevice - coming soon');
      return [];
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  /**
   * Pair with iPhone (like "Trust This Computer")
   */
  async pairDevice(): Promise<boolean> {
    if (!this.deviceUDID) {
      await this.getDevices();
    }

    if (!this.deviceUDID) {
      return false;
    }

    try {
      const idevicepairPath = path.join(this.libPath, 'idevicepair.exe');
      
      if (!fs.existsSync(idevicepairPath)) {
        console.log('⚠️ idevicepair not found');
        return false;
      }

      const { stdout } = await execFileAsync(idevicepairPath, ['-u', this.deviceUDID, 'pair']);
      console.log('Pairing result:', stdout);
      
      return stdout.includes('SUCCESS');
    } catch (error) {
      console.error('Error pairing device:', error);
      return false;
    }
  }
}
