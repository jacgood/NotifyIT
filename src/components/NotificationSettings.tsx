import React from 'react';
import { NotificationSetting } from '../types';

interface NotificationSettingsProps {
  settings: NotificationSetting;
  onSettingsChange: (newSettings: NotificationSetting) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
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
                className={`block h-5 w-5 mt-1 ml-1 rounded-full bg-white transition-transform duration-200 ${settings.enableNotifications ? 'transform translate-x-7' : ''}`}
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
          <input
            type="checkbox"
            id="overrideSilentMode"
            checked={settings.overrideSilentMode}
            onChange={handleOverrideSilentMode}
            disabled={!settings.enableNotifications}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2 disabled:opacity-50"
          />
          <label htmlFor="overrideSilentMode" className="text-gray-700">Override Silent Mode (when possible)</label>
        </div>
        <p className="text-xs text-gray-500 italic">Note: This may not work on all devices due to OS restrictions</p>
      </div>

      <div className="mb-4">
        <label htmlFor="customSound" className="block mb-2 font-medium text-gray-700">Alert Sound:</label>
        <select
          id="customSound"
          name="customSound"
          value={settings.customSound}
          onChange={handleInputChange}
          disabled={!settings.enableNotifications}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="bell-notification-337658.mp3">Bell Notification</option>
        </select>
      </div>
    </div>
  );
};

export default NotificationSettings;