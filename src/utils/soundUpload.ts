import { CustomSound } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maximum file size for uploaded sounds (5MB)
 */
export const MAX_SOUND_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed audio file types
 */
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',  // .mp3
  'audio/wav',   // .wav
  'audio/ogg',   // .ogg
  'audio/x-m4a', // .m4a
  'audio/mp4',   // .mp4 audio
];

/**
 * Validates an audio file for upload
 * @param file The file to validate
 * @returns An object with validation result and error message if any
 */
export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.map(type => type.split('/')[1]).join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_SOUND_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_SOUND_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Converts a File object to a base64 string
 * @param file The file to convert
 * @returns Promise resolving to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Processes an audio file for upload
 * @param file The file to process
 * @returns Promise resolving to a CustomSound object
 */
export const processAudioFile = async (file: File): Promise<CustomSound> => {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Convert file to base64
  const base64Data = await fileToBase64(file);
  
  // Create a custom sound object
  const customSound: CustomSound = {
    id: uuidv4(),
    name: file.name.split('.')[0], // Use filename without extension as display name
    filename: file.name,
    data: base64Data,
  };

  return customSound;
};

/**
 * Saves a custom sound to local storage
 * @param sound The CustomSound object to save
 */
export const saveCustomSound = (sound: CustomSound): void => {
  // Get existing custom sounds
  const existingSounds = getCustomSounds();
  
  // Add new sound
  existingSounds.push({
    id: sound.id,
    name: sound.name,
    filename: sound.filename,
    // Don't store data in local storage, it's stored in IndexedDB
  });
  
  // Save to local storage
  localStorage.setItem('customSounds', JSON.stringify(existingSounds));
  
  // Save sound data to IndexedDB
  if (sound.data) {
    saveSoundToIndexedDB(sound.id, sound.data);
  }
};

/**
 * Gets all custom sounds from local storage
 * @returns Array of CustomSound objects
 */
export const getCustomSounds = (): CustomSound[] => {
  const soundsJson = localStorage.getItem('customSounds');
  return soundsJson ? JSON.parse(soundsJson) : [];
};

/**
 * Deletes a custom sound
 * @param soundId The ID of the sound to delete
 */
export const deleteCustomSound = (soundId: string): void => {
  // Get existing custom sounds
  const existingSounds = getCustomSounds();
  
  // Filter out the sound to delete
  const updatedSounds = existingSounds.filter(sound => sound.id !== soundId);
  
  // Save to local storage
  localStorage.setItem('customSounds', JSON.stringify(updatedSounds));
  
  // Delete from IndexedDB
  deleteSoundFromIndexedDB(soundId);
};

// IndexedDB functions for storing sound data

/**
 * Opens the sounds database
 * @returns Promise resolving to an IDBDatabase
 */
const openSoundsDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotifyITSounds', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sounds')) {
        db.createObjectStore('sounds', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Saves sound data to IndexedDB
 * @param id The sound ID
 * @param data The base64 sound data
 */
export const saveSoundToIndexedDB = async (id: string, data: string): Promise<void> => {
  try {
    const db = await openSoundsDB();
    const transaction = db.transaction(['sounds'], 'readwrite');
    const store = transaction.objectStore('sounds');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id, data });
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error saving sound to IndexedDB:', error);
    throw error;
  }
};

/**
 * Gets sound data from IndexedDB
 * @param id The sound ID
 * @returns Promise resolving to the base64 sound data
 */
export const getSoundFromIndexedDB = async (id: string): Promise<string | null> => {
  try {
    const db = await openSoundsDB();
    const transaction = db.transaction(['sounds'], 'readonly');
    const store = transaction.objectStore('sounds');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result ? result.data : null);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting sound from IndexedDB:', error);
    return null;
  }
};

/**
 * Deletes sound data from IndexedDB
 * @param id The sound ID
 */
export const deleteSoundFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await openSoundsDB();
    const transaction = db.transaction(['sounds'], 'readwrite');
    const store = transaction.objectStore('sounds');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error deleting sound from IndexedDB:', error);
    throw error;
  }
};
