# Windows Portable Device Photo Access Script
# This script accesses iPhone photos via Windows Portable Devices API

param(
    [string]$Action = "list",
    [string]$DeviceId = "",
    [string]$PhotoId = "",
    [string]$OutputPath = ""
)

function Get-PortableDevices {
    $shell = New-Object -ComObject Shell.Application
    $devices = @()
    
    # Check Computer namespace (0x11 = MyComputer)
    $computer = $shell.Namespace(0x11)
    
    foreach ($item in $computer.Items()) {
        # iPhone appears as a portable device
        if ($item.Name -like "*iPhone*" -or $item.Name -like "*Apple*") {
            $devices += @{
                Name = $item.Name
                Path = $item.Path
                Type = $item.Type
            }
        }
    }
    
    return $devices
}

function Get-PhotosFromDevice {
    param([string]$DevicePath)
    
    $shell = New-Object -ComObject Shell.Application
    $device = $shell.Namespace($DevicePath)
    
    if (-not $device) {
        Write-Error "Cannot access device at $DevicePath"
        return @()
    }
    
    $photos = @()
    
    # Navigate through device folders
    foreach ($storage in $device.Items()) {
        if ($storage.Name -like "*Internal Storage*" -or $storage.IsFolder) {
            $storageFolder = $shell.Namespace($storage.Path)
            if ($storageFolder) {
                # Look for DCIM folder
                foreach ($folder in $storageFolder.Items()) {
                    if ($folder.Name -eq "DCIM" -and $folder.IsFolder) {
                        $photos += Get-PhotosRecursive -Folder $shell.Namespace($folder.Path) -Shell $shell
                    }
                }
            }
        }
    }
    
    return $photos
}

function Get-PhotosRecursive {
    param(
        [object]$Folder,
        [object]$Shell,
        [int]$Depth = 0
    )
    
    if ($Depth -gt 10) { return @() }
    
    $photos = @()
    
    foreach ($item in $Folder.Items()) {
        if ($item.IsFolder) {
            $subFolder = $Shell.Namespace($item.Path)
            if ($subFolder) {
                $photos += Get-PhotosRecursive -Folder $subFolder -Shell $Shell -Depth ($Depth + 1)
            }
        } else {
            # Check if it's an image file
            $ext = [System.IO.Path]::GetExtension($item.Name).ToLower()
            if ($ext -match '\.(jpg|jpeg|png|heic|heif|gif|bmp)$') {
                $size = $Folder.GetDetailsOf($item, 1)
                $dateModified = $Folder.GetDetailsOf($item, 3)
                
                $photos += @{
                    Name = $item.Name
                    Path = $item.Path
                    Size = $size
                    DateModified = $dateModified
                    Extension = $ext
                }
            }
        }
    }
    
    return $photos
}

function Copy-PhotoFromDevice {
    param(
        [string]$PhotoPath,
        [string]$DestinationPath
    )
    
    try {
        $shell = New-Object -ComObject Shell.Application
        
        # Parse folder and filename
        $folderPath = Split-Path $PhotoPath -Parent
        $fileName = Split-Path $PhotoPath -Leaf
        
        $sourceFolder = $shell.Namespace($folderPath)
        if (-not $sourceFolder) {
            Write-Error "Cannot access folder: $folderPath"
            return $false
        }
        
        $sourceFile = $sourceFolder.ParseName($fileName)
        if (-not $sourceFile) {
            Write-Error "Cannot find file: $fileName"
            return $false
        }
        
        # Create destination directory if needed
        $destDir = Split-Path $DestinationPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Copy file using Shell COM
        $destFolder = $shell.Namespace($destDir)
        $destFolder.CopyHere($sourceFile, 0x14) # 0x14 = No progress dialog + Yes to all
        
        # Rename if needed
        $copiedFile = Join-Path $destDir $fileName
        if ($copiedFile -ne $DestinationPath) {
            Move-Item $copiedFile $DestinationPath -Force
        }
        
        return $true
    } catch {
        Write-Error "Failed to copy photo: $_"
        return $false
    }
}

# Main execution
switch ($Action) {
    "list-devices" {
        $devices = Get-PortableDevices
        $devices | ConvertTo-Json -Depth 10
    }
    
    "list-photos" {
        if ([string]::IsNullOrEmpty($DeviceId)) {
            Write-Error "DeviceId is required"
            exit 1
        }
        
        $photos = Get-PhotosFromDevice -DevicePath $DeviceId
        Write-Host "PHOTO_COUNT:$($photos.Count)"
        
        foreach ($photo in $photos) {
            $json = $photo | ConvertTo-Json -Compress
            Write-Host "PHOTO:$json"
        }
    }
    
    "copy-photo" {
        if ([string]::IsNullOrEmpty($PhotoId) -or [string]::IsNullOrEmpty($OutputPath)) {
            Write-Error "PhotoId and OutputPath are required"
            exit 1
        }
        
        $success = Copy-PhotoFromDevice -PhotoPath $PhotoId -DestinationPath $OutputPath
        if ($success) {
            Write-Host "SUCCESS:$OutputPath"
        } else {
            Write-Error "FAILED"
            exit 1
        }
    }
    
    default {
        Write-Error "Unknown action: $Action"
        exit 1
    }
}
