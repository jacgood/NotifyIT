import React, { useState, useEffect } from 'react';
import { unlockAudioOnIOS, preloadDefaultSound } from '../utils/notifications';

interface PermissionsOnboardingProps {
  onComplete: () => void;
}

const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'notifications' | 'audio' | 'complete'>('welcome');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(true);

  // Check existing permissions on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Handle notification permission request
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      setStep('audio');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log('Notification permission:', permission);
      
      // Move to next step regardless of the result
      setStep('audio');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setStep('audio');
    }
  };

  // Handle audio unlock
  const unlockAudio = () => {
    try {
      // Create and play a silent audio element to unlock audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume the audio context if it's suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create a short beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1; // Very quiet
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play for a very short time
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        setAudioUnlocked(true);
        
        // Also call the iOS-specific audio unlock
        unlockAudioOnIOS();
        
        // Preload the default notification sound
        preloadDefaultSound();
        
        // Move to complete step
        setStep('complete');
      }, 100);
      
      console.log('Audio context unlocked successfully');
    } catch (error) {
      console.error('Error unlocking audio:', error);
      // Move to complete step anyway
      setAudioUnlocked(true);
      setStep('complete');
    }
  };

  // Handle completion
  const handleComplete = () => {
    // Save that the user has completed onboarding
    localStorage.setItem('permissionsOnboardingComplete', 'true');
    setShowModal(false);
    
    // Notify parent component
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {step === 'welcome' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to NotifyIT</h2>
            <p className="text-gray-600 mb-6">
              To provide you with the best experience, we need your permission for notifications and audio playback.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setStep('notifications')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </>
        )}

        {step === 'notifications' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enable Notifications</h2>
            <p className="text-gray-600 mb-6">
              NotifyIT needs permission to send you notifications about critical IT alerts.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-700">
                When prompted, please select "Allow" to enable notifications.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={requestNotificationPermission}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                disabled={notificationPermission === 'granted'}
              >
                {notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
              </button>
            </div>
            {notificationPermission && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep('audio')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {notificationPermission === 'granted' ? 'Continue' : 'Skip this step'}
                </button>
              </div>
            )}
          </>
        )}

        {step === 'audio' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enable Audio</h2>
            <p className="text-gray-600 mb-6">
              To hear notification sounds, we need to initialize the audio system on your device.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-700">
                Tap the button below to enable audio playback. This will play a brief, silent sound to unlock your device's audio system.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={unlockAudio}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                disabled={audioUnlocked}
              >
                {audioUnlocked ? 'Audio Enabled' : 'Enable Audio'}
              </button>
            </div>
            {audioUnlocked && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep('complete')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Continue
                </button>
              </div>
            )}
          </>
        )}

        {step === 'complete' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Set!</h2>
            <p className="text-gray-600 mb-6">
              You're all set up to receive critical IT alerts with sound notifications.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleComplete}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionsOnboarding;
