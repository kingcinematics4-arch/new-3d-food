// lib/cinematicTimeline.ts
//
// THE SCROLL TIMELINE FOR THE BRAND SEQUENCE
//
// Every visual value in CinematicLogoSequence is produced here, as a pure
// function of scroll progress in [0, 1]. There is no state, no clock and no
// side effect, which is what makes the sequence deterministic: the same scroll
// offset always produces the same frame, scrolling up is the same function
// evaluated at a smaller number rather than a separate reversed animation, and
// stopping halfway leaves the composition parked exactly where the visitor left
// it.
//
// The component only decides WHERE those numbers go. Keeping the arithmetic
// here means it can be evaluated outside React — scripts/check-cinematic.js
// does exactly that to prove the assembled frame is the official artwork.
//
// BEAT DESIGN
// -----------
// Travel windows are staggered so that only one movement dominates at a time,
// which is what keeps the sequence legible instead of everything arriving at
// once. Every window closes before CLOCHE_OPEN begins, so the logo always
// reaches a fully assembled, fully readable state and holds it before the
// cloche is lifted. That hold is the whole point of the piece: the visitor has
// to recognise the finished Dine3D logo before it opens.

import type { LogoLayerId } from './logoLayers';

/* ============================================================
   SCALARS
   ============================================================ */

export const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;

/** Position of `p` inside the window [from, to], clamped to 0-1. */
export const span = (p: number, from: number, to: number): number =>
  clamp01((p - from) / (to - from));

/* ============================================================
   EASING
   Slow and deliberate. Nothing overshoots and nothing bounces: these objects
   are meant to feel heavy, so they decelerate hard and stop rather than
   springing into place.
   ============================================================ */

/** Decelerates hard and settles. The default for a heavy object arriving. */
const easeOutQuint = (t: number): number => 1 - (1 - t) ** 5;

/** Symmetric: leaves slowly, arrives slowly. For a long traverse. */
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Symmetric and steeper, for the final beat where nothing may look abrupt. */
const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) ** 4 / 2;

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/* ============================================================
   THE BEAT MAP
   ============================================================ */

export type MovingId = LogoLayerId | 'food';

export interface Beat {
  /** Scroll progress at which this element starts moving. */
  from: number;
  /** Scroll progress at which it has come to rest. */
  to: number;
  ease: (t: number) => number;
  /**
   * Where the element starts, as a fraction of ITS OWN size. Expressed against
   * the layer rather than the canvas so the travel reads identically whether the
   * composition is rendered 300px or 1200px wide.
   */
  offset: { x: number; y: number };
  /** Starting rotation in degrees, unwound to 0 as it settles. */
  rotate: number;
  /** Starting scale, eased to 1. */
  scale: number;
  /**
   * Portion of its own window spent becoming opaque. Deliberately short, so most
   * of the movement is physical travel rather than a fade — the pieces arrive,
   * they do not dissolve.
   */
  fade: number;
}

export const BEATS: Record<MovingId, Beat> = {
  // The D arrives first, dropping in from above and to the right.
  d: { from: 0.04, to: 0.28, ease: easeOutQuint, offset: { x: 0.16, y: -0.62 }, rotate: 4.5, scale: 0.9, fade: 0.26 },

  // The plate is set into place from the side, turning slightly as it lands.
  dish: { from: 0.19, to: 0.45, ease: easeOutQuint, offset: { x: -0.4, y: 0.26 }, rotate: -8, scale: 0.94, fade: 0.3 },

  // Cloche: the lid of the emblem comes down from above.
  lid: { from: 0.36, to: 0.58, ease: easeInOutCubic, offset: { x: 0.05, y: -0.74 }, rotate: -3, scale: 0.96, fade: 0.3 },

  // Utensil: the longest drop, so the service elements land after the structure
  // is already standing.
  utensil: { from: 0.42, to: 0.64, ease: easeInOutCubic, offset: { x: -0.04, y: -1.05 }, rotate: 2, scale: 0.99, fade: 0.3 },

  // Lettering settles in, then the gold half arrives a touch later so the eye is
  // led left to right across the wordmark.
  typeIne: { from: 0.4, to: 0.62, ease: easeInOutCubic, offset: { x: 0.03, y: -0.82 }, rotate: 1.6, scale: 0.95, fade: 0.3 },
  type3d: { from: 0.48, to: 0.68, ease: easeInOutCubic, offset: { x: 0.06, y: -0.96 }, rotate: 2.4, scale: 0.95, fade: 0.3 },

  // Tagline rises into place underneath and is the last piece to settle.
  tagline: { from: 0.56, to: 0.7, ease: easeOutCubic, offset: { x: 0, y: 0.5 }, rotate: 0, scale: 1, fade: 0.34 },

  // The meal is a reveal rather than an entrance: it settles up out of the plate
  // once the cloche is out of the way.
  food: { from: 0.855, to: 1, ease: easeOutCubic, offset: { x: 0, y: 0.14 }, rotate: 0, scale: 0.82, fade: 0.46 },
};

