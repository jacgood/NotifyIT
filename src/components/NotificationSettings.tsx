import React, { useState, useRef, useEffect } from 'react';
import { NotificationSetting, CustomSound } from '../types';
import { processAudioFile, saveCustomSound, getCustomSounds, deleteCustomSound, ALLOWED_AUDIO_TYPES, MAX_SOUND_FILE_SIZE } from '../utils/soundUpload';

interface NotificationSettingsProps {
  settings: NotificationSetting;
  onSettingsChange: (newSettings: NotificationSetting) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load custom sounds on component mount
  useEffect(() => {
    const loadedSounds = getCustomSounds();
    setCustomSounds(loadedSounds);
    
    // Initialize customSounds in settings if not already set
    if (!settings.customSounds) {
      onSettingsChange({
        ...settings,
        customSounds: []
      });
    }
  }, []);
  const handleToggleNotifications = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      enableNotifications: e.target.checked
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      [name]: value
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      volume: parseInt(e.target.value)
    });
  };

  const handleOverrideSilentMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      overrideSilentMode: e.target.checked
    });
  };

  // Handle file selection for sound upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset status messages
    setUploadError(null);
    setUploadSuccess(null);
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.map(type => type.split('/')[1]).join(', ')}`);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_SOUND_FILE_SIZE) {
      setUploadError(`File is too large. Maximum size is ${MAX_SOUND_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Process the audio file
      const customSound = await processAudioFile(file);
      
      // Save the custom sound
      saveCustomSound(customSound);
      
      // Update the list of custom sounds
      setCustomSounds(prevSounds => [...prevSounds, customSound]);
      
      // Update the settings with the new custom sound
      onSettingsChange({
        ...settings,
        customSounds: [...(settings.customSounds || []), {
          id: customSound.id,
          name: customSound.name,
          filename: customSound.filename
        }]
      });
      
      // Set success message
      setUploadSuccess(`Sound "${customSound.name}" uploaded successfully`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading sound:', error);
      setUploadError(`Error uploading sound: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle deleting a custom sound
  const handleDeleteSound = (soundId: string) => {
    // Delete the sound
    deleteCustomSound(soundId);
    
    // Update the list of custom sounds
    setCustomSounds(prevSounds => prevSounds.filter(sound => sound.id !== soundId));
    
    // Update the settings
    onSettingsChange({
      ...settings,
      customSounds: (settings.customSounds || []).filter(sound => sound.id !== soundId),
      // If the current sound is the one being deleted, switch to the default sound
      customSound: settings.customSound === `custom:${soundId}` ? 
        'bell-notification-337658.mp3' : settings.customSound
    });
    
    // Set success message
    setUploadSuccess('Sound deleted successfully');
  };
  
  // Handle selecting a sound
  const handleSoundSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({
      ...settings,
      customSound: e.target.value
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-md flex-1">
      <h2 className="text-xl font-semibold text-slate-800 mt-0 mb-4">Notification Settings</h2>
      
      <div className="mb-4">
        <div className="flex items-center">
          <div className="relative inline-block w-14 h-7 mr-3">
            <input
              id="enableNotifications"
              type="checkbox"
              className="sr-only"
              checked={settings.enableNotifications}
              onChange={handleToggleNotifications}
            />
            <label 
              htmlFor="enableNotifications"
              className={`block cursor-pointer w-14 h-7 rounded-full transition-colors duration-200 ${settings.enableNotifications ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span 
                className={`absolute left-0.5 top-0.5 block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${settings.enableNotifications ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </label>
          </div>
          <label htmlFor="enableNotifications" className="text-gray-700 cursor-pointer">Enable Notifications</label>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="startTime" className="block mb-2 font-medium text-gray-700">Active Hours Start:</label>
        <input
          type="time"
          id="startTime"
          name="startTime"
          value={settings.startTime}
          onChange={handleInputChange}
          disabled={!settings.enableNotifications}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="endTime" className="block mb-2 font-medium text-gray-700">Active Hours End:</label>
        <input
          type="time"
          id="endTime"
          name="endTime"
          value={settings.endTime}
          onChange={handleInputChange}
          disabled={!settings.enableNotifications}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="volume" className="block mb-2 font-medium text-gray-700">Alert Volume: {settings.volume}%</label>
        <input
          type="range"
          id="volume"
          name="volume"
          min="0"
          max="100"
          value={settings.volume}
          onChange={handleVolumeChange}
          disabled={!settings.enableNotifications}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-1">
          <div className="relative inline-block mr-3">
            <input
              type="checkbox"
              id="overrideSilentMode"
              checked={settings.overrideSilentMode}
              onChange={handleOverrideSilentMode}
              disabled={!settings.enableNotifications}
              className="sr-only"
            />
            <label
              htmlFor="overrideSilentMode"
              className={`flex items-center justify-center w-5 h-5 rounded border ${settings.overrideSilentMode ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'} transition-colors duration-200 cursor-pointer ${!settings.enableNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {settings.overrideSilentMode && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </label>
          </div>
          <label htmlFor="overrideSilentMode" className="text-gray-700 cursor-pointer">Override Silent Mode (when possible)</label>
        </div>
        <p className="text-xs text-gray-500 italic ml-8">Note: This may not work on all devices due to OS restrictions</p>
      </div>

      <div className="mb-4">
        <label htmlFor="customSound" className="block mb-2 font-medium text-gray-700">Alert Sound:</label>
        <select
          id="customSound"
          name="customSound"
          value={settings.customSound}
          onChange={handleSoundSelect}
          disabled={!settings.enableNotifications}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="bell-notification-337658.mp3">Bell Notification (Default)</option>
          {customSounds.map(sound => (
            <option key={sound.id} value={`custom:${sound.id}`}>
              {sound.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Upload Custom Sound:</label>
        <div className="flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/mpeg,audio/wav,audio/ogg,audio/x-m4a,audio/mp4"
            onChange={handleFileSelect}
            disabled={!settings.enableNotifications || isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isUploading && (
            <div className="ml-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="mt-2 text-sm text-green-600">{uploadSuccess}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Accepted formats: MP3, WAV, OGG, M4A. Max size: {MAX_SOUND_FILE_SIZE / (1024 * 1024)}MB
        </p>
      </div>
      
      {customSounds.length > 0 && (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Your Custom Sounds:</label>
          <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded">
            {customSounds.map(sound => (
              <div key={sound.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex-1 truncate">{sound.name}</div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => onSettingsChange({ ...settings, customSound: `custom:${sound.id}` })}
                    disabled={settings.customSound === `custom:${sound.id}` || !settings.enableNotifications}
                    className="text-xs py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {settings.customSound === `custom:${sound.id}` ? 'Selected' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSound(sound.id)}
                    className="text-xs py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;