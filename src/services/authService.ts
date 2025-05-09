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
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage', // This setting allows the app to use localStorage for cache
    storeAuthStateInCookie: true,  // This is crucial for IE11/Edge and when 3rd party cookies are blocked
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: msal.LogLevel, message: string, containsPii: boolean) => {
        if (!containsPii) {
          switch (level) {
            case msal.LogLevel.Error:
              console.error('MSAL:', message);
              break;
            case msal.LogLevel.Warning:
              console.warn('MSAL:', message);
              break;
            case msal.LogLevel.Info:
              console.info('MSAL:', message);
              break;
            case msal.LogLevel.Verbose:
              console.debug('MSAL:', message);
              break;
          }
        }
      },
      logLevel: msal.LogLevel.Warning,
    }
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

// Flag to track if we've already handled the redirect response
let redirectHandled = false;

// Try to initialize MSAL if supported
if (isMsalSupported()) {
  try {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    console.log('MSAL instance created successfully');
    
    // Handle the redirect promise when the page loads
    // This ensures authentication state is properly restored after page refresh
    if (!redirectHandled) {
      redirectHandled = true;
      msalInstance.handleRedirectPromise()
        .then(response => {
          if (response) {
            console.log('Successfully handled redirect response', response);
          }
        })
        .catch(error => {
          console.error('Error handling redirect:', error);
        });
    }
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
   * @param useRedirect Whether to use redirect flow instead of popup
   */
  async login(useRedirect: boolean = false) {
    if (!msalInstance) {
      console.error('Authentication is not available');
      throw new Error('Authentication is not available');
    }
    
    try {
      console.log('Starting login process with MSAL...');
      
      // Ensure MSAL is initialized before login
      await this.initializeMsal();
      
      if (useRedirect) {
        // Login with redirect (better for mobile and when popup is blocked)
        console.log('Using redirect login flow');
        await msalInstance.loginRedirect(loginRequest);
        // This will redirect the page, so no code after this will execute
        return null;
      } else {
        // Login with popup (better user experience on desktop)
        console.log('Using popup login flow');
        const response = await msalInstance.loginPopup(loginRequest);
        console.log('Login successful:', response);
        return response;
      }
    } catch (error) {
      console.error('Error during login:', error);
      
      // If popup is blocked, try redirect flow
      if (error instanceof Error && error.message.includes('popup')) {
        console.log('Popup blocked, trying redirect flow');
        try {
          await msalInstance.loginRedirect(loginRequest);
          return null;
        } catch (redirectError) {
          console.error('Redirect login also failed:', redirectError);
          alert(`Login failed: ${redirectError instanceof Error ? redirectError.message : 'Unknown error'}`);
          throw redirectError;
        }
      }
      
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Logout from Microsoft account
   * @param useRedirect Whether to use redirect flow instead of popup
   */
  async logout(useRedirect: boolean = false) {
    if (!msalInstance) {
      return;
    }
    
    try {
      const logoutRequest = {
        account: this.getCurrentUser(),
        postLogoutRedirectUri: window.location.origin,
      };
      
      if (useRedirect) {
        // Logout with redirect
        console.log('Using redirect logout flow');
        await msalInstance.logoutRedirect(logoutRequest);
        // This will redirect the page, so no code after this will execute
      } else {
        // Logout with popup
        console.log('Using popup logout flow');
        await msalInstance.logoutPopup(logoutRequest);
        console.log('Logout successful');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If popup is blocked, try redirect flow
      if (error instanceof Error && error.message.includes('popup') && !useRedirect) {
        console.log('Popup blocked, trying redirect flow');
        try {
          await msalInstance.logoutRedirect({
            account: this.getCurrentUser(),
            postLogoutRedirectUri: window.location.origin,
          });
        } catch (redirectError) {
          console.error('Redirect logout also failed:', redirectError);
        }
      }
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
