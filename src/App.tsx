import React, { useState, useEffect } from 'react';
import EmailSettings from './components/EmailSettings';
import NotificationSettings from './components/NotificationSettings';
import EmailList from './components/EmailList';
import ConnectionStatus from './components/ConnectionStatus';
import PermissionsOnboarding from './components/PermissionsOnboarding';
import { Email, NotificationSetting } from './types';
import { requestNotificationPermission, playNotificationSound, showNotification, preloadDefaultSound, unlockAudioOnIOS } from './utils/notifications';
import { loadNotificationSettings, saveNotificationSettings, loadEmailFilters, saveEmailFilters } from './utils/storage';
import { emailService } from './services/emailService';
import { exchangeEmailService } from './services/exchangeEmailService';
import { authService } from './services/authService';
import config from './config';
// Import Capacitor utilities
import { isNativePlatform, isIOS, initializeCapacitor, showLocalNotification, addLocalNotificationListeners } from './capacitor';

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting>(loadNotificationSettings());
  const [emailFilters, setEmailFilters] = useState(loadEmailFilters());
  const [isLoading, setIsLoading] = useState(true);
  const [isExchangeConnected, setIsExchangeConnected] = useState(false);
  const [activeEmailService, setActiveEmailService] = useState<'mock' | 'exchange'>('mock');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize Capacitor and check if we should show onboarding on app load
  useEffect(() => {
    // Initialize Capacitor if on a native platform
    if (isNativePlatform()) {
      // Initialize Capacitor plugins
      initializeCapacitor().catch(error => {
        console.error('Error initializing Capacitor:', error);
      });
      
      // Add local notification listeners
      addLocalNotificationListeners();
    }
    
    const onboardingComplete = localStorage.getItem('permissionsOnboardingComplete') === 'true';
    const isMobileDevice = isNativePlatform() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show onboarding for mobile devices if not completed before
    if (isMobileDevice && !onboardingComplete) {
      setShowOnboarding(true);
    } else {
      // For desktop or if onboarding already completed, just request permissions
      // Use Capacitor for notifications on native platforms
      if (!isNativePlatform()) {
        requestNotificationPermission().then(permission => {
          console.log('Notification permission status:', permission);
          
          // Preload default notification sound after permission is granted
          if (permission === 'granted') {
            preloadDefaultSound();
          }
        });
      }
    }

    // Initial fetch of emails
    fetchEmails();
    
    // Ensure the notification settings use the correct sound file
    const settings = loadNotificationSettings();
    if (settings.customSound !== config.notification.defaultSound) {
      console.log('Updating notification sound to use available sound file');
      const updatedSettings = {
        ...settings,
        customSound: config.notification.defaultSound
      };
      setNotificationSettings(updatedSettings);
      saveNotificationSettings(updatedSettings);
    }
  }, []);
  
  // Set up automatic email checking
  useEffect(() => {
    const checkEmailsAutomatically = async () => {
      console.log('Checking for new emails automatically...');
      try {
        const service = isExchangeConnected ? exchangeEmailService : emailService;
        console.log(`Using ${isExchangeConnected ? 'Exchange' : 'Mock'} email service`);
        
        const newEmails = await service.checkForNewEmails();
        console.log(`Found ${newEmails.length} new emails`);

        if (newEmails.length > 0) {
          // Process new emails for notifications
          processNewEmails(newEmails);
        } else {
          console.log('No new emails found');
        }
      } catch (error) {
        console.error('Error checking for new emails:', error);
      }
    };
    
    console.log('Setting up automatic email checking...');
    const checkEmailsInterval = setInterval(checkEmailsAutomatically, config.email.checkInterval);
    
    // Run once immediately
    checkEmailsAutomatically();
    
    // Clean up on unmount
    return () => {
      console.log('Clearing email check interval');
      clearInterval(checkEmailsInterval);
    };
  }, [isExchangeConnected]); // Re-setup when exchange connection changes

  
  // When Exchange connection status changes, update active email service
  useEffect(() => {
    setActiveEmailService(isExchangeConnected ? 'exchange' : 'mock');
    fetchEmails();
  }, [isExchangeConnected]);
  
  // Fetch emails from the active email service
  const fetchEmails = () => {
    setIsLoading(true);
    
    const service = isExchangeConnected ? exchangeEmailService : emailService;
    
    service.fetchCriticalEmails()
      .then(fetchedEmails => {
        setEmails(fetchedEmails);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching emails:', error);
        setIsLoading(false);
      });
  };

  // Save settings whenever they change
  useEffect(() => {
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  // Save email filters whenever they change
  useEffect(() => {
    saveEmailFilters(emailFilters);
  }, [emailFilters]);

  // Handler for notification settings changes
  const handleNotificationSettingsChange = (newSettings: NotificationSetting) => {
    setNotificationSettings(newSettings);
  };

  // Handler for email filter changes
  const handleEmailFiltersChange = (newFilters: any) => {
    setEmailFilters(newFilters);
  };

  // Handle when an email is clicked (mark as read)
  const handleEmailClick = (emailId: string) => {
    const service = isExchangeConnected ? exchangeEmailService : emailService;
    
    service.markAsRead(emailId)
      .then(success => {
        if (success) {
          // Update the local state to reflect the change
          setEmails(prevEmails =>
            prevEmails.map(email =>
              email.id === emailId ? { ...email, isRead: true } : email
            )
          );
        }
      });
  };

  // Periodically check for new emails
  useEffect(() => {
    console.log('Setting up automatic email checking...');
    
    // Request notification permission immediately
    requestNotificationPermission().then(permission => {
      console.log('Notification permission status:', permission);
    });
    
    const checkEmails = async () => {
      console.log('Checking for new emails automatically...');
      
      try {
        const service = isExchangeConnected ? exchangeEmailService : emailService;
        console.log(`Using ${isExchangeConnected ? 'Exchange' : 'Mock'} email service`);
        
        const newEmails = await service.checkForNewEmails();
        console.log(`Found ${newEmails.length} new emails`);

        if (newEmails.length > 0) {
          // Add new emails to the state
          setEmails(prevEmails => {
            const updatedEmails = [...newEmails, ...prevEmails];
            console.log(`Updated email count: ${updatedEmails.length}`);
            return updatedEmails;
          });

          // Process each new email for notification
          newEmails.forEach(email => {
            console.log('Processing email for notification:', email.subject);
            console.log('Email priority:', email.priority);
            console.log('Current filters:', emailFilters);
            
            // Check if notifications are enabled
            if (!notificationSettings.enableNotifications) {
              console.log('Notifications are disabled, skipping notification');
              return;
            }
            
            // Start with notification enabled for testing
            let shouldNotify = true;
            
            console.log('High priority only setting:', emailFilters.highPriorityOnly);
            
            // Check subject keywords first (these override priority settings)
            const hasKeywordInSubject = emailFilters.subjects.some(subject => 
              email.subject.toLowerCase().includes(subject.toLowerCase()));
            
            console.log('Has keyword in subject:', hasKeywordInSubject);
            
            // Check sender match
            const isSenderMatch = emailFilters.senders.length === 0 || 
              emailFilters.senders.some(sender => 
                email.from.toLowerCase().includes(sender.toLowerCase()));
            
            console.log('Is sender match:', isSenderMatch);
            
            // For emails with keywords in subject, we'll notify regardless of priority
            if (hasKeywordInSubject && isSenderMatch) {
              shouldNotify = true;
              console.log('Notifying because email has keyword in subject and matches sender filter');
            } else if (emailFilters.highPriorityOnly) {
              // If high priority only is set and no keywords match, check priority
              shouldNotify = email.priority === 'high' && isSenderMatch;
              console.log('Checking high priority only:', shouldNotify);
            } else {
              // Otherwise use normal filter logic
              shouldNotify = isSenderMatch;
            }
            
            console.log(`Should notify for this email: ${shouldNotify}`);

            if (shouldNotify) {
              console.log(`Sending notification for email: ${email.subject}`);
              
              // For testing, temporarily bypass the time window check
              const bypassTimeWindow = true;
              let isInNotificationWindow = true;
              
              if (!bypassTimeWindow) {
                // Check if current time is within notification window
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                console.log(`Current time: ${currentTime}`);

                const startHour = parseInt(notificationSettings.startTime.split(':')[0]);
                const endHour = parseInt(notificationSettings.endTime.split(':')[0]);
                console.log(`Notification window: ${startHour}:00 to ${endHour}:00`);

                // Determine if current time is within notification period
                if (startHour > endHour) { // Time spans overnight
                  isInNotificationWindow = currentHour >= startHour || currentHour < endHour;
                } else {
                  isInNotificationWindow = currentHour >= startHour && currentHour < endHour;
                }
              }
              
              console.log(`Is in notification window: ${isInNotificationWindow}`);

              if (isInNotificationWindow) {
                // Show system notification with custom sound
                showNotification(
                  'Critical IT Alert', 
                  {
                    body: `From: ${email.from}\nSubject: ${email.subject}`,
                    icon: `${window.location.origin}/logo192.png`,
                    tag: email.id
                  },
                  notificationSettings.customSound,
                  notificationSettings.volume / 100
                );
              }
            }
          });
        } else {
          console.log('No new emails found');
        }
      } catch (error) {
        console.error('Error checking for new emails:', error);
      }
    };

    // Run the check immediately when component mounts
    checkEmails();
    
    // Then check emails based on configured interval
    console.log(`Setting up interval to check emails every ${config.email.checkInterval/1000} seconds`);
    const emailCheckInterval = setInterval(checkEmails, config.email.checkInterval);
    
    // Clean up interval when component unmounts
    return () => {
      console.log('Clearing email check interval');
      clearInterval(emailCheckInterval);
    };
  }, [notificationSettings, emailFilters, isExchangeConnected]); // Added isExchangeConnected to dependencies

  // Process new emails and send notifications if needed
  const processNewEmails = (newEmails: Email[]) => {
    // Add new emails to the state
    setEmails(prevEmails => {
      const updatedEmails = [...newEmails, ...prevEmails];
      console.log(`Updated email count: ${updatedEmails.length}`);
      return updatedEmails;
    });

    // Check each email against filters to determine if notification should be sent
    newEmails.forEach(email => {
      console.log(`Processing email for notification: ${email.subject}`);
      console.log(`Email priority: ${email.priority}`);
      console.log(`Current filters: ${JSON.stringify(emailFilters)}`);
      
      // Check if notification should be sent based on filters
      let shouldNotify = false;
      
      // Check if high priority only setting is enabled
      const isHighPriorityOnly = emailFilters.highPriorityOnly;
      console.log(`High priority only setting: ${isHighPriorityOnly}`);
      
      // Check if email has a keyword in the subject
      const hasKeywordInSubject = emailFilters.subjects.some(keyword => 
        email.subject.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log(`Has keyword in subject: ${hasKeywordInSubject}`);
      
      // Check sender match
      const isSenderMatch = emailFilters.senders.length === 0 || 
        emailFilters.senders.some(sender => 
          email.from.toLowerCase().includes(sender.toLowerCase())
        );
      console.log(`Is sender match: ${isSenderMatch}`);
      
      // Determine if notification should be sent
      if (hasKeywordInSubject && isSenderMatch) {
        console.log('Notifying because email has keyword in subject and matches sender filter');
        shouldNotify = true;
      } else if (email.priority === 'high' && !isHighPriorityOnly) {
        console.log('Notifying because email is high priority and high priority only is disabled');
        shouldNotify = true;
      } else if (email.priority === 'high' && isHighPriorityOnly) {
        console.log('Notifying because email is high priority and high priority only is enabled');
        shouldNotify = true;
      }
      
      console.log(`Should notify for this email: ${shouldNotify}`);
      
      // Send notification if needed
      if (shouldNotify) {
        console.log(`Sending notification for email: ${email.subject}`);
        
        // Check if we're in the notification window (8am to 10pm)
        const now = new Date();
        const hour = now.getHours();
        const isInNotificationWindow = hour >= 8 && hour < 22;
        console.log(`Is in notification window: ${isInNotificationWindow}`);
        
        if (isInNotificationWindow) {
          if (isNativePlatform()) {
            // Use Capacitor's native notifications on iOS/Android
            showLocalNotification(
              'Critical IT Alert',
              `From: ${email.from}\nSubject: ${email.subject}`,
              parseInt(email.id, 10) || Math.floor(Math.random() * 10000),
              notificationSettings.customSound
            );
          } else {
            // Use web notifications on desktop browsers
            showNotification(
              'Critical IT Alert', 
              {
                body: `From: ${email.from}\nSubject: ${email.subject}`,
                icon: `${window.location.origin}/logo192.png`,
                tag: email.id
              },
              notificationSettings.customSound,
              notificationSettings.volume / 100
            );
          }
        }
      }
    });
  };
  
  // Handle authentication status change
  const handleAuthChange = (isAuthenticated: boolean) => {
    setIsExchangeConnected(isAuthenticated);
  };

  // Handle user interaction to initialize audio
  const initializeAudio = () => {
    if (!audioInitialized) {
      console.log('User interaction detected, initializing audio');
      
      // Try to unlock audio on iOS
      unlockAudioOnIOS();
      
      // Create and play a silent audio context
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('AudioContext resumed successfully');
            });
          }
          
          // Preload the default sound
          const soundPath = `${window.location.origin}/sounds/${notificationSettings.customSound}`;
          console.log('Initializing audio with path:', soundPath);
          
          const audio = new Audio(soundPath);
          audio.volume = 0;
          audio.load();
          
          // Play and immediately pause to initialize
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              audio.pause();
              console.log('Audio context initialized successfully');
              setAudioInitialized(true);
            }).catch(err => {
              console.warn('Audio initialization failed:', err);
            });
          }
        }
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    }
  };
  
  // Handle completion of the permissions onboarding
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    initializeAudio();
  };

  return (
    <div 
      className="min-h-screen bg-gray-100 flex flex-col"
      onClick={initializeAudio} // Initialize audio on any user interaction
    >
      {showOnboarding && (
        <PermissionsOnboarding onComplete={handleOnboardingComplete} />
      )}
      
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">NotifyIT</h1>
        <p className="text-sm text-slate-300">Critical IT Alert Notification System</p>
      </header>
      
      <main className="p-4">
        <ConnectionStatus onAuthChange={handleAuthChange} />
        
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
          <p className="font-medium">{isExchangeConnected ? 'Connected to Exchange Online' : 'Using Demo Mode'}</p>
          <p>{isExchangeConnected 
            ? 'Your Microsoft 365 account is connected. You will receive notifications for critical emails from your Exchange mailbox.'
            : 'Connect to your Microsoft 365 account to receive notifications for critical emails from your Exchange mailbox.'}
          </p>
        </div>
        
        <section className="flex flex-col md:flex-row gap-6 mb-8">
          <NotificationSettings
            settings={notificationSettings}
            onSettingsChange={handleNotificationSettingsChange}
          />

          <EmailSettings
            filters={emailFilters}
            onFiltersChange={handleEmailFiltersChange}
          />
        </section>
        
        <section className="bg-gray-50 rounded-lg p-4 shadow-md">
          <h2 className="text-xl font-semibold text-slate-800 mt-0 mb-4">Recent Critical Emails</h2>
          {isLoading ? (
            <div className="py-4 text-center text-gray-500">Loading emails...</div>
          ) : (
            <EmailList
              emails={emails}
              onEmailClick={handleEmailClick}
            />
          )}
        </section>
      </main>
      
      <footer className="text-center p-4 mt-8 text-gray-600 text-sm">
        <p>NotifyIT v0.1.0 - Tap the button below to test notifications</p>
        <button 
          className="bg-red-600 hover:bg-red-700 text-white border-none rounded px-6 py-3 mt-2 cursor-pointer text-base transition-colors"
          onClick={() => {
            if (isNativePlatform()) {
              // Use Capacitor's native notifications on iOS/Android
              showLocalNotification(
                'Test Notification',
                'This is a test notification from NotifyIT',
                Math.floor(Math.random() * 10000),
                notificationSettings.customSound
              );
            } else {
              // Use web notifications on desktop browsers
              showNotification(
                'Test Notification',
                {
                  body: 'This is a test notification from NotifyIT',
                  icon: `${window.location.origin}/logo192.png`
                },
                notificationSettings.customSound,
                notificationSettings.volume / 100
              );
            }
          }}
        >
          Test Alert Sound
        </button>
      </footer>
    </div>
  );
}

export default App;
