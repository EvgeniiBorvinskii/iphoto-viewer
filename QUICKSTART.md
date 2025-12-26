# Quick Start Guide 🚀

Welcome to iPhoto Viewer! This guide will help you get started quickly.

## Installation

### Step 1: Prerequisites

Make sure you have installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Step 2: Clone and Install

```powershell
# Clone the repository
git clone https://github.com/YOUR_USERNAME/iphoto-viewer.git
cd iphoto-viewer

# Install dependencies
npm install
```

### Step 3: Run the Application

```powershell
# Start development mode
npm run dev
```

The application will open automatically!

## First Time Setup

### 1. Configure iTunes/Apple Mobile Device Support

For **USB connection** on Windows:
- Install [iTunes](https://www.apple.com/itunes/) or
- Install Apple Mobile Device Support

### 2. Connect Your iPhone

#### USB Connection:
1. Connect iPhone with USB cable
2. Trust this computer on your iPhone
3. Click "Connect via USB" in the app

#### WiFi Connection:
1. Ensure both devices are on same WiFi network
2. Click "Scan for Devices" or enter IP manually
3. Click "Connect via WiFi"

### 3. Browse Your Photos

- Photos load automatically after connection
- Click to select photos
- Drag photos to desktop/folders to transfer
- Use theme toggle (top center) to switch themes

## Keyboard Shortcuts

- `Ctrl + A` - Select all photos *(coming soon)*
- `Ctrl + D` - Deselect all *(coming soon)*
- `F11` - Toggle fullscreen *(coming soon)*
- `Ctrl + ,` - Settings *(coming soon)*

## Troubleshooting

### Connection Issues

**USB not working?**
- Make sure iTunes/Apple Mobile Device Support is installed
- Trust the computer on your iPhone
- Try reconnecting the cable

**WiFi not finding device?**
- Check both devices are on the same network
- Disable firewall temporarily to test
- Try entering IP address manually

### Performance Issues

- Close other applications
- Reduce the number of selected photos
- Clear browser cache (Ctrl + Shift + Delete)

## Building for Production

```powershell
# Build the application
npm run build:win

# Installer will be in ./release folder
```

## Need Help?

- 📖 Read the [full documentation](README.md)
- 🐛 [Report a bug](https://github.com/YOUR_USERNAME/iphoto-viewer/issues)
- 💡 [Request a feature](https://github.com/YOUR_USERNAME/iphoto-viewer/issues/new)

## What's Next?

- Explore advanced features
- Customize your experience
- Share feedback with us

Happy photo managing! 📸✨
