import * as msal from '@azure/msal-browser';
import { AUTH_CONFIG } from '../config';

// Log configuration for debugging
console.log('Auth Config:', {
  clientId: AUTH_CONFIG.clientId,
  tenantId: AUTH_CONFIG.tenantId,
  redirectUri: AUTH_CONFIG.redirectUri
});

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: AUTH_CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}`,
    redirectUri: AUTH_CONFIG.redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

// Check if we have required configuration and browser features
const isMsalSupported = (): boolean => {
  // Check if we have a client ID
  if (!AUTH_CONFIG.clientId) {
    console.warn('Azure AD client ID is not configured. Authentication will be disabled.');
    return false;
  }
  
  // Check if crypto is available (required by MSAL)
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('Web Crypto API is not available in this environment. Authentication will be disabled.');
    return false;
  }
  
  return true;
};

// Create MSAL instance safely
let msalInstance: msal.PublicClientApplication | null = null;
let msalInitialized = false;

// Try to initialize MSAL if supported
if (isMsalSupported()) {
  try {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    console.log('MSAL instance created successfully');
  } catch (error) {
    console.error('Failed to create MSAL instance:', error);
    msalInstance = null;
  }
} else {
  console.log('MSAL initialization skipped due to missing requirements');
}

// Authentication parameters
const loginRequest = {
  scopes: ['User.Read', 'Mail.Read']
};

/**
 * Service to handle Microsoft authentication
 */
class AuthService {
  /**
   * Initialize MSAL
   */
  private async initializeMsal(): Promise<void> {
    if (msalInitialized || !msalInstance) {
      return;
    }

    try {
      console.log('Initializing MSAL...');
      await msalInstance.initialize();
      msalInitialized = true;
      console.log('MSAL initialized successfully');
    } catch (error) {
      console.error('Error initializing MSAL:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!msalInstance) {
      console.log('Authentication is disabled');
      return false;
    }
    
    try {
      const accounts = msalInstance.getAllAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    if (!msalInstance) {
      return null;
    }
    
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }
      return accounts[0];
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Login with Microsoft account
   */
  async login() {
    if (!msalInstance) {
      console.error('Authentication is not available');
      throw new Error('Authentication is not available');
    }
    
    try {
      console.log('Starting login process with MSAL...');
      
      // Ensure MSAL is initialized before login
      await this.initializeMsal();
      
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
  async logout() {
    if (!msalInstance) {
      return;
    }
    
    try {
      const logoutRequest = {
        account: this.getCurrentUser(),
        postLogoutRedirectUri: window.location.origin,
      };
      
      await msalInstance.logoutPopup(logoutRequest);
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken(): Promise<string> {
    if (!msalInstance) {
      throw new Error('Authentication is not available');
    }
    
    try {
      // Ensure MSAL is initialized
      await this.initializeMsal();
      
      // Get current account
      const account = this.getCurrentUser();
      if (!account) {
        throw new Error('User is not logged in');
      }
      
      // Get token silently
      const tokenRequest = {
        scopes: loginRequest.scopes,
        account: account
      };
      
      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      
      // If silent token acquisition fails, try interactive
      if (error instanceof msal.InteractionRequiredAuthError) {
        try {
          const response = await msalInstance.acquireTokenPopup(loginRequest);
          return response.accessToken;
        } catch (interactiveError) {
          console.error('Error getting token interactively:', interactiveError);
          throw interactiveError;
        }
      }
      
      throw error;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
