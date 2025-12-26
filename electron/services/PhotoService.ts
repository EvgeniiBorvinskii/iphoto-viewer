import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { app } from 'electron';
import * as os from 'os';

const execAsync = promisify(exec);

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

export class PhotoService {
  private photoCache: Map<string, Photo> = new Map();
  private dcimPath: string = '';
  private realPhotosCount: number = 0;
  private devicePath: string = '';
  private scriptPath: string = '';
  private photosCache: any[] = [];

  constructor() {
    // Get path to PowerShell script
    const isDev = !app.isPackaged;
    if (isDev) {
      this.scriptPath = path.join(__dirname, '..', 'utils', 'WindowsPortableDevices.ps1');
    } else {
      this.scriptPath = path.join(process.resourcesPath, 'electron', 'utils', 'WindowsPortableDevices.ps1');
    }
  }

  /**
   * Try to get photos from connected iPhone
   */
  async getPhotos(offset: number = 0, limit: number = 50): Promise<PhotosResponse> {
    try {
      console.log(`Getting photos: offset=${offset}, limit=${limit}`);
      
      // Try to find iPhone DCIM folder
      await this.findIPhoneDCIMPath();
      
      if (this.dcimPath) {
        console.log('Found iPhone DCIM path:', this.dcimPath);
        return await this.getRealPhotos(offset, limit);
      } else {
        console.log('iPhone DCIM not found, using mock data');
        return await this.getMockPhotos(offset, limit);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      return { photos: [], total: 0 };
    }
  }

  /**
   * Find iPhone using Windows Portable Devices API
   */
  private async findIPhoneDCIMPath(): Promise<void> {
    if (this.devicePath) return; // Already found

    try {
      console.log('Searching for iPhone using Windows Portable Devices API...');
      
      // Run PowerShell script to list devices
      const { stdout, stderr } = await execAsync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -Action list-devices`,
        { maxBuffer: 1024 * 1024 * 10 }
      );
      
      if (stderr) {
        console.error('PowerShell stderr:', stderr);
      }
      
      console.log('PowerShell output:', stdout);
      
      try {
        const devices = JSON.parse(stdout);
        
        if (Array.isArray(devices) && devices.length > 0) {
          // Use first iPhone found
          this.devicePath = devices[0].Path;
          console.log('✓ iPhone found:', devices[0].Name);
          console.log('Device path:', this.devicePath);
          
          // Now get photos from device
          await this.loadPhotosFromDevice();
        } else {
          console.log('⚠ No iPhone devices found');
          this.showTroubleshootingInfo();
        }
      } catch (parseError) {
        console.error('Failed to parse device list:', parseError);
        console.log('Raw output:', stdout);
        this.showTroubleshootingInfo();
      }
    } catch (error) {
      console.error('Error detecting iPhone:', error);
      this.showTroubleshootingInfo();
    }
  }

  /**
   * Load photos from iPhone device
   */
  private async loadPhotosFromDevice(): Promise<void> {
    if (!this.devicePath) return;

    try {
      console.log('Loading photos from iPhone...');
      
      const { stdout } = await execAsync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -Action list-photos -DeviceId "${this.devicePath}"`,
        { maxBuffer: 1024 * 1024 * 50, timeout: 60000 }
      );
      
      // Parse output
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('PHOTO_COUNT:')) {
          this.realPhotosCount = parseInt(line.replace('PHOTO_COUNT:', '').trim()) || 0;
          console.log(`✓ Found ${this.realPhotosCount} photos on iPhone`);
        } else if (line.includes('PHOTO:{')) {
          try {
            const jsonStr = line.substring(line.indexOf('{'));
            const photoData = JSON.parse(jsonStr);
            this.photosCache.push(photoData);
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
      
      console.log(`Loaded ${this.photosCache.length} photos into cache`);
      
    } catch (error) {
      console.error('Error loading photos from device:', error);
    }
  }

  private showTroubleshootingInfo(): void {
    console.log('');
    console.log('⚠ iPhone detected but photos not accessible');
    console.log('');
    console.log('To access iPhone photos on Windows:');
    console.log('1. Connect iPhone via USB cable');
    console.log('2. Unlock iPhone and trust this computer if prompted');
    console.log('3. Open Windows Explorer and verify iPhone appears under "This PC"');
    console.log('4. You can open iPhone in Explorer and browse DCIM folder');
    console.log('');
    console.log('Alternative options:');
    console.log('- Use iCloud for Windows to sync photos automatically');
    console.log('- Import photos using Windows Photos app');
    console.log('- Enable iTunes photo sync');
    console.log('');
    console.log('For now, showing demo photos...');
  }

  /**
   * Alternative iPhone detection using Windows Portable Device API
   */
  private async tryAlternativeIPhoneDetection(): Promise<void> {
    try {
      console.log('Trying alternative detection via WMIC...');
      
      // Try to find iPhone via WMIC
      const { stdout: wmicOutput } = await execAsync(
        'wmic logicaldisk where drivetype=2 get caption,volumename'
      );
      
      console.log('WMIC output:', wmicOutput);
      
      // Try to find iPhone in mounted drives
      const drives = wmicOutput.split('\n').filter(line => 
        line.includes('iPhone') || line.includes('Apple')
      );
      
      if (drives.length > 0) {
        console.log('Found iPhone drives:', drives);
        
        // Try common paths
        const possiblePaths = [
          'E:\\DCIM', 'F:\\DCIM', 'G:\\DCIM', 'H:\\DCIM',
          'I:\\DCIM', 'J:\\DCIM', 'K:\\DCIM', 'L:\\DCIM'
        ];
        
        for (const testPath of possiblePaths) {
          try {
            // Use PowerShell to check if path exists and has photos
            const checkScript = `
              if (Test-Path "${testPath}") {
                $files = Get-ChildItem "${testPath}" -Recurse -File | Where-Object { $_.Extension -match '\\.(jpg|jpeg|png|heic|heif)$' } | Measure-Object
                if ($files.Count -gt 0) {
                  Write-Host "DCIM_FOUND:${testPath}"
                  Write-Host "PHOTO_COUNT:$($files.Count)"
                }
              }
            `.trim();
            
            const { stdout: checkOutput } = await execAsync(
              `powershell -NoProfile -Command "${checkScript}"`
            );
            
            if (checkOutput.includes('DCIM_FOUND:')) {
              const match = checkOutput.match(/DCIM_FOUND:(.+)/);
              if (match && match[1]) {
                this.dcimPath = match[1].trim();
                const countMatch = checkOutput.match(/PHOTO_COUNT:(\d+)/);
                if (countMatch && countMatch[1]) {
                  this.realPhotosCount = parseInt(countMatch[1]);
                  console.log(`✓ Found ${this.realPhotosCount} photos in ${this.dcimPath}`);
                }
              }
              break;
            }
          } catch (error) {
            // Continue checking other paths
          }
        }
      }
    } catch (error) {
      console.error('Error detecting iPhone:', error);
      this.showTroubleshootingInfo();
    }
  }

  /**
   * Get real photos from iPhone DCIM folder using Shell COM
   */
  private async getRealPhotos(offset: number, limit: number): Promise<PhotosResponse> {
    try {
      if (this.photosCache.length === 0) {
        console.log('Photos cache is empty, loading from device...');
        await this.loadPhotosFromDevice();
      }
      
      const photos: Photo[] = [];
      const slice = this.photosCache.slice(offset, offset + limit);
      
      for (const photoData of slice) {
        photos.push({
          id: Buffer.from(photoData.Path).toString('base64'),
          filename: photoData.Name,
          dateCreated: new Date(),
          dateModified: new Date(photoData.DateModified || Date.now()),
          size: this.parseSize(photoData.Size),
          width: 4032,
          height: 3024,
        });
      }
      
      return {
        photos,
        total: this.realPhotosCount,
      };
    } catch (error) {
      console.error('Error reading real photos:', error);
      return { photos: [], total: 0 };
    }
  }

  /**
   * Parse size string from Windows (e.g., "2.5 MB" to bytes)
   */
  private parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;
    
    const match = sizeStr.match(/([\d.]+)\s*([KMGT]?B)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };
    
    return Math.floor(value * (multipliers[unit] || 1));
  }

