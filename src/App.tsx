import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import TitleBar from './components/TitleBar/TitleBar';
import ConnectionPanel from './components/ConnectionPanel/ConnectionPanel';
import PhotoGrid from './components/PhotoGrid/PhotoGrid';
import './App.css';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <ThemeProvider>
      <ConnectionProvider>
        <div className="app">
          <TitleBar />
          <div className="app-content">
            {!isConnected ? (
              <ConnectionPanel onConnect={() => setIsConnected(true)} />
            ) : (
              <PhotoGrid />
            )}
          </div>
        </div>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

export default App;
