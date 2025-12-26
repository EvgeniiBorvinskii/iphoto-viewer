# iPhoto Viewer - Hidden Launcher
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Hide PowerShell window
$null = Add-Type -Name Window -Namespace Console -MemberDefinition @'
[DllImport("Kernel32.dll")]
public static extern IntPtr GetConsoleWindow();

[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, Int32 nCmdShow);
'@

$consolePtr = [Console.Window]::GetConsoleWindow()
[Console.Window]::ShowWindow($consolePtr, 0)

# Start the application
Start-Process "npm" -ArgumentList "run", "dev" -WindowStyle Hidden -WorkingDirectory $scriptPath
