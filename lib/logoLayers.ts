// lib/logoLayers.ts
//
// Geometry for the cinematic logo sequence.
//
// WHY THIS FILE EXISTS
// --------------------
// `public/images/dine3d-logo.png` is a single flattened file, so the logo
// cannot be assembled from separate objects without first being decomposed.
// `scripts/build-logo-layers.js` does that decomposition: it partitions the
// ORIGINAL pixels into seven disjoint layers and writes them to
// `public/images/logo-layers/`. No pixel is redrawn, resampled or recoloured,
// and the build refuses to emit anything it cannot recompose into the source
// byte for byte.
//
// The logo therefore has exactly one source of truth — the supplied artwork —
// and this file only records WHERE each layer sat inside it.
//
// THE COORDINATE SYSTEM
// ---------------------
// Every box is expressed in the source artwork's own pixel space
// (930 x 258). The animation positions the layers as percentages of that
// canvas, so the whole composition scales to any viewport without the geometry
// ever being recomputed and without the artwork ever being resampled in a way
// that could change its proportions.
//
// Because the layers are an exact partition, rendering all of them at their
// recorded offsets with no transform reproduces `dine3d-logo.png` exactly.
// That is the invariant the assembled state of the animation relies on.

import type { CSSProperties } from 'react';

/** Real dimensions of `public/images/dine3d-logo.png`. */
export const LOGO_CANVAS = { width: 930, height: 258 } as const;

export type LogoLayerId = 'd' | 'typeIne' | 'type3d' | 'tagline' | 'dish' | 'lid' | 'utensil';

/** A layer's position and size, in source artwork pixels. */
export interface LogoLayerBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LOGO_LAYER_BOXES: Record<LogoLayerId, LogoLayerBox> = {
  /** The capital D. Enters first: it is the primary structural element. */
  d: { x: 261, y: 54, w: 138, h: 139 },
  /** "ine" in champagne, including the dot of the i. */
  typeIne: { x: 410, y: 55, w: 262, h: 140 },
  /** "3D" in gold. Arrives last of the lettering. */
  type3d: { x: 685, y: 51, w: 239, h: 145 },
  /** The small tagline row beneath the wordmark. */
  tagline: { x: 262, y: 230, w: 659, h: 22 },
  /** Lower half of the emblem: the plate the meal is served on. */
  dish: { x: 5, y: 128, w: 205, h: 123 },
  /** Upper half of the emblem: the serving cloche that lifts off. */
  lid: { x: 5, y: 7, w: 205, h: 121 },
  /** The vertical utensil running through the emblem. */
  utensil: { x: 105, y: 5, w: 6, h: 247 },
};

export const LOGO_LAYER_SRC: Record<LogoLayerId, string> = {
  d: '/images/logo-layers/d.png',
  typeIne: '/images/logo-layers/typeIne.png',
  type3d: '/images/logo-layers/type3d.png',
  tagline: '/images/logo-layers/tagline.png',
  dish: '/images/logo-layers/dish.png',
  lid: '/images/logo-layers/lid.png',
  utensil: '/images/logo-layers/utensil.png',
};

/**
 * Where the revealed dish sits inside the emblem, in source artwork pixels.
 *
 * The emblem is centred on x 107.5 and its horizontal seam — where the cloche
 * meets the plate — is y 128. This box is centred just above that seam so the
 * meal mounds up out of the plate rather than sitting flat on it, and it stays
 * well inside the plate's own footprint at x 5-209.
 */
export const LOGO_FOOD_BOX: LogoLayerBox = { x: 26, y: 84, w: 164, h: 86 };

/**
 * Positions a layer inside a canvas that is itself sized as
 * `LOGO_CANVAS.width / LOGO_CANVAS.height`.
 *
 * Percentages rather than pixels is what lets the identical composition hold
 * its proportions on a 27" monitor and on a phone: the browser only ever
 * multiplies, so the artwork is never stretched or squashed.
 */
export function layerBoxStyle(box: LogoLayerBox): CSSProperties {
  return {
    left: `${(box.x / LOGO_CANVAS.width) * 100}%`,
    top: `${(box.y / LOGO_CANVAS.height) * 100}%`,
    width: `${(box.w / LOGO_CANVAS.width) * 100}%`,
    height: `${(box.h / LOGO_CANVAS.height) * 100}%`,
  };
}