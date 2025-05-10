import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Check if the app is running on a native platform (iOS or Android)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if the app is running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if the app is running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Initialize Capacitor plugins
 */
export const initializeCapacitor = async (): Promise<void> => {
  // Hide the splash screen
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Error hiding splash screen:', error);
  }

  // Initialize push notifications if on a native platform
  if (isNativePlatform()) {
    try {
      // Request permission to use push notifications
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push
        await PushNotifications.register();
        console.log('Push notification registration successful');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }
};

/**
 * Show a local notification
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  id: number = Math.floor(Math.random() * 10000),
  sound?: string
): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('Local notifications are only available on native platforms');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          sound: sound || 'bell-notification-337658.mp3',
          attachments: [],
          actionTypeId: '',
          extra: {}
        }
      ]
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

/**
 * Add listeners for push notification events
 */
export const addPushNotificationListeners = (): void => {
  if (!isNativePlatform()) {
    return;
  }

  // On registration success
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success:', token.value);
  });

  // On registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // On push notification received
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
  });

  // On push notification action performed
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification);
  });
};

/**
 * Add listeners for local notification events
 */
export const addLocalNotificationListeners = (): void => {
  if (!isNativePlatform()) {
    return;
  }

  // On local notification received
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Local notification received:', notification);
  });

  // On local notification action performed
  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Local notification action performed:', notification);
  });
};
