// Cache for audio elements to avoid recreating them
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Requests notification permission from the browser
 * @returns Promise resolving to the permission state
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return 'denied';
  }

  console.log('Current notification permission:', Notification.permission);
  
  try {
    // Always request permission if not already granted
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission request result:', permission);
      return permission;
    }
    
    console.log('Notification permission already granted');
    return Notification.permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Plays a notification sound at the specified volume
 * @param soundFile The sound file to play
 * @param volume Volume level (0.0 to 1.0)
 */
export const playNotificationSound = (soundFile: string, volume: number = 1.0): void => {
  try {
    // Build the full path to the sound file
    const soundPath = `${window.location.origin}/sounds/${soundFile}`;
    console.log('Attempting to play sound from:', soundPath);
    
    // Create a new Audio instance each time to avoid caching issues
    const audio = new Audio(soundPath);
    
    // Add event listeners for debugging
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio can play through without buffering');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      console.error('Audio error code:', audio.error?.code);
      console.error('Audio error message:', audio.error?.message);
    });
    
    // Set volume (between 0.0 and 1.0)
    audio.volume = Math.min(1.0, Math.max(0.0, volume));
    console.log(`Setting volume to ${audio.volume}`);
    
    // Promise-based approach to handle autoplay restrictions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio playback started successfully');
        })
        .catch(error => {
          console.error('Audio playback failed:', error);
          
          // Try an alternative approach with a fallback sound
          try {
            // Create and play a short beep as fallback
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 800; // frequency in hertz
            gainNode.gain.value = volume;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200); // beep for 200ms
            
            console.log('Fallback audio played');
          } catch (fallbackError) {
            console.error('Fallback audio also failed:', fallbackError);
            
            // If autoplay was prevented, we can notify the user to interact with the page
            if (error.name === 'NotAllowedError') {
              alert('Please interact with the page to enable sound notifications');
            }
          }
        });
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

/**
 * Attempts to wake up the device screen (limited by browser capabilities)
 */
export const wakeScreen = (): void => {
  try {
    if ('wakeLock' in navigator) {
      // @ts-ignore - TypeScript might not recognize the Wake Lock API
      navigator.wakeLock.request('screen')
        .then((wakeLock: any) => {
          console.log('Wake Lock activated');
          // Release the wake lock after a few seconds
          setTimeout(() => {
            wakeLock.release()
              .then(() => console.log('Wake Lock released'));
          }, 10000);
        })
        .catch((err: any) => {
          console.error('Wake Lock error:', err);
        });
    }
  } catch (error) {
    console.error('Error attempting to wake screen:', error);
  }
};

/**
 * Creates and displays a system notification
 * @param title Notification title
 * @param options Notification options
 */
export const showNotification = (title: string, options: NotificationOptions): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, options);
      
      // Optional: Do something when the notification is clicked
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};