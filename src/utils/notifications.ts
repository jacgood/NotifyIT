import { NOTIFICATION_CONFIG, SERVER_CONFIG } from '../config';

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
    // Always use the current origin to avoid mixed content issues
    const origin = window.location.origin;
    const soundsPath = NOTIFICATION_CONFIG.soundsPath;
    
    // Build the path using the current origin
    let soundPath = `${origin}${soundsPath}${soundFile}`;
    
    // Log the sound path for debugging
    console.log('Using current origin for sound path:', origin);
    
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
      
      // Try with a relative path as fallback
      tryFallbackAudio(soundFile, volume);
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
          
          // Try with a relative path as fallback
          tryFallbackAudio(soundFile, volume);
        });
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Try with a relative path as fallback
    tryFallbackAudio(soundFile, volume);
  }
};

/**
 * Try to play audio with a relative path as fallback
 */
const tryFallbackAudio = (soundFile: string, volume: number): void => {
  try {
    console.log('Trying fallback audio with relative path...');
    // Use the current origin with a relative path
    const origin = window.location.origin;
    const relativePath = `${origin}/sounds/${soundFile}`;
    console.log('Fallback audio path:', relativePath);
    
    const fallbackAudio = new Audio(relativePath);
    fallbackAudio.volume = volume;
    
    const fallbackPromise = fallbackAudio.play();
    if (fallbackPromise !== undefined) {
      fallbackPromise
        .then(() => {
          console.log('Fallback audio playback started successfully');
        })
        .catch(fallbackError => {
          console.error('Fallback audio playback failed:', fallbackError);
          // Last resort: try to generate a beep
          generateBeep(volume);
        });
    }
  } catch (error) {
    console.error('Error playing fallback audio:', error);
    // Last resort: try to generate a beep
    generateBeep(volume);
  }
};

/**
 * Generate a beep sound as a last resort
 */
const generateBeep = (volume: number): void => {
  try {
    console.log('Generating beep sound as last resort...');
    // Create and play a short beep
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContext) {
      console.error('AudioContext not supported in this browser');
      return;
    }
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // frequency in hertz
    gainNode.gain.value = volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      console.log('Beep sound played successfully');
    }, 300); // play for 300ms
  } catch (error) {
    console.error('Failed to generate beep sound:', error);
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