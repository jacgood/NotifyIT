import { NotificationSetting, EmailFilter } from '../types';

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSetting = {
  enableNotifications: false,
  startTime: '22:00',
  endTime: '06:00',
  volume: 80,
  overrideSilentMode: true,
  customSound: 'bell-notification-337658.mp3',
  customSounds: [] // Initialize with empty array for custom sounds
};

// Default email filters
const DEFAULT_EMAIL_FILTERS = {
  senders: [], // Empty array means notify on any sender
  subjects: ['URGENT', 'CRITICAL', 'DOWNTIME'],
  highPriorityOnly: true
};

// Storage keys
const SETTINGS_STORAGE_KEY = 'notifyit_settings';
const FILTERS_STORAGE_KEY = 'notifyit_filters';

/**
 * Save notification settings to local storage
 * @param settings The notification settings to save
 */
export const saveNotificationSettings = (settings: NotificationSetting): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Load notification settings from local storage
 * @returns The saved notification settings or default values
 */
export const loadNotificationSettings = (): NotificationSetting => {
  try {
    const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

/**
 * Save email filters to local storage
 * @param filters The email filters to save
 */
export const saveEmailFilters = (filters: EmailFilter): void => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    console.log('Filters saved successfully');
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};

/**
 * Load email filters from local storage
 * @returns The saved email filters or default values
 */
export const loadEmailFilters = (): EmailFilter => {
  try {
    const filters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (filters) {
      return JSON.parse(filters);
    }
  } catch (error) {
    console.error('Error loading filters:', error);
  }
  return DEFAULT_EMAIL_FILTERS;
};