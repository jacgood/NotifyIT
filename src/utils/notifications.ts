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
// Flag to track if we've unlocked audio on iOS
let iOSAudioUnlocked = false;

/**
 * Detect if the device is running iOS
 */
const isIOS = (): boolean => {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || 
  // iPad on iOS 13+ detection
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
};

/**
 * Unlock audio on iOS - must be called from a user interaction event
 */
export const unlockAudioOnIOS = (): void => {
  if (isIOS() && !iOSAudioUnlocked) {
    console.log('Attempting to unlock audio on iOS...');
    // Create a silent audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioContext = new AudioContext();
      // Create an empty buffer
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      // Play the empty sound
      source.start(0);
      console.log('iOS audio unlocked successfully');
      iOSAudioUnlocked = true;
    }
  }
};

/**
 * Checks if a sound file is a custom sound (starts with 'custom:')
 * @param soundFile The sound file to check
 * @returns True if the sound is a custom sound
 */
const isCustomSound = (soundFile: string): boolean => {
  return soundFile.startsWith('custom:');
};

/**
 * Extracts the custom sound ID from a sound file string
 * @param soundFile The sound file string (format: 'custom:soundId')
 * @returns The sound ID
 */
const extractCustomSoundId = (soundFile: string): string => {
  return soundFile.split(':')[1];
};

/**
 * Plays a notification sound at the specified volume
 * @param soundFile The sound file to play (can be a built-in sound or 'custom:soundId')
 * @param volume Volume level (0.0 to 1.0)
 */
// Track if we're in a user interaction context
let isInUserInteractionContext = false;

// Set this flag to true when a user interaction happens
document.addEventListener('click', () => {
  isInUserInteractionContext = true;
  // Reset after a short delay
  setTimeout(() => {
    isInUserInteractionContext = false;
  }, 5000); // Consider user interaction context valid for 5 seconds
});

// Create a preloaded audio element for mobile devices
let preloadedDefaultSound: HTMLAudioElement | null = null;

/**
 * Preload the default notification sound for better mobile playback
 * This should be called early in the application lifecycle, ideally after a user interaction
 */
export const preloadDefaultSound = (): void => {
  try {
    if (!preloadedDefaultSound) {
      const defaultSoundPath = `${window.location.origin}${NOTIFICATION_CONFIG.soundsPath}${NOTIFICATION_CONFIG.defaultSound}`;
      preloadedDefaultSound = new Audio(defaultSoundPath);
      preloadedDefaultSound.load();
      console.log('Default notification sound preloaded');
    }
  } catch (error) {
    console.error('Failed to preload default sound:', error);
  }
};

/**
 * Plays a notification sound at the specified volume
 * @param soundFile The sound file to play (can be a built-in sound or 'custom:soundId')
 * @param volume Volume level (0.0 to 1.0)
 * @param forcePlay Whether to force playback even on mobile devices
 */
export const playNotificationSound = async (soundFile: string, volume: number = 1.0, forcePlay: boolean = false): Promise<void> => {
  try {
    // Try to unlock audio on iOS
    unlockAudioOnIOS();
    
    // Force an audio context resume for mobile devices
    if (isMobileDevice() || forcePlay) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext resumed successfully');
          }
        }
      } catch (err) {
        console.warn('Error resuming AudioContext:', err);
      }
    }
    
    let audio: HTMLAudioElement;
    
    // Check if this is a custom sound
    if (isCustomSound(soundFile)) {
      // Extract the sound ID
      const soundId = extractCustomSoundId(soundFile);
      console.log('Playing custom sound with ID:', soundId);
      
      // Import the getSoundFromIndexedDB function dynamically to avoid circular dependencies
      const { getSoundFromIndexedDB } = await import('./soundUpload');
      
      // Get the sound data from IndexedDB
      const soundData = await getSoundFromIndexedDB(soundId);
      
      if (!soundData) {
        console.error('Custom sound not found in IndexedDB:', soundId);
        // Fall back to default sound
        const defaultSound = NOTIFICATION_CONFIG.defaultSound;
        return playNotificationSound(defaultSound, volume);
      }
      
      // Create audio element from base64 data
      audio = new Audio(soundData);
      console.log('Created audio element from custom sound data');
    } else {
      // This is a built-in sound
      // Always use the current origin to avoid mixed content issues
      const origin = window.location.origin;
      const soundsPath = NOTIFICATION_CONFIG.soundsPath;
      
      // Build the path using the current origin
      let soundPath = `${origin}${soundsPath}${soundFile}`;
      
      // Log the sound path for debugging
      console.log('Using current origin for sound path:', origin);
      console.log('Attempting to play sound from:', soundPath);
      
      // Create a new Audio instance each time to avoid caching issues
      audio = new Audio(soundPath);
    }
    
    // Add event listeners for debugging
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio can play through without buffering');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      console.error('Audio error code:', audio.error?.code);
      console.error('Audio error message:', audio.error?.message);
      
      // Try with a relative path as fallback if not a custom sound
      if (!isCustomSound(soundFile)) {
        tryFallbackAudio(soundFile, volume);
      } else {
        // For custom sounds, fall back to the default sound
        const defaultSound = NOTIFICATION_CONFIG.defaultSound;
        playNotificationSound(defaultSound, volume);
      }
    });
    
    // For iOS, we need to set these attributes
    if (isIOS()) {
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('preload', 'auto');
    }
    
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
          
          if (isIOS()) {
            console.log('iOS detected, trying vibration as fallback');
            // Try to vibrate the device on iOS
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
              console.log('Device vibration triggered');
            }
          }
          
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
  // Don't try fallback for custom sounds
  if (isCustomSound(soundFile)) {
    console.log('Not attempting fallback for custom sound');
    // Generate a beep as last resort
    generateBeep(volume);
    return;
  }
  try {
    console.log('Trying fallback audio with relative path...');
    // Use the current origin with a relative path
    const origin = window.location.origin;
    const relativePath = `${origin}/sounds/${soundFile}`;
    console.log('Fallback audio path:', relativePath);
    
    const fallbackAudio = new Audio(relativePath);
    
    // For iOS, we need to set these attributes
    if (isIOS()) {
      fallbackAudio.setAttribute('playsinline', 'true');
      fallbackAudio.setAttribute('preload', 'auto');
      // Try to unlock audio again
      unlockAudioOnIOS();
    }
    
    fallbackAudio.volume = volume;
    
    const fallbackPromise = fallbackAudio.play();
    if (fallbackPromise !== undefined) {
      fallbackPromise
        .then(() => {
          console.log('Fallback audio playback started successfully');
        })
        .catch(fallbackError => {
          console.error('Fallback audio playback failed:', fallbackError);
          
          // Try vibration on iOS
          if (isIOS() && 'vibrate' in navigator) {
            navigator.vibrate(200);
            console.log('Device vibration triggered as fallback');
          } else {
            // Last resort: try to generate a beep
            generateBeep(volume);
          }
        });
    }
  } catch (error) {
    console.error('Error playing fallback audio:', error);
    
    // Try vibration on iOS
    if (isIOS() && 'vibrate' in navigator) {
      navigator.vibrate(200);
      console.log('Device vibration triggered as fallback');
    } else {
      // Last resort: try to generate a beep
      generateBeep(volume);
    }
  }
};