/** Back to front, so the DOM order also reads as the assembly order. */
export const LAYER_ORDER: MovingId[] = ['dish', 'utensil', 'lid', 'd', 'typeIne', 'type3d', 'tagline', 'food'];

/** Scroll window in which the cloche is lifted and the plate is uncovered. */
export const CLOCHE_OPEN = { from: 0.8, to: 0.94 };

/**
 * The window during which the logo is completely assembled and still closed.
 *
 * Derived rather than hand-written, so retiming a beat cannot silently close the
 * hold: it is whatever falls between the last piece settling and the cloche
 * starting. A non-positive width means the timeline has been mistimed, which
 * `scripts/check-cinematic.js` fails on.
 */
export const ASSEMBLED_WINDOW = {
  from: Math.max(...Object.values(BEATS).filter((b) => b.to <= CLOCHE_OPEN.from).map((b) => b.to)),
  to: CLOCHE_OPEN.from,
};

/* ============================================================
   FRAME VALUES
   Everything the component needs for one progress value.
   ============================================================ */

export interface LayerFrame {
  transform: string;
  opacity: number;
}

/**
 * The transform and opacity of one layer at `progress`.
 *
 * At rest every beat resolves to `remaining === 0`, so the transform becomes an
 * exact identity. That is what lets the layers recompose `dine3d-logo.png` pixel
 * for pixel once they have all arrived.
 */
export function layerFrame(id: MovingId, progress: number): LayerFrame {
  const beat = BEATS[id];
  const p = clamp01(progress);
  const t = beat.ease(span(p, beat.from, beat.to));
  const remaining = 1 - t;

  let x = beat.offset.x * remaining;
  let y = beat.offset.y * remaining;
  let rotate = beat.rotate * remaining;
  let scale = 1 + (beat.scale - 1) * remaining;

  if (id === 'lid') {
    // The reveal. The lid rises and tilts back the way a real cloche is lifted:
    // it is never faded away, it simply stops covering the plate.
    const open = easeInOutQuart(span(p, CLOCHE_OPEN.from, CLOCHE_OPEN.to));
    x += 0.1 * open;
    y += -0.36 * open;
    rotate += -6 * open;
    scale *= 1 + 0.03 * open;
  }

  return {
    transform: `translate3d(${x * 100}%, ${y * 100}%, 0) rotate(${rotate}deg) scale(${scale})`,
    opacity: clamp01(t / beat.fade),
  };
}

/**
 * The slow push-in: the only camera move in the piece. It keeps moving right up
 * to the last frame, so the final composition lands slightly larger than it was
 * assembled.
 */
export const stageScale = (progress: number): number =>
  1 + 0.045 * easeOutCubic(span(clamp01(progress), 0, 1));

/**
 * Ambient key light. Barely present over the empty opening, warming as the logo
 * takes shape, then lifting again for the reveal.
 */
export const ambientOpacity = (progress: number): number => {
  const p = clamp01(progress);
  return (
    0.05 +
    0.16 * easeOutCubic(span(p, 0.03, 0.55)) +
    0.1 * easeOutCubic(span(p, 0.86, 1))
  );
};

export interface GhostFrame {
  opacity: number;
  scale: number;
}

/** The oversized D behind the stage, retiring as the real D arrives. */
export function ghostFrame(progress: number): GhostFrame {
  const p = clamp01(progress);
  const fade = 1 - easeOutCubic(span(p, 0.08, 0.36));
  return { opacity: 0.05 * fade, scale: 1.14 - 0.1 * p };
}

/** Warm light inside the plate, raised only while the meal is uncovered. */
export const wellOpacity = (progress: number): number =>
  0.75 * easeOutCubic(span(clamp01(progress), 0.82, 0.97));

/** The scroll hint retires the instant the visitor acts on it. */
export const hintOpacity = (progress: number): number =>
  1 - easeOutCubic(span(clamp01(progress), 0.004, 0.03));

/* ============================================================
   THE CAPTION
   One quiet word for the beat in progress, the way a film slate names a shot.
   Deliberately tiny and dim: it must never compete with the logo.
   ============================================================ */

const CAPTIONS: Array<{ at: number; text: string }> = [
  { at: 0.04, text: 'The mark' },
  { at: 0.19, text: 'The plate' },
  { at: 0.36, text: 'The cloche' },
  { at: 0.5, text: 'The service' },
  { at: 0.62, text: 'Dine3D' },
  { at: 0.8, text: 'The meal' },
  { at: 0.9, text: 'See it before you order' },
];

export function captionFor(progress: number): string {
  const p = clamp01(progress);
  let text = '';
  for (const entry of CAPTIONS) {
    if (p < entry.at) break;
    text = entry.text;
  }
  return text;
}