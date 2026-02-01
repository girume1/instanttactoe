// src/components/SoundPreloader.tsx
import React, { useEffect, useState } from "react";
import { Howl, Howler } from "howler";
import { soundConfig } from "../config/sounds";

interface SoundPreloaderProps {
  onLoadComplete: (loaded: boolean) => void;
}

export const SoundPreloader: React.FC<SoundPreloaderProps> = ({ onLoadComplete }) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalSounds, setTotalSounds] = useState(0);

  useEffect(() => {
    const soundEntries = Object.entries(soundConfig);
    setTotalSounds(soundEntries.length);

    if (soundEntries.length === 0) {
      onLoadComplete(true);
      return;
    }

    // Resume WebAudio on first user interaction (fixes Chrome autoplay blocking)
    const resumeAudio = () => {
      try {
        // Howler stores the AudioContext on Howler.ctx in many versions
        // @ts-ignore
        if (Howler && (Howler as any).ctx && (Howler as any).ctx.state === "suspended") {
          // @ts-ignore
          (Howler as any).ctx.resume()?.catch(() => {});
        }
      } catch {}
    };
    window.addEventListener("pointerdown", resumeAudio, { once: true, passive: true });

    let loaded = 0;
    const sounds: Howl[] = [];

    const timeout = window.setTimeout(() => {
      console.warn("Sound preload timed out; continuing");
      onLoadComplete(true);
      sounds.forEach((s) => s.unload());
    }, 5000);

    const finishIfDone = () => {
      setLoadedCount(loaded);
      if (loaded >= soundEntries.length) {
        window.clearTimeout(timeout);
        onLoadComplete(true);
        sounds.forEach((s) => s.unload());
      }
    };

    soundEntries.forEach(([key, config]) => {
      const sound = new Howl({
        src: [config.src],
        format: ["mp3"],
        volume: 0, // Mute for preloading
        preload: true,
        onload: () => {
          console.info(`Sound loaded: ${key}`);
          loaded += 1;
          finishIfDone();
        },
        onloaderror: (_id: number | string, err: unknown) => {
          console.error(`Failed to preload sound ${key}:`, err);
          loaded += 1;
          finishIfDone();
        },
      });

      sounds.push(sound);
    });

    return () => {
      window.removeEventListener("pointerdown", resumeAudio);
      window.clearTimeout(timeout);
      sounds.forEach((s) => s.unload());
    };
  }, [onLoadComplete]);

  if (totalSounds > 0 && loadedCount < totalSounds) {
    const pct = Math.max(0, Math.min(100, (loadedCount / totalSounds) * 100));
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-lg mb-4">Loading sounds...</div>
          <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
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
