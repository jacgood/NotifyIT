import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { exchangeEmailService } from '../services/exchangeEmailService';

interface ConnectionStatusProps {
  className?: string;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className, onAuthChange }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize MSAL and check authentication status
  useEffect(() => {
    let isMounted = true;
    
    const initializeAndCheckAuth = async () => {
      try {
        // Wait for MSAL to initialize before checking auth status
        await new Promise(resolve => setTimeout(resolve, 1000)); // Give MSAL time to initialize
        
        if (!isMounted) return;
        
        const authStatus = authService.isAuthenticated();
        setIsAuthenticated(authStatus);
        setIsInitialized(true);
        
        if (authStatus) {
          try {
            const email = await exchangeEmailService.getUserEmail();
            if (isMounted) {
              setUserEmail(email);
            }
          } catch (error) {
            console.error('Error getting user email:', error);
          }
        }
        
        // Notify parent component of auth change
        if (isMounted && onAuthChange) {
          onAuthChange(authStatus);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        if (isMounted) {
          setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        }
      }
    };
    
    initializeAndCheckAuth();
    
    return () => {
      isMounted = false;
    };
  }, [onAuthChange]);
  
  // Update online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChecked(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up a periodic check
    const intervalId = setInterval(() => {
      setLastChecked(new Date());
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // Format the last checked time
  const formatLastChecked = () => {
    return lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogin = async () => {
    try {
      await authService.login();
      setIsAuthenticated(true);
      const email = await exchangeEmailService.getUserEmail();
      setUserEmail(email);
      
      if (onAuthChange) {
        onAuthChange(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserEmail('');
    
    if (onAuthChange) {
      onAuthChange(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          <span className="text-xs text-gray-500 ml-3">Last checked: {formatLastChecked()}</span>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center">
            <span className="text-sm mr-3">
              <span className="text-gray-500">Connected:</span> {userEmail}
            </span>
            <button 
              onClick={handleLogout}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
          >
            Connect to Exchange
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;