/**
 * Generate a beep sound as a last resort
 */
const generateBeep = (volume: number): void => {
  try {
    console.log('Generating beep sound as last resort...');
    
    // On iOS, try vibration first as it's more reliable
    if (isIOS() && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // pattern: vibrate, pause, vibrate
      console.log('Using vibration pattern instead of beep on iOS');
      return;
    }
    
    // Create and play a short beep for non-iOS devices
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContext) {
      console.error('AudioContext not supported in this browser');
      return;
    }
    
    // Try to resume the audio context (needed for some browsers)
    const audioContext = new AudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    }
    
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
    
    // Last resort: try vibration if available
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
      console.log('Falling back to simple vibration');
    }
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
 * Detects if the device is running Android
 */
const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * Detects if the device is a mobile device (iOS or Android)
 */
const isMobileDevice = (): boolean => {
  return isIOS() || isAndroid();
};

/**
 * Creates and displays a system notification
 * @param title Notification title
 * @param options Notification options
 * @param soundFile Optional custom sound file to play with the notification
 * @param volume Optional volume level for the sound (0.0 to 1.0)
 */
export const showNotification = async (
  title: string, 
  options: NotificationOptions, 
  soundFile?: string, 
  volume: number = 1.0
): Promise<void> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not supported or permission not granted');
    return;
  }

  try {
    // For mobile devices, we need special handling to avoid duplicate sounds
    if (isMobileDevice()) {
      console.log('Mobile device detected, using custom notification handling');
      
      // Always set silent option to true on mobile to prevent default sound
      const mobileOptions: NotificationOptions = {
        ...options,
        silent: true, // This prevents the default notification sound
        requireInteraction: true, // Keep notification visible until user interacts with it
      };
      
      // Create the notification first (silent)
      let notification = new Notification(title, mobileOptions);
      
      // Then play the sound (this sequence works better on iOS/Android)
      if (soundFile) {
        try {
          console.log(`Playing notification sound on mobile: ${soundFile}`);
          
          // Special handling for iOS
          if (isIOS()) {
            // On iOS, we need to play the sound immediately after a user interaction or notification creation
            // This helps bypass iOS audio restrictions
            
            // If we're in a user interaction context, we can play directly
            if (isInUserInteractionContext) {
              console.log('Playing sound in user interaction context');
              await playNotificationSound(soundFile, volume);
            } else {
              // Otherwise, use the preloaded sound if it's the default sound
              if (soundFile === NOTIFICATION_CONFIG.defaultSound && preloadedDefaultSound) {
                console.log('Using preloaded default sound');
                preloadedDefaultSound.volume = volume;
                await preloadedDefaultSound.play().catch(err => {
                  console.warn('Error playing preloaded sound:', err);
                  // Fallback to regular playback
                  return playNotificationSound(soundFile, volume);
                });
              } else {
                // For custom sounds, try normal playback
                await playNotificationSound(soundFile, volume);
              }
            }
          } else {
            // For Android and other mobile devices
            await playNotificationSound(soundFile, volume);
          }
        } catch (error) {
          console.error('Error playing notification sound on mobile:', error);
          // Try vibration as fallback
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }
      
      // Handle notification click
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
      };
    } else {
      // For desktop browsers, we can use the standard approach
      console.log('Desktop browser detected, using standard notification');
      
      // Create the notification with default behavior
      const notification = new Notification(title, options);
      
      // Handle notification click
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
      };
      
      // If a sound file is provided, play it alongside the notification
      if (soundFile) {
        playNotificationSound(soundFile, volume);
      }
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};