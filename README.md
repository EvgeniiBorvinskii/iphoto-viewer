# iPhoto Viewer 📱✨

<img width="2167" height="1155" alt="image" src="https://github.com/user-attachments/assets/2211193f-8348-4a60-be44-0b9415bd424a" />

<div align="center">

![iPhoto Viewer Banner](https://img.shields.io/badge/iPhoto_Viewer-Modern_iPhone_Photo_Manager-blueviolet?style=for-the-badge&logo=apple)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Super-optimized iPhone photo viewer with stunning Liquid Glass design** 🎨

*Lightning-fast photo browsing • Seamless drag-and-drop • USB & WiFi connectivity*

</div>

---

## ✨ Features

### 🚀 **Performance Optimized**
- **Virtualized photo grid** with React Window for smooth scrolling of thousands of photos
- **Lazy loading** thumbnails for instant UI response
- **Optimized rendering** with Framer Motion animations
- **Memory efficient** caching system

### 🎨 **Liquid Glass Design**
- **Stunning glassmorphic UI** inspired by iOS design language
- **Smooth animations** with 60fps performance
- **Custom frameless window** with integrated controls
- **Dual theme support** (Dark/Light) with one-click toggle

### 📱 **iPhone Connectivity**
- **USB connection** with libimobiledevice integration
- **WiFi connection** with automatic device discovery (Bonjour/mDNS)
- **Real-time device detection** and status monitoring
- **Secure connection** with device trust verification

### 🖼️ **Photo Management**
- **High-performance photo grid** with multi-select
- **Drag-and-drop** photo transfer between systems
- **Thumbnail preview** with full-resolution support
- **Batch operations** for multiple photos
- **Visual feedback** during transfers

### 🎯 **Modern UX**
- **Borderless window** design
- **Custom title bar** with integrated window controls
- **Smooth transitions** and micro-interactions
- **Responsive layout** adapting to any screen size

---

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Electron** | Cross-platform desktop framework |
| **React 18** | UI library with latest features |
| **TypeScript** | Type-safe development |
| **Vite** | Ultra-fast build tool |
| **Framer Motion** | Fluid animations |
| **React Window** | Virtualized lists for performance |
| **node-libimobiledevice** | iPhone USB communication |
| **Bonjour Service** | WiFi device discovery |

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **iTunes** or **Apple Mobile Device Support** (for USB connection on Windows)

### Quick Start

```powershell
# Clone the repository
git clone https://github.com/EvgeniiBorvinskii/iphoto-viewer.git
cd iphoto-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```powershell
# Build for Windows
npm run build:win

# Output will be in ./release directory
```

---

## 🎮 Usage

### Connecting Your iPhone

#### **USB Connection**
1. Connect your iPhone via USB cable
2. Click **"USB Cable"** tab
3. Trust this computer on your iPhone when prompted
4. Click **"Connect via USB"**

#### **WiFi Connection**
1. Ensure both devices are on the same network
2. Click **"WiFi"** tab
3. Click **"Scan for Devices"** to auto-discover
4. Or manually enter iPhone IP address
5. Click **"Connect via WiFi"**

### Managing Photos

- **Click** to select individual photos
- **Drag** photos to your desktop or folders to transfer
- **Multi-select** by clicking multiple photos
- **Clear selection** with the button in the header

### Theme Toggle

Click the **sun/moon icon** in the title bar to switch between light and dark themes.

---

## 🏗️ Project Structure

```
iphoto-viewer/
├── electron/               # Electron main process
│   ├── main.ts            # Entry point
│   ├── preload.ts         # IPC bridge
│   └── services/          # Core services
│       ├── IPhoneService.ts    # iPhone connectivity
│       └── PhotoService.ts     # Photo operations
├── src/                   # React application
│   ├── components/        # UI components
│   │   ├── TitleBar/      # Custom window controls
│   │   ├── ConnectionPanel/  # Connection UI
│   │   └── PhotoGrid/     # Photo gallery
│   ├── contexts/          # React contexts
│   │   ├── ThemeContext.tsx   # Theme management
│   │   └── ConnectionContext.tsx  # Connection state
│   ├── App.tsx            # Main application
│   └── main.tsx           # React entry point
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite configuration
└── README.md              # Documentation
```

---

## 🔧 Configuration

### Electron Build

The application is configured for Windows in `package.json`:

```json
"build": {
  "appId": "com.keywest.iphotoviewer",
  "productName": "iPhoto Viewer",
  "win": {
    "target": ["nsis"]
  }
}
```

### Development

- **Hot reload** enabled for React components
- **DevTools** open automatically in development mode
- **Port 5173** used for Vite dev server

---

## 🎨 Design System

### Color Palette

#### Dark Theme
- Background: `#0a0a0a` → `#1a1a1a` gradient
- Glass: `rgba(255, 255, 255, 0.05)`
- Accent: `#667eea` → `#764ba2` gradient

#### Light Theme
- Background: `#f5f5f5` → `#ffffff` gradient
- Glass: `rgba(255, 255, 255, 0.7)`
- Accent: `#667eea` → `#764ba2` gradient

### Glassmorphism Effect

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 🚀 Performance Optimizations

1. **Virtualization**: Only renders visible photos using React Window
2. **Thumbnail Caching**: Reduces redundant network requests
3. **Lazy Loading**: Images load on-demand as you scroll
4. **Debounced Rendering**: Smooth scrolling without frame drops
5. **Optimized Animations**: GPU-accelerated with Framer Motion
6. **Code Splitting**: Dynamic imports for faster initial load

---

## 🔐 Security

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Controlled IPC communication
- **CSP Headers**: Content Security Policy implemented

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Development Roadmap

- [x] Basic iPhone connectivity (USB/WiFi)
- [x] Photo grid with virtualization
- [x] Drag-and-drop support
- [x] Liquid Glass UI design
- [x] Dark/Light theme toggle
- [x] Custom title bar
- [ ] Full libimobiledevice integration
- [ ] Video support
- [ ] Photo editing capabilities
- [ ] iCloud Photos sync
- [ ] Multi-device management
- [ ] Export/Import presets
- [ ] Backup/Restore functionality

---

## 🐛 Known Issues

- **USB connectivity**: Requires libimobiledevice full implementation (currently simulated)
- **WiFi discovery**: May require firewall configuration for Bonjour
- **Large libraries**: Initial load may take time for 10,000+ photos

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Evgenii Borvinskii**

- GitHub: [@EvgeniiBorvinskii](https://github.com/EvgeniiBorvinskii)

---

## 🙏 Acknowledgments

- Apple iOS design language inspiration
- Electron community
- React and TypeScript ecosystems
- Open source contributors

---

## 📞 Support

Found a bug or have a feature request?

- 🐛 [Open an issue](https://github.com/EvgeniiBorvinskii/iphoto-viewer/issues)
- 💡 [Request a feature](https://github.com/EvgeniiBorvinskii/iphoto-viewer/issues/new)
- 📧 Email: contact@evgenii.dev

---

<div align="center">

**Made with ❤️ and lots of ☕**

⭐ Star this repo if you find it useful!

</div>
