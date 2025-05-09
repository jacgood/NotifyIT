/**
 * Application configuration
 * Uses runtime configuration, environment variables, or fallbacks to default values
 */

// Get runtime config if available (for Docker deployment)
declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      REACT_APP_BASE_URL?: string;
      REACT_APP_AZURE_CLIENT_ID?: string;
      REACT_APP_AZURE_TENANT_ID?: string;
      PORT?: string;
    };
  }
}

// Server configuration
export const SERVER_CONFIG = {
  // Get base URL from runtime config, environment variables, or use current origin
  baseUrl: window.RUNTIME_CONFIG?.REACT_APP_BASE_URL || process.env.REACT_APP_BASE_URL || window.location.origin,
  port: window.RUNTIME_CONFIG?.PORT || process.env.PORT || 3000,
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
};

// Authentication configuration
export const AUTH_CONFIG = {
  clientId: window.RUNTIME_CONFIG?.REACT_APP_AZURE_CLIENT_ID || process.env.REACT_APP_AZURE_CLIENT_ID || '',
  tenantId: window.RUNTIME_CONFIG?.REACT_APP_AZURE_TENANT_ID || process.env.REACT_APP_AZURE_TENANT_ID || 'common',
  // Always use the current origin for the redirect URI to avoid mixed content issues
  redirectUri: window.location.origin,
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  defaultSound: process.env.REACT_APP_DEFAULT_NOTIFICATION_SOUND || 'bell-notification-337658.mp3',
  soundsPath: '/sounds/',
};

// Email service configuration
export const EMAIL_CONFIG = {
  checkInterval: 30000, // 30 seconds
  maxEmailsToFetch: 50,
};

// Export a default configuration object
const config = {
  server: SERVER_CONFIG,
  auth: AUTH_CONFIG,
  notification: NOTIFICATION_CONFIG,
  email: EMAIL_CONFIG,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
