export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  received: Date;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationSetting {
  enableNotifications: boolean;
  startTime: string; // Format: "HH:MM" - start of notification window
  endTime: string;   // Format: "HH:MM" - end of notification window
  volume: number;    // 0-100
  overrideSilentMode: boolean;
  customSound: string;
}

export interface EmailFilter {
  senders: string[];  // Array of email addresses that trigger notifications
  subjects: string[]; // Array of subject keywords that trigger notifications
  highPriorityOnly: boolean; // Only high priority emails trigger notifications
}