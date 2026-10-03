/**
 * scripts/preview-cinematic.js
 *
 * Renders the brand sequence as ASCII so the composition can be inspected
 * without a browser.
 *
 * For each scroll progress it inverse-maps every layer through the exact
 * transform the component will apply — the same maths as a browser's
 * `translate() rotate() scale()` about a centre origin — and samples the real
 * layer PNGs. So what this prints is the actual artwork at the actual
 * transform, not an artist's impression of it.
 *
 * The one approximation is the revealed meal: it ships as an inline SVG rather
 * than a raster, so it is drawn here as a flat mound. Its real artwork is
 * richer, its position and timing are not.
 *
 * Usage:  node --experimental-strip-types scripts/preview-cinematic.js [progress ...]
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';

import { LOGO_CANVAS, LOGO_FOOD_BOX, LOGO_LAYER_BOXES, LOGO_LAYER_SRC } from '../lib/logoLayers.ts';
import { BEATS, CLOCHE_OPEN, LAYER_ORDER, layerFrame, stageScale, clamp01, span } from '../lib/cinematicTimeline.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));

const CHARS = ' .:-=+*#%@';
const raster = new Map();
for (const id of Object.keys(LOGO_LAYER_SRC)) {
  raster.set(id, PNG.sync.read(read(LOGO_LAYER_SRC[id].replace(/^\//, 'public/'))));
}

/** Degrees to radians. */
const rad = (d) => (d * Math.PI) / 180;

/** Pulls the numeric parts back out of the transform string layerFrame builds. */
function parseTransform(transform) {
  const m = /translate3d\((-?[\d.]+)%, (-?[\d.]+)%.*?rotate\((-?[\d.]+)deg\) scale\(([\d.]+)\)/.exec(transform);
  if (!m) throw new Error(`Unparseable transform: ${transform}`);
  return { tx: parseFloat(m[1]), ty: parseFloat(m[2]), rot: parseFloat(m[3]), scale: parseFloat(m[4]) };
}

/**
 * Samples one layer at a point in canvas space.
 * Returns luminance 0-1, or null when the point is outside the layer.
 */
function sample(id, box, t, canvasX, canvasY) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const tx = (t.tx / 100) * box.w;
  const ty = (t.ty / 100) * box.h;

  // world = C + T + R * S * (L - C)   =>   solve for L
  const dx = canvasX - cx - tx;
  const dy = canvasY - cy - ty;
  const cos = Math.cos(-rad(t.rot));
  const sin = Math.sin(-rad(t.rot));
  const rx = (dx * cos - dy * sin) / t.scale;
  const ry = (dx * sin + dy * cos) / t.scale;

  const lx = cx + rx - box.x;
  const ly = cy + ry - box.y;
  if (lx < 0 || ly < 0 || lx >= box.w || ly >= box.h) return null;

  const img = raster.get(id);
  const i = (Math.floor(ly) * img.width + Math.floor(lx)) * 4;
  if (img.data[i + 3] < 16) return null;
  return (0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2]) / 255;
}

/** The revealed meal, approximated as a low mound sitting inside the plate. */
function sampleFood(canvasX, canvasY, opacity) {
  if (opacity <= 0.01) return null;
  const b = LOGO_FOOD_BOX;
  const nx = (canvasX - (b.x + b.w / 2)) / (b.w * 0.42);
  const ny = (canvasY - (b.y + b.h * 0.62)) / (b.h * 0.34);
  const d = nx * nx + ny * ny;
  if (d > 1) return null;
  return (0.42 + 0.34 * (1 - d)) * opacity;
}

function render(progress, cols = 150) {
  const p = clamp01(progress);
  const push = stageScale(p);
  const rows = Math.max(6, Math.round(((LOGO_CANVAS.height * 2.2) / LOGO_CANVAS.width) * cols));

  const frames = new Map();
  for (const id of LAYER_ORDER) frames.set(id, { t: parseTransform(layerFrame(id, p).transform), o: layerFrame(id, p).opacity });

  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    const canvasY = ((r + 0.5) / rows) * LOGO_CANVAS.height;
    for (let c = 0; c < cols; c++) {
      const canvasX = ((c + 0.5) / cols) * LOGO_CANVAS.width;

      // The stage's slow push-in, applied about the canvas centre.
      const sx = (canvasX - LOGO_CANVAS.width / 2) / push + LOGO_CANVAS.width / 2;
      const sy = (canvasY - LOGO_CANVAS.height / 2) / push + LOGO_CANVAS.height / 2;

      let best = null;
      for (const id of LAYER_ORDER) {
        const f = frames.get(id);
        if (f.o <= 0.01) continue;
        if (id === 'food') {
          const v = sampleFood(sx, sy, f.o);
          if (v !== null) best = Math.max(best ?? 0, v);
          continue;
        }
        const v = sample(id, LOGO_LAYER_BOXES[id], f.t, sx, sy);
        if (v !== null) best = Math.max(best ?? 0, v * f.o);
      }
      line += best === null ? ' ' : CHARS[Math.max(1, Math.min(CHARS.length - 1, Math.round(best * (CHARS.length - 1))))];
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines;
}

const args = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const stops = args.length ? args : [0, 0.08, 0.16, 0.24, 0.32, 0.42, 0.52, 0.62, 0.75, 0.85, 0.93, 1];

console.log(`logo canvas ${LOGO_CANVAS.width}x${LOGO_CANVAS.height}   cloche opens ${CLOCHE_OPEN.from}->${CLOCHE_OPEN.to}`);
for (const stop of stops) {
  const open = span(stop, CLOCHE_OPEN.from, CLOCHE_OPEN.to);
  console.log(
    `\n=== progress ${stop.toFixed(2)}  clocheOpen=${(open * 100).toFixed(0)}%  ` +
      `arrivals: ${LAYER_ORDER.filter((id) => id !== 'food' && stop >= BEATS[id].to).join(',') || '(none yet)'}` +
      `${stop >= BEATS.food.from ? ' +food' : ''}`
  );
  console.log(render(stop).join('\n'));
}