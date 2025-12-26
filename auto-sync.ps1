# Auto-sync with GitHub on app close
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if there are any changes
$status = git status --porcelain
if ($status) {
    # There are changes, commit and push
    git add . | Out-Null
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-sync: $timestamp" | Out-Null
    git push | Out-Null
}
