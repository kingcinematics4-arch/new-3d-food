export type Quality = 'high' | 'low';

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'low';
  try {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const mem = (navigator as any).deviceMemory as number | undefined;
    const cores = navigator.hardwareConcurrency || 4;
    const small = window.innerWidth < 360;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'low';
    if (reduce) return 'low';
    if (mem && mem <= 2) return 'low';
    if (cores && cores <= 2) return 'low';
    if (cores <= 4 && small) return 'low';
    return 'high';
  } catch {
    return 'low';
  }
}
