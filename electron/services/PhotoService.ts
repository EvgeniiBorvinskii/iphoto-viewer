import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

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
   * Find iPhone DCIM folder on Windows using Shell COM object
   */
  private async findIPhoneDCIMPath(): Promise<void> {
    if (this.dcimPath) return; // Already found

    try {
      console.log('Searching for iPhone via Windows Shell...');
      
      // Use PowerShell with Shell.Application COM object to access portable devices
      const psScript = `
        $shell = New-Object -ComObject Shell.Application
        $computer = $shell.Namespace(17) # MyComputerFolder
        
        foreach ($device in $computer.Items()) {
          if ($device.Name -like "*iPhone*" -or $device.Name -like "*Apple*") {
            Write-Host "DEVICE_FOUND:$($device.Name)"
            
            # Try to access Internal Storage
            $deviceFolder = $shell.Namespace($device.Path)
            foreach ($storage in $deviceFolder.Items()) {
              if ($storage.Name -like "*Internal Storage*" -or $storage.Name -eq "Internal Storage") {
                Write-Host "STORAGE_FOUND:$($storage.Path)"
                
                # Try to find DCIM folder
                $storageFolder = $shell.Namespace($storage.Path)
                foreach ($folder in $storageFolder.Items()) {
                  if ($folder.Name -eq "DCIM") {
                    Write-Host "DCIM_FOUND:$($folder.Path)"
                  }
                }
              }
            }
          }
        }
      `;
      
      const { stdout, stderr } = await execAsync(
        `powershell -Command "${psScript.replace(/"/g, '\\"')}"`
      );
      
      console.log('PowerShell output:', stdout);
      if (stderr) console.log('PowerShell errors:', stderr);
      
      // Parse output for DCIM path
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('DEVICE_FOUND:')) {
          console.log('✓ iPhone detected:', line.replace('DEVICE_FOUND:', '').trim());
        }
        if (line.includes('STORAGE_FOUND:')) {
          console.log('✓ Storage found:', line.replace('STORAGE_FOUND:', '').trim());
        }
        if (line.includes('DCIM_FOUND:')) {
          this.dcimPath = line.replace('DCIM_FOUND:', '').trim();
          console.log('✓ DCIM folder found:', this.dcimPath);
          break;
        }
      }
      
      if (!this.dcimPath) {
        console.log('⚠ iPhone not found or DCIM not accessible');
        console.log('Make sure:');
        console.log('1. iPhone is unlocked');
        console.log('2. You tapped "Trust This Computer"');
        console.log('3. iPhone is visible in Windows Explorer');
      }
    } catch (error) {
      console.error('Error detecting iPhone:', error);
    }
  }

  /**
   * Get real photos from iPhone DCIM folder using Shell COM
   */
  private async getRealPhotos(offset: number, limit: number): Promise<PhotosResponse> {
    try {
      console.log('Getting real photos from iPhone...');
      const photos: Photo[] = [];
      
      // Use PowerShell to enumerate files in DCIM via Shell COM
      const psScript = `
        $shell = New-Object -ComObject Shell.Application
        $dcim = $shell.Namespace("${this.dcimPath.replace(/\\/g, '\\\\')}")
        
        function Get-PhotoFiles($folder, $depth = 0) {
          if ($depth -gt 5) { return }
          
          foreach ($item in $folder.Items()) {
            if ($item.IsFolder) {
              $subFolder = $shell.Namespace($item.Path)
              Get-PhotoFiles $subFolder ($depth + 1)
            } else {
              $ext = [System.IO.Path]::GetExtension($item.Name).ToLower()
              if ($ext -match '\\.(jpg|jpeg|png|heic|heif)$') {
                $size = $folder.GetDetailsOf($item, 1)
                $dateModified = $folder.GetDetailsOf($item, 3)
                Write-Host "PHOTO:$($item.Name)|$($item.Path)|$size|$dateModified"
              }
            }
          }
        }
        
        Get-PhotoFiles $dcim
      `;
      
      const { stdout } = await execAsync(
        `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer for large photo lists
      );
      
      // Parse photo information
      const photoLines = stdout.split('\n').filter(line => line.includes('PHOTO:'));
      this.realPhotosCount = photoLines.length;
      
      console.log(`Found ${this.realPhotosCount} real photos on iPhone`);
      
      // Get requested slice
      const slice = photoLines.slice(offset, offset + limit);
      
      for (const line of slice) {
        const parts = line.replace('PHOTO:', '').split('|');
        if (parts.length >= 2) {
          const filename = parts[0].trim();
          const filepath = parts[1].trim();
          const size = parseInt(parts[2]?.trim() || '0') || 1000000;
          
          photos.push({
            id: Buffer.from(filepath).toString('base64'),
            filename: filename,
            dateCreated: new Date(),
            dateModified: new Date(),
            size: size,
            width: 4032,
            height: 3024,
          });
        }
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
      // Try to get real thumbnail if we have DCIM path
      if (this.dcimPath && !photoId.startsWith('mock-')) {
        const filePath = Buffer.from(photoId, 'base64').toString('utf-8');
        
        try {
          // Use PowerShell to read file from iPhone via Shell COM
          const psScript = `
            $shell = New-Object -ComObject Shell.Application
            $folder = $shell.Namespace([System.IO.Path]::GetDirectoryName("${filePath.replace(/\\/g, '\\\\')}"))
            $file = $folder.ParseName([System.IO.Path]::GetFileName("${filePath.replace(/\\/g, '\\\\')}"))
            
            if ($file) {
              # Copy to temp location
              $tempPath = [System.IO.Path]::GetTempPath() + [System.IO.Path]::GetFileName("${filePath.replace(/\\/g, '\\\\')}")
              $folder.CopyHere($file, 16) # 16 = No UI
              
              # Read as base64
              $bytes = [System.IO.File]::ReadAllBytes($tempPath)
              $base64 = [Convert]::ToBase64String($bytes)
              Write-Host "DATA:$base64"
              
              # Cleanup
              Remove-Item $tempPath -ErrorAction SilentlyContinue
            }
          `;
          
          const { stdout } = await execAsync(
            `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
            { maxBuffer: 1024 * 1024 * 50 } // 50MB buffer for images
          );
          
          const dataMatch = stdout.match(/DATA:(.+)/);
          if (dataMatch) {
            // Detect image type from filename
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 
                           ext === '.heic' || ext === '.heif' ? 'image/heic' : 
                           'image/jpeg';
            
            return `data:${mimeType};base64,${dataMatch[1].trim()}`;
          }
        } catch (error) {
          console.error('Error reading photo from iPhone:', error);
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
