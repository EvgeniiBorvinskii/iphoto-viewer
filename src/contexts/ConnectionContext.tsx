import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Device {
  id: string;
  name: string;
  type: 'usb' | 'wifi';
  ipAddress?: string;
  connected: boolean;
}

interface ConnectionContextType {
  device: Device | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectUSB: () => Promise<void>;
  connectWiFi: (ipAddress: string) => Promise<void>;
  disconnect: () => void;
  discoverDevices: () => Promise<Device[]>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectUSB = async () => {
    setIsConnecting(true);
    try {
      const result = await window.electron.connectUSB();
      if (result.success && result.device) {
        setDevice(result.device);
      }
    } catch (error) {
      console.error('USB connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWiFi = async (ipAddress: string) => {
    setIsConnecting(true);
    try {
      const result = await window.electron.connectWiFi(ipAddress);
      if (result.success && result.device) {
        setDevice(result.device);
      }
    } catch (error) {
      console.error('WiFi connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setDevice(null);
  };

  const discoverDevices = async (): Promise<Device[]> => {
    try {
      return await window.electron.discoverIPhones();
    } catch (error) {
      console.error('Device discovery failed:', error);
      return [];
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        device,
        isConnected: !!device,
        isConnecting,
        connectUSB,
        connectWiFi,
        disconnect,
        discoverDevices,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return context;
};
