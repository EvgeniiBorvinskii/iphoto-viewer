import React, { useState } from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import { motion, AnimatePresence } from 'framer-motion';
import './ConnectionPanel.css';

interface ConnectionPanelProps {
  onConnect: () => void;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ onConnect }) => {
  const { connectUSB, connectWiFi, isConnecting, discoverDevices } = useConnection();
  const [activeTab, setActiveTab] = useState<'usb' | 'wifi'>('usb');
  const [wifiIp, setWifiIp] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleUSBConnect = async () => {
    await connectUSB();
    onConnect();
  };

  const handleWiFiConnect = async () => {
    if (wifiIp.trim()) {
      await connectWiFi(wifiIp);
      onConnect();
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    const foundDevices = await discoverDevices();
    setDevices(foundDevices);
    setIsScanning(false);
  };

  return (
    <div className="connection-panel">
      <motion.div
        className="connection-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="connection-header">
          <h1>Connect to iPhone</h1>
          <p>Choose your connection method</p>
        </div>

        <div className="connection-tabs">
          <motion.button
            className={`tab ${activeTab === 'usb' ? 'active' : ''}`}
            onClick={() => setActiveTab('usb')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2v20M7 7l5-5 5 5M7 17l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            USB Cable
          </motion.button>

          <motion.button
            className={`tab ${activeTab === 'wifi' ? 'active' : ''}`}
            onClick={() => setActiveTab('wifi')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            WiFi
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'usb' ? (
            <motion.div
              key="usb"
              className="connection-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="info-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div>
                  <p>Connect your iPhone using a USB cable</p>
                  <span>Make sure to trust this computer on your device</span>
                </div>
              </div>

              <motion.button
                className="connect-button primary"
                onClick={handleUSBConnect}
                disabled={isConnecting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <div className="spinner"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Connect via USB
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="wifi"
              className="connection-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="info-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div>
                  <p>Connect via WiFi network</p>
                  <span>Both devices must be on the same network</span>
                </div>
              </div>

              <motion.button
                className="scan-button"
                onClick={handleScan}
                disabled={isScanning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isScanning ? (
                  <>
                    <div className="spinner"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="22 12 18 12 18 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Scan for Devices
                  </>
                )}
              </motion.button>

              {devices.length > 0 && (
                <div className="device-list">
                  {devices.map((device) => (
                    <motion.div
                      key={device.id}
                      className="device-item glass"
                      onClick={() => setWifiIp(device.ipAddress)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{device.name}</span>
                      <span className="device-ip">{device.ipAddress}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter iPhone IP address"
                  value={wifiIp}
                  onChange={(e) => setWifiIp(e.target.value)}
                  className="ip-input glass"
                />
              </div>

              <motion.button
                className="connect-button primary"
                onClick={handleWiFiConnect}
                disabled={isConnecting || !wifiIp.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <div className="spinner"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Connect via WiFi
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConnectionPanel;
