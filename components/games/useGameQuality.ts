'use client';

import { useEffect, useState } from 'react';
import { detectQuality, resolveQuality, saveQuality, type Quality, type QualitySettings, settingsFor } from './gameQuality';

// Initialise settings synchronously so consumers never see `null` on first
// render. resolveQuality() is safe to call during SSR (it returns 'low' when
// window is unavailable) and is idempotent, so the useEffect below just
// re-applies the same value after mount.
const INITIAL_LEVEL = resolveQuality();
const INITIAL_SETTINGS = settingsFor(INITIAL_LEVEL);

export function useGameQuality() {
  const [level, setLevel] = useState<Quality>(INITIAL_LEVEL);
  // Never null: seed with a valid default before the effect runs.
  const [settings, setSettings] = useState<QualitySettings>(INITIAL_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const resolved = resolveQuality();
    setLevel(resolved);
    setSettings(settingsFor(resolved));
    setReady(true);
  }, []);

  const setQuality = (next: Quality) => {
    saveQuality(next);
    setLevel(next);
    setSettings(settingsFor(next));
  };

  return {
    level,
    settings,
    ready,
    is3D: ready && (level === 'mid' || level === 'high'),
    isHigh: ready && level === 'high',
    setQuality,
  };
}