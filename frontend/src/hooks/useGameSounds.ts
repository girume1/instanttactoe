// src/hooks/useGameSounds.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { Howl } from "howler";
import { soundConfig } from "../config/sounds";

type SoundKey = keyof typeof soundConfig;
type SoundMap = Record<string, Howl>;

export const useGameSounds = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [sounds, setSounds] = useState<SoundMap>({});

  // Keep a stable list of entries
  const entries = useMemo(() => Object.entries(soundConfig) as [SoundKey, (typeof soundConfig)[SoundKey]][], []);

  useEffect(() => {
    const initialized: SoundMap = {};

    entries.forEach(([key, config]) => {
      initialized[key] = new Howl({
        src: [config.src],
        rate: config.rate,
        preload: true,
        html5: true,
        // start with correct settings
        volume: config.volume * masterVolume,
        mute: isMuted,
        onloaderror: (_id: number | string, err: unknown) => {
          console.error(`Failed to load sound ${String(key)}:`, err);
        },
      });
    });

    setSounds(initialized);

    return () => {
      Object.values(initialized).forEach((s) => s.unload());
    };
    // ✅ include deps because we use them in initialization
  }, [entries, masterVolume, isMuted]);

  // Update volume while preserving per-sound scaling
  useEffect(() => {
    entries.forEach(([key, config]) => {
      const sound = sounds[key as string];
      if (sound) sound.volume(config.volume * masterVolume);
    });
  }, [entries, masterVolume, sounds]);

  // Update mute state
  useEffect(() => {
    Object.values(sounds).forEach((sound) => sound.mute(isMuted));
  }, [isMuted, sounds]);

  const playSound = useCallback(
    (soundName: SoundKey) => {
      const s = sounds[soundName as string];
      if (s) s.play();
    },
    [sounds]
  );

  const stopSound = useCallback(
    (soundName: SoundKey) => {
      const s = sounds[soundName as string];
      if (s) s.stop();
    },
    [sounds]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    setMasterVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    playSound,
    stopSound,
    toggleMute,
    changeVolume,
    isMuted,
    volume: masterVolume,
    soundsLoaded: Object.keys(sounds).length > 0,
  };
};
