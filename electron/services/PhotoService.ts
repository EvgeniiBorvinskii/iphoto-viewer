import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
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
  private realPhotosCount: number = 0;
  private tempPhotoDir: string = '';
  private isLoadingPhotos: boolean = false;
  private scriptPath: string = '';

  constructor() {
    // Create temp directory for iPhone photos
    this.tempPhotoDir = path.join(os.tmpdir(), 'iphoto-viewer-cache');
    
    // Get path to PowerShell script
    this.scriptPath = path.join(__dirname, '..', 'utils', 'IPhonePhotosReader.ps1');
  }

  /**
   * Get photos from connected iPhone
   */
  async getPhotos(offset: number = 0, limit: number = 50): Promise<PhotosResponse> {
    try {
      console.log(`Getting photos: offset=${offset}, limit=${limit}`);
      
      // Try to load photos from iPhone using PowerShell script (only once)
      if (!this.isLoadingPhotos && this.realPhotosCount === 0) {
        await this.loadPhotosFromIPhone();
      }
      
      // Read photos from temp directory
      return await this.getPhotosFromTempDir(offset, limit);
    } catch (error) {
      console.error('Error fetching photos:', error);
      return { photos: [], total: 0 };
    }
  }

  /**
   * Load photos from iPhone using PowerShell script
   */
  private async loadPhotosFromIPhone(): Promise<void> {
    if (this.isLoadingPhotos) {
      console.log('Already loading photos...');
      return;
    }

    this.isLoadingPhotos = true;

    try {
      console.log('═══════════════════════════════════════════════');
      console.log('  Loading photos from iPhone...');
      console.log('═══════════════════════════════════════════════');
      
      // Create temp directory
      try {
        await fs.mkdir(this.tempPhotoDir, { recursive: true });
        console.log('✓ Temp directory created:', this.tempPhotoDir);
      } catch (error) {
        // Directory might already exist
      }
      
      console.log('✓ Script path:', this.scriptPath);
      
      // Run PowerShell script to copy photos from iPhone
      const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -TempDir "${this.tempPhotoDir}" -MaxPhotos 500`;
      
      console.log('✓ Executing PowerShell script...');
      console.log('  This may take a few minutes...');
      
      const { stdout, stderr } = await execAsync(psCommand, {
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('\nPowerShell Output:');
      console.log('─────────────────────────────────────────────');
      console.log(stdout);
      console.log('─────────────────────────────────────────────');
      
      if (stderr) {
        console.log('PowerShell Errors:', stderr);
      }
      
      // Parse output
      if (stdout.includes('PHOTO_COPIED:')) {
        const photoLines = stdout.split('\n').filter(line => line.includes('PHOTO_COPIED:'));
        this.realPhotosCount = photoLines.length;
        console.log(`\n✓ Successfully loaded ${this.realPhotosCount} photos from iPhone!`);
      } else if (stdout.includes('ERROR:')) {
        const errorMsg = stdout.match(/ERROR:(.+)/)?.[1] || 'Unknown error';
        console.error('\n✗ Failed to load photos:', errorMsg);
        console.log('\nTroubleshooting:');
        console.log('1. Убедитесь, что iPhone подключен и разблокирован');
        console.log('2. Откройте "Этот компьютер" в Windows Explorer');
        console.log('3. Проверьте, виден ли iPhone там');
        console.log('4. Попробуйте открыть iPhone в Explorer вручную');
      } else {
        console.log('\n⚠ No photos were copied');
        console.log('iPhone might not be accessible via Windows Explorer');
      }
      
      console.log('═══════════════════════════════════════════════\n');
      
    } catch (error) {
      console.error('\n✗ Error loading photos from iPhone:', error);
      console.log('\nВозможные причины:');
      console.log('• iPhone не подключен');
      console.log('• iPhone заблокирован');
      console.log('• Не выбрано "Доверять этому компьютеру"');
      console.log('• Windows не имеет доступа к iPhone');
    } finally {
      this.isLoadingPhotos = false;
    }
  }

  /**
   * Get photos from temporary directory
   */
  private async getPhotosFromTempDir(offset: number, limit: number): Promise<PhotosResponse> {
    try {
      const photos: Photo[] = [];
      
      // Check if temp directory exists
      try {
        await fs.access(this.tempPhotoDir);
      } catch {
        console.log('Temp directory not accessible, using mock data');
        return await this.getMockPhotos(offset, limit);
      }
      
      // Read all files from temp directory
      const files = await fs.readdir(this.tempPhotoDir);
      const imageFiles = files.filter(f => 
        /\.(jpg|jpeg|png|heic|heif)$/i.test(f)
      );
      
      this.realPhotosCount = imageFiles.length;
      
      if (this.realPhotosCount === 0) {
        console.log('No photos in temp directory yet, using mock data');
        return await this.getMockPhotos(offset, limit);
      }
      
      console.log(`Found ${this.realPhotosCount} real photos in temp directory`);
      
      // Get requested slice
      const slice = imageFiles.slice(offset, offset + limit);
      
      for (const filename of slice) {
        const filePath = path.join(this.tempPhotoDir, filename);
        try {
          const stats = await fs.stat(filePath);
          
          photos.push({
            id: Buffer.from(filePath).toString('base64'),
            filename: filename,
            dateCreated: stats.birthtime,
            dateModified: stats.mtime,
            size: stats.size,
            width: 4032,
            height: 3024,
          });
        } catch (error) {
          console.error('Error reading file stats:', error);
        }
      }
      
      return {
        photos,
        total: this.realPhotosCount,
      };
    } catch (error) {
      console.error('Error reading photos from temp dir:', error);
      return await this.getMockPhotos(offset, limit);
    }
  }

  /**
   * Get mock photos for testing
   */
  private async getMockPhotos(offset: number, limit: number): Promise<PhotosResponse> {
    console.log('Using mock photos for demo');
    
    const totalMockPhotos = 250;
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
      // Check if it's a mock photo
      if (photoId.startsWith('mock-')) {
        return this.generateMockThumbnail(photoId);
      }
      
      // Decode file path from base64
      const filePath = Buffer.from(photoId, 'base64').toString('utf-8');
      
      try {
        // Read file from temp directory
        const fileData = await fs.readFile(filePath);
        
        // Convert to base64 data URL
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 
                       ext === '.heic' || ext === '.heif' ? 'image/heic' : 
                       'image/jpeg';
        
        return `data:${mimeType};base64,${fileData.toString('base64')}`;
      } catch (error) {
        console.error('Error reading photo file:', filePath, error);
        return this.generateMockThumbnail(photoId);
      }
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
      // For now, same as thumbnail
      return await this.getThumbnail(photoId);
    } catch (error) {
      console.error('Error getting full resolution:', error);
      return null;
    }
  }

  async transferPhotos(photoIds: string[], destination: string): Promise<{ success: boolean; transferred: number; error?: string }> {
    try {
      let transferred = 0;
      
      for (const photoId of photoIds) {
        if (photoId.startsWith('mock-')) {
          continue; // Skip mock photos
        }
        
        try {
          const filePath = Buffer.from(photoId, 'base64').toString('utf-8');
          const filename = path.basename(filePath);
          const destPath = path.join(destination, filename);
          
          // Copy file from temp to destination
          await fs.copyFile(filePath, destPath);
          transferred++;
        } catch (error) {
          console.error('Error transferring photo:', error);
        }
      }
      
      return {
        success: true,
        transferred,
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
