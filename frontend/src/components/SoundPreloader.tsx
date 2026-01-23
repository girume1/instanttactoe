import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';
import { soundConfig } from '../config/sounds';

interface SoundPreloaderProps {
  onLoadComplete: (loaded: boolean) => void;
}

export const SoundPreloader: React.FC<SoundPreloaderProps> = ({ onLoadComplete }) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalSounds, setTotalSounds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const soundEntries = Object.entries(soundConfig);
    setTotalSounds(soundEntries.length);
    
    let loaded = 0;
    const sounds: Howl[] = [];

    soundEntries.forEach(([key, config]) => {
      const sound = new Howl({
        src: [config.src],
        volume: 0, // Mute for preloading
        preload: true,
        onload: () => {
          loaded++;
          setLoadedCount(loaded);
          if (loaded === soundEntries.length) {
            onLoadComplete(true);
            // Clean up preloaded sounds
            sounds.forEach(s => s.unload());
          }
        },
        onloaderror: (id, err) => {
          console.warn(`Failed to preload sound ${key}:`, err);
          loaded++;
          setLoadedCount(loaded);
          setError(`Failed to load ${key} sound`);
          
          if (loaded === soundEntries.length) {
            onLoadComplete(true); // Continue even with errors
            sounds.forEach(s => s.unload());
          }
        }
      });
      
      sounds.push(sound);
    });

    return () => {
      sounds.forEach(sound => sound.unload());
    };
  }, [onLoadComplete]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-center p-6 bg-gray-900 rounded-xl">
          <div className="text-yellow-400 mb-2">⚠️ Sound Warning</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => onLoadComplete(true)}
            className="px-4 py-2 bg-gray-800 rounded-lg"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  if (loadedCount < totalSounds) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-lg mb-4">Loading sounds...</div>
          <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${(loadedCount / totalSounds) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {loadedCount} / {totalSounds} sounds loaded
          </div>
        </div>
      </div>
    );
  }

  return null;
};