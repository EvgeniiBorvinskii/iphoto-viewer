# PowerShell script to read photos from iPhone via Windows Portable Device API
param(
    [Parameter(Mandatory=$true)]
    [string]$TempDir,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxPhotos = 100
)

$ErrorActionPreference = "SilentlyContinue"

function Find-IPhoneDevice {
    $shell = New-Object -ComObject Shell.Application
    $computer = $shell.Namespace(17) # This PC
    
    foreach ($device in $computer.Items()) {
        if ($device.Name -like "*iPhone*" -or $device.Name -like "*Apple*") {
            return $device
        }
    }
    return $null
}

function Get-DCIMFolder($deviceFolder) {
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace($deviceFolder.Path)
    
    # Try to find Internal Storage
    foreach ($storage in $folder.Items()) {
        if ($storage.Name -like "*Internal Storage*" -or $storage.Name -eq "Internal Storage") {
            $storageFolder = $shell.Namespace($storage.Path)
            
            # Find DCIM folder
            foreach ($item in $storageFolder.Items()) {
                if ($item.Name -eq "DCIM") {
                    return $item
                }
            }
        }
    }
    
    # Try direct DCIM access
    foreach ($item in $folder.Items()) {
        if ($item.Name -eq "DCIM") {
            return $item
        }
    }
    
    return $null
}

function Copy-PhotosFromFolder($folder, $destination, $maxCount, [ref]$currentCount) {
    $shell = New-Object -ComObject Shell.Application
    $shellFolder = $shell.Namespace($folder.Path)
    
    foreach ($item in $shellFolder.Items()) {
        if ($currentCount.Value -ge $maxCount) {
            return
        }
        
        if ($item.IsFolder) {
            Copy-PhotosFromFolder $item $destination $maxCount $currentCount
        } else {
            $ext = [System.IO.Path]::GetExtension($item.Name).ToLower()
            if ($ext -match '\.(jpg|jpeg|png|heic|heif)$') {
                try {
                    $destFile = Join-Path $destination $item.Name
                    
                    # Check if file already exists with same name
                    $counter = 1
                    $originalName = [System.IO.Path]::GetFileNameWithoutExtension($item.Name)
                    while (Test-Path $destFile) {
                        $destFile = Join-Path $destination "$originalName`_$counter$ext"
                        $counter++
                    }
                    
                    # Copy file from iPhone to temp directory
                    $destFolder = $shell.Namespace($destination)
                    $destFolder.CopyHere($item, 0x14) # 0x14 = No progress dialog + Yes to all
                    
                    # Rename if needed
                    if ($counter -gt 1) {
                        $copiedFile = Join-Path $destination $item.Name
                        if (Test-Path $copiedFile) {
                            Rename-Item $copiedFile $destFile -Force
                        }
                    }
                    
                    Write-Host "PHOTO_COPIED:$destFile"
                    $currentCount.Value++
                    
                } catch {
                    Write-Host "ERROR_COPY:$($item.Name):$($_.Exception.Message)"
                }
            }
        }
    }
}

# Main execution
try {
    Write-Host "STATUS:Searching for iPhone..."
    
    $iphone = Find-IPhoneDevice
    if (-not $iphone) {
        Write-Host "ERROR:iPhone not found"
        exit 1
    }
    
    Write-Host "STATUS:Found iPhone: $($iphone.Name)"
    
    $dcimFolder = Get-DCIMFolder $iphone
    if (-not $dcimFolder) {
        Write-Host "ERROR:DCIM folder not accessible"
        exit 1
    }
    
    Write-Host "STATUS:Found DCIM folder"
    
    # Create temp directory if it doesn't exist
    if (-not (Test-Path $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    }
    
    Write-Host "STATUS:Copying photos to temporary directory..."
    
    $copiedCount = 0
    Copy-PhotosFromFolder $dcimFolder $TempDir $MaxPhotos ([ref]$copiedCount)
    
    Write-Host "STATUS:Completed. Copied $copiedCount photos"
    Write-Host "TOTAL_PHOTOS:$copiedCount"
    
} catch {
    Write-Host "ERROR:$($_.Exception.Message)"
    exit 1
}
