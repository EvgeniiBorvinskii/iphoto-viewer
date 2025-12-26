$libsDir = "electron\libs\libimobiledevice"
New-Item -ItemType Directory -Path $libsDir -Force | Out-Null
Write-Host "Created directory: $libsDir" -ForegroundColor Green
Write-Host ""
Write-Host "Please download libimobiledevice manually:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/libimobiledevice-win32/imobiledevice-net/releases" -ForegroundColor White
Write-Host "2. Download latest Windows x64 zip file" -ForegroundColor White
Write-Host "3. Extract to: $PWD\$libsDir" -ForegroundColor White
Write-Host ""
Write-Host "Required files:" -ForegroundColor Cyan
Write-Host "  - idevice_id.exe" -ForegroundColor Gray
Write-Host "  - ideviceinfo.exe" -ForegroundColor Gray
Write-Host "  - idevicepair.exe" -ForegroundColor Gray
Write-Host "  - All DLL files" -ForegroundColor Gray
