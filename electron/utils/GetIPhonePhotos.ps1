# PowerShell script to access iPhone photos via WPD API
param()

try {
    Write-Host "=== Searching for iPhone photos ==="
    
    # Create Shell.Application COM object
    $shell = New-Object -ComObject Shell.Application
    
    # Get Computer namespace (This PC)
    $computer = $shell.Namespace(17)
    
    $photoCount = 0
    $foundDevice = $false
    
    # Look through all items in This PC
    foreach ($device in $computer.Items()) {
        Write-Host "Checking device: $($device.Name)"
        
        # Check if this is an iPhone
        if ($device.Name -match "iPhone|Apple") {
            Write-Host "FOUND_IPHONE:$($device.Name)"
            $foundDevice = $true
            
            try {
                # Open the device
                $deviceNamespace = $shell.Namespace($device.Path)
                
                if ($deviceNamespace -ne $null) {
                    # Look for Internal Storage
                    foreach ($storage in $deviceNamespace.Items()) {
                        Write-Host "  Storage: $($storage.Name)"
                        
                        if ($storage.Name -match "Internal Storage|Memory") {
                            $storageNamespace = $shell.Namespace($storage.Path)
                            
                            if ($storageNamespace -ne $null) {
                                # Look for DCIM folder
                                foreach ($folder in $storageNamespace.Items()) {
                                    Write-Host "    Folder: $($folder.Name)"
                                    
                                    if ($folder.Name -eq "DCIM") {
                                        Write-Host "DCIM_FOUND"
                                        
                                        # Count photos recursively
                                        function Count-Photos($namespace, $depth = 0) {
                                            if ($depth -gt 10) { return 0 }
                                            
                                            $count = 0
                                            foreach ($item in $namespace.Items()) {
                                                if ($item.IsFolder) {
                                                    $subNamespace = $shell.Namespace($item.Path)
                                                    if ($subNamespace -ne $null) {
                                                        $count += Count-Photos $subNamespace ($depth + 1)
                                                    }
                                                } else {
                                                    $ext = [System.IO.Path]::GetExtension($item.Name).ToLower()
                                                    if ($ext -match "^\.(jpg|jpeg|png|heic|heif)$") {
                                                        $count++
                                                        Write-Host "PHOTO:$($item.Name)"
                                                    }
                                                }
                                            }
                                            return $count
                                        }
                                        
                                        $dcimNamespace = $shell.Namespace($folder.Path)
                                        if ($dcimNamespace -ne $null) {
                                            $photoCount = Count-Photos $dcimNamespace
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch {
                Write-Host "ERROR:$($_.Exception.Message)"
            }
        }
    }
    
    if ($foundDevice) {
        Write-Host "TOTAL_PHOTOS:$photoCount"
    } else {
        Write-Host "NO_IPHONE_FOUND"
    }
    
} catch {
    Write-Host "SCRIPT_ERROR:$($_.Exception.Message)"
}

Write-Host "=== Script complete ==="
