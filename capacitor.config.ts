import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goodit.notifyit',
  appName: 'NotifyIT',
  webDir: 'build',
  server: {
    // Allow cleartext traffic for development
    cleartext: true,
    // For local development
    url: 'http://localhost:3000',
    // Uncomment for production
    // hostname: 'notifyit.local.good-it-solutions.com'
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  plugins: {
    // iOS permissions configuration
    Notifications: {
      sound: true,
      alert: true,
      badge: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b", // Matches slate-800 in your app
      showSpinner: true,
      spinnerColor: "#ffffff",
      androidSpinnerStyle: "large"
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#1e293b",
      sound: "bell-notification-337658.mp3"
    }
  }
};

export default config;