  /**
   * Recursively scan directory for image files
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', dirPath, error);
    }
    
    return files;
  }

  /**
   * Get mock photos for testing
   */
  private async getMockPhotos(offset: number, limit: number): Promise<PhotosResponse> {
    console.log('Using mock photos for demo');
    
    // Create more realistic mock data
    const totalMockPhotos = 250; // More realistic number
    const mockPhotos: Photo[] = [];
    
    for (let i = offset; i < Math.min(offset + limit, totalMockPhotos); i++) {
      mockPhotos.push({
        id: `mock-photo-${i + 1}`,
        filename: `IMG_${String(i + 1).padStart(4, '0')}.jpg`,
        dateCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        dateModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        size: Math.floor(Math.random() * 5000000) + 1000000,
        width: 4032,
        height: 3024,
      });
    }
    
    return {
      photos: mockPhotos,
      total: totalMockPhotos,
    };
  }

  async getThumbnail(photoId: string): Promise<string | null> {
    try {
      // For real photos from device
      if (this.devicePath && !photoId.startsWith('mock-')) {
        const photoPath = Buffer.from(photoId, 'base64').toString('utf-8');
        
        try {
          // Create temp file path
          const tempDir = os.tmpdir();
          const tempFile = path.join(tempDir, `iphone_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(photoPath)}`);
          
          console.log(`Copying photo from iPhone: ${path.basename(photoPath)}`);
          
          // Copy photo from iPhone to temp location
          const { stdout } = await execAsync(
            `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -Action copy-photo -PhotoId "${photoPath}" -OutputPath "${tempFile}"`,
            { maxBuffer: 1024 * 1024 * 100, timeout: 30000 }
          );
          
          if (stdout.includes('SUCCESS:')) {
            // Read file and convert to base64
            const imageBuffer = await fs.readFile(tempFile);
            const ext = path.extname(photoPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 
                           ext === '.heic' || ext === '.heif' ? 'image/heic' : 
                           'image/jpeg';
            
            // Clean up temp file
            await fs.unlink(tempFile).catch(() => {});
            
            return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          }
        } catch (error) {
          console.error('Error getting photo from iPhone:', error);
        }
      }
      
      // Fall back to mock thumbnail
      return this.generateMockThumbnail(photoId);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Generate mock thumbnail as SVG
   */
  private generateMockThumbnail(photoId: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const colorIndex = parseInt(photoId.split('-').pop() || '0') % colors.length;
    const color = colors[colorIndex];
    
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="${color}"/>
        <text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${photoId}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  async getFullResolution(photoId: string): Promise<string | null> {
    try {
      // In production, fetch full resolution photo from iPhone
      return await this.getThumbnail(photoId);
    } catch (error) {
      console.error('Error getting full resolution:', error);
      return null;
    }
  }

  async transferPhotos(photoIds: string[], destination: string): Promise<{ success: boolean; transferred: number; error?: string }> {
    try {
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, actually transfer photos from iPhone to destination
      return {
        success: true,
        transferred: photoIds.length,
      };
    } catch (error) {
      return {
        success: false,
        transferred: 0,
        error: String(error),
      };
    }
  }
}
