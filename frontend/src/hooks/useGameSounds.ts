import { useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';
import { soundConfig } from '../config/sounds';

export const useGameSounds = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [sounds, setSounds] = useState<Record<string, Howl>>({});

  useEffect(() => {
    // Initialize sounds
    const initializedSounds: Record<string, Howl> = {};
    
    Object.entries(soundConfig).forEach(([key, config]) => {
      initializedSounds[key] = new Howl({
        src: [config.src],
        volume: config.volume * volume,
        rate: config.rate,
        preload: true,
        html5: true,
        onloaderror: (id, error) => {
          console.error(`Failed to load sound ${key}:`, error);
        }
      });
    });

    setSounds(initializedSounds);

    // Cleanup on unmount
    return () => {
      Object.values(initializedSounds).forEach(sound => {
        sound.unload();
      });
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    Object.values(sounds).forEach(sound => {
      sound.volume(volume);
    });
  }, [volume, sounds]);

  // Update mute state
  useEffect(() => {
    Object.values(sounds).forEach(sound => {
      sound.mute(isMuted);
    });
  }, [isMuted, sounds]);

  const playSound = useCallback((soundName: keyof typeof soundConfig) => {
    if (sounds[soundName]) {
      sounds[soundName].play();
    }
  }, [sounds]);

  const stopSound = useCallback((soundName: keyof typeof soundConfig) => {
    if (sounds[soundName]) {
      sounds[soundName].stop();
    }
  }, [sounds]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    playSound,
    stopSound,
    toggleMute,
    changeVolume,
    isMuted,
    volume,
    soundsLoaded: Object.keys(sounds).length > 0
  };
};