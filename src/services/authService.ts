import * as msal from '@azure/msal-browser';

// Get environment variables
const clientId = process.env.REACT_APP_AZURE_CLIENT_ID || '';
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID || 'common';

// Log environment variables for debugging
console.log('Auth Config:', {
  clientId: clientId,
  tenantId: tenantId,
  redirectUri: window.location.origin
});

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

// Create MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Initialize MSAL
let msalInitialized = false;
let initializationPromise: Promise<void> | null = null;

const initializeMsal = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      if (!msalInitialized) {
        try {
          console.log('Initializing MSAL...');
          await msalInstance.initialize();
          msalInitialized = true;
          console.log('MSAL initialized successfully');
        } catch (error) {
          console.error('Failed to initialize MSAL:', error);
          // Reset the promise so initialization can be attempted again
          initializationPromise = null;
          throw error;
        }
      }
    })();
  }
  return initializationPromise;
};

// Start initialization immediately but don't wait for it
initializeMsal().catch(() => {
  // Error is already logged in the function
});

// Authentication parameters
const loginRequest = {
  scopes: ['User.Read', 'Mail.Read']
};

class AuthService {
  /**
   * Login with Microsoft account
   */
  async login() {
    try {
      console.log('Starting login process with MSAL...');
      console.log('MSAL Config:', msalConfig);
      console.log('Login Request:', loginRequest);
      
      // Ensure MSAL is initialized before login
      if (!msalInitialized) {
        console.log('MSAL not initialized yet, initializing now...');
        await initializeMsal();
      }
      
      // Login with popup
      const response = await msalInstance.loginPopup(loginRequest);
      console.log('Login successful:', response);
      return response;
    } catch (error) {
      console.error('Error during login:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`); 
      throw error;
    }
  }

  /**
   * Logout from Microsoft account
   */
  logout() {
    msalInstance.logout();
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken() {
    try {
      // Get all accounts
      const accounts = msalInstance.getAllAccounts();
      
      // If no accounts, user needs to login
      if (accounts.length === 0) {
        throw new Error('No accounts found. User must login first.');
      }

      // Use the first account
      const silentRequest = {
        scopes: ['User.Read', 'Mail.Read'],
        account: accounts[0]
      };

      // Get token silently
      const response = await msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive method
      if (error instanceof msal.InteractionRequiredAuthError) {
        const response = await msalInstance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      }
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    try {
      // Only check if MSAL is initialized
      if (msalInitialized) {
        const accounts = msalInstance.getAllAccounts();
        return accounts.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    try {
      // Only check if MSAL is initialized
      if (msalInitialized) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
          return null;
        }
        return accounts[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
