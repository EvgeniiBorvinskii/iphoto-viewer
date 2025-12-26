# Debug script to explore iPhone Internal Storage
$shell = New-Object -ComObject Shell.Application
$computer = $shell.Namespace(17)

foreach ($device in $computer.Items()) {
    if ($device.Name -match "iPhone") {
        Write-Host "=== FOUND: $($device.Name) ==="
        
        $deviceNS = $shell.Namespace($device.Path)
        if ($deviceNS) {
            foreach ($storage in $deviceNS.Items()) {
                Write-Host "`nSTORAGE: $($storage.Name)"
                Write-Host "Path: $($storage.Path)"
                Write-Host "Type: $($storage.Type)"
                
                $storageNS = $shell.Namespace($storage.Path)
                if ($storageNS) {
                    Write-Host "`nContents of $($storage.Name):"
                    foreach ($item in $storageNS.Items()) {
                        Write-Host "  - $($item.Name) $(if($item.IsFolder){'[FOLDER]'}else{'[FILE]'})"
                        
                        # If it's DCIM or looks like photo folder, explore deeper
                        if ($item.Name -match "DCIM|Photo|Camera|Picture") {
                            Write-Host "    ^ Exploring this folder..."
                            $subNS = $shell.Namespace($item.Path)
                            if ($subNS) {
                                foreach ($subItem in $subNS.Items()) {
                                    Write-Host "      - $($subItem.Name)"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
