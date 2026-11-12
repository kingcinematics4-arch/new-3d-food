// Shared graphics-quality engine for DinePixel games.
// Detects real device capability (not just user-agent) and exposes a small,
// stable settings object every renderer can consume. Users can override the
// level from the settings panel; the override is persisted in localStorage.

export type Quality = 'low' | 'mid' | 'high';

export interface QualitySettings {
  level: Quality;
  // Rendering
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
  // Visual density
  particles: number;      // multiplier over base particle budget
  backgroundEffects: number;
  extraDetail: boolean;
  // Canvas fallback tuning
  canvasDetail: number;   // 0..1 render-scale for 2D fallbacks
  envResolution: number;  // drei Environment resolution
  // Motion
  maxFrameMs: number;     // clamp dt to keep pacing stable on weak devices
}

const STORAGE_KEY = 'dinepixel_graphics_quality';

const PROFILES: Record<Quality, Omit<QualitySettings, 'level'>> = {
  low: {
    dpr: [1, 1.25],
    antialias: false,
    shadows: false,
    particles: 0.35,
    backgroundEffects: 0.3,
    extraDetail: false,
    canvasDetail: 0.85,
    envResolution: 16,
    maxFrameMs: 50,
  },
  mid: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    particles: 0.75,
    backgroundEffects: 0.7,
    extraDetail: true,
    canvasDetail: 1,
    envResolution: 32,
    maxFrameMs: 33,
  },
  high: {
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    particles: 1.4,
    backgroundEffects: 1,
    extraDetail: true,
    canvasDetail: 1,
    envResolution: 64,
    maxFrameMs: 16,
  },
};

export function settingsFor(level: Quality): QualitySettings {
  return { level, ...PROFILES[level] };
}

// ---- Device capability probe ---------------------------------------------

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'low';
  try {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) return 'low';

    const nav: any = navigator || {};
    const cores = nav.hardwareConcurrency || 4;
    const mem = nav.deviceMemory as number | undefined;
    const isTouch = 'ontouchstart' in window || nav.maxTouchPoints > 0;
    const smallScreen = window.innerWidth < 360 || window.innerHeight < 560;

    // Quick WebGL / GLSL probe — falls back gracefully when unavailable.
    let glOk = false;
    let glslOk = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        glOk = true;
        const ext = gl.getExtension('EXT_blend_minmax') || gl.getExtension('OES_standard_derivatives');
        glslOk = !!ext;
      }
    } catch { /* ignore */ }

    if (!glOk) return 'low';
    if (!glslOk) return 'low';

    // Heuristics tuned for low-end Android (e.g. Snapdragon 4-series, 2-3 GB RAM).
    if (mem && mem <= 2) return 'low';
    if (cores <= 2) return 'low';
    if (cores <= 4 && (isTouch || smallScreen)) return 'low';
    if (cores <= 6 && mem && mem <= 3) return 'mid';
    if (cores >= 8 && (!mem || mem >= 4)) return 'high';
    return 'mid';
  } catch {
    return 'low';
  }
}

// ---- Persistent preference -----------------------------------------------

export function getSavedQuality(): Quality | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'low' || v === 'mid' || v === 'high') return v;
  } catch { /* ignore */ }
  return null;
}

export function saveQuality(level: Quality) {
  try { localStorage.setItem(STORAGE_KEY, level); } catch { /* ignore */ }
}

export function resolveQuality(): Quality {
  return getSavedQuality() ?? detectQuality();
}