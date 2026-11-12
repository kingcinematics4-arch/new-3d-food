'use client';

import { useEffect, useState } from 'react';
import { detectQuality, resolveQuality, saveQuality, type Quality, type QualitySettings, settingsFor } from './gameQuality';

export function useGameQuality() {
  const [level, setLevel] = useState<Quality>('high');
  const [settings, setSettings] = useState<QualitySettings | null>(null);
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
    settings: settings!,
    ready,
    is3D: ready && (level === 'mid' || level === 'high'),
    isHigh: ready && level === 'high',
    setQuality,
  };
}