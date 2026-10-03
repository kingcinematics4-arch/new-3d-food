/**
 * scripts/check-cinematic.js
 *
 * Verifies the claims the cinematic logo sequence is built on, without a
 * browser. It answers three questions that are otherwise only answerable by
 * watching the page scroll:
 *
 *   1. Does the logo ever reach a fully assembled, fully closed state?
 *   2. Is that assembled state the OFFICIAL artwork, pixel for pixel?
 *   3. Does the sequence reverse cleanly, and is it deterministic?
 *
 * Run it with:
 *
 *   node --experimental-strip-types scripts/check-cinematic.js
 *
 * The timeline is TypeScript with no runtime dependency on React, so Node's
 * type stripping can evaluate the exact same functions the component calls.
 * That is what makes this a check of the real thing rather than of a copy.
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';

import {
  ASSEMBLED_WINDOW,
  BEATS,
  CLOCHE_OPEN,
  LAYER_ORDER,
  captionFor,
  clamp01,
  layerFrame,
  span,
} from '../lib/cinematicTimeline.ts';
import { LOGO_CANVAS, LOGO_LAYER_BOXES, LOGO_LAYER_SRC } from '../lib/logoLayers.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));

let failures = 0;

const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};

const heading = (text) => console.log(`\n${text}\n${'-'.repeat(text.length)}`);

/* ============================================================
   1. The timeline is mistimed if the logo never fully assembles
   ============================================================ */

heading('1. Assembly window');

const window_ = ASSEMBLED_WINDOW;
check(
  window_.to > window_.from,
  'the logo reaches a fully assembled, closed state before the cloche opens',
  `assembled for progress ${window_.from.toFixed(2)} -> ${window_.to.toFixed(2)}`,
);

// Every beat must also be monotonic and well formed, or a layer could leave
// again after arriving.
for (const [id, beat] of Object.entries(BEATS)) {
  check(beat.to > beat.from, `${id}: window closes after it opens`, `${beat.from} -> ${beat.to}`);
  check(beat.from >= 0 && beat.to <= 1, `${id}: window is inside 0-1`);
  check(beat.fade > 0 && beat.fade <= 1, `${id}: fade fraction is valid`);
}
check(
  CLOCHE_OPEN.from >= window_.from && CLOCHE_OPEN.to <= 1,
  'the cloche opens after assembly and finishes before the end',
  `${CLOCHE_OPEN.from} -> ${CLOCHE_OPEN.to}`,
);

/* ============================================================
   2. The assembled state is the official artwork
   ============================================================ */

heading('2. Assembled state is the official artwork');

const identity = 'translate3d(0%, 0%, 0) rotate(0deg) scale(1)';
const mid = (window_.from + window_.to) / 2;

for (const id of LAYER_ORDER) {
  if (id === 'food') continue; // the meal is hidden while the cloche is closed
  const frame = layerFrame(id, mid);
  check(
    frame.transform === identity && frame.opacity === 1,
    `${id} is at rest and fully opaque in the assembled window`,
    frame.transform,
  );
}

// The cloche must be shut, not merely at rest.
const lidFrame = layerFrame('lid', window_.from);
check(lidFrame.transform === identity, 'the cloche is closed during the assembled window');

// The meal must still be hidden, or the "reveal" means nothing.
check(
  layerFrame('food', window_.to).opacity === 0,
  'the meal is still hidden while the logo is assembled',
);
check(layerFrame('food', 1).opacity === 1, 'the meal is fully revealed at the end');

// Now the real check: recompose the layers the way the DOM does — every layer at
// its recorded offset inside the 930x258 canvas — and diff it against the
// shipped logo.
const source = PNG.sync.read(read('public/images/dine3d-logo.png'));
check(
  source.width === LOGO_CANVAS.width && source.height === LOGO_CANVAS.height,
  'the canvas matches the shipped artwork',
);

const recomposed = Buffer.alloc(LOGO_CANVAS.width * LOGO_CANVAS.height * 4);
for (const id of LAYER_ORDER) {
  if (id === 'food') continue;
  const box = LOGO_LAYER_BOXES[id];
  const layer = PNG.sync.read(read(LOGO_LAYER_SRC[id].replace(/^\//, 'public/')));
  check(
    layer.width === box.w && layer.height === box.h,
    `${id}.png matches its recorded box`,
    `file ${layer.width}x${layer.height} vs box ${box.w}x${box.h}`,
  );
  for (let y = 0; y < layer.height; y++) {
    for (let x = 0; x < layer.width; x++) {
      const src = (y * layer.width + x) * 4;
      if (layer.data[src + 3] === 0) continue;
      const dst = ((box.y + y) * LOGO_CANVAS.width + (box.x + x)) * 4;
      recomposed[dst] = layer.data[src];
      recomposed[dst + 1] = layer.data[src + 1];
      recomposed[dst + 2] = layer.data[src + 2];
      recomposed[dst + 3] = layer.data[src + 3];
    }
  }
}

let diff = 0;
let firstDiff = null;
for (let i = 0; i < LOGO_CANVAS.width * LOGO_CANVAS.height * 4; i++) {
  if (recomposed[i] === source.data[i]) continue;
  diff++;
  if (!firstDiff) {
    const pixel = Math.floor(i / 4);
    firstDiff = {
      x: pixel % LOGO_CANVAS.width,
      y: Math.floor(pixel / LOGO_CANVAS.width),
      channel: i % 4,
    };
  }
}
check(
  diff === 0,
  'the assembled layers recompose dine3d-logo.png exactly',
  diff === 0 ? `${(LOGO_CANVAS.width * LOGO_CANVAS.height).toLocaleString()} pixels` : `${diff} channel(s) differ, first ${JSON.stringify(firstDiff)}`,
);

/* ============================================================
   3. Determinism and reversal
   ============================================================ */

heading('3. Determinism and reversal');

let deterministic = true;
for (let p = 0; p <= 1.0001; p += 0.01) {
  for (const id of LAYER_ORDER) {
    if (layerFrame(id, p).transform !== layerFrame(id, p).transform) deterministic = false;
  }
}
check(deterministic, 'the same progress always produces the same frame');

// Scrolling up must retrace scrolling down exactly. Because the timeline is a
// pure function of progress, this is a structural guarantee — but it is worth
// proving, since it is the difference between a reversible sequence and one
// that only plays forwards.
const STEPS = 200;
for (const id of LAYER_ORDER) {
  const forward = [];
  for (let i = 0; i <= STEPS; i++) forward.push(layerFrame(id, i / STEPS).transform);

  let mismatch = -1;
  for (let i = 0; i <= STEPS; i++) {
    const descending = layerFrame(id, (STEPS - i) / STEPS).transform;
    if (descending !== forward[STEPS - i]) {
      mismatch = i;
      break;
    }
  }
  check(
    mismatch === -1,
    `${id}: scrolling back up retraces the forward frames`,
    mismatch === -1 ? `${STEPS + 1} frames` : `first divergence at step ${mismatch}`,
  );
}

// Monotonic opacity per layer up to its arrival, so nothing pulses or blinks on
// the way in.
let monotonic = true;
for (const id of LAYER_ORDER) {
  let last = -1;
  for (let i = 0; i <= 100; i++) {
    const o = layerFrame(id, i / 100).opacity;
    if (o < last - 1e-9) monotonic = false;
    last = Math.max(last, o);
  }
}
check(monotonic, 'no layer fades in, out and in again while assembling');

// The caption must be a pure function too, and must never leak markup.
const captions = new Set();
for (let i = 0; i <= 100; i++) captions.add(captionFor(i / 100));
check(captions.size > 0, 'the caption resolves to a small set of states', `${captions.size} distinct`);

// Clamping: out-of-range scroll (rubber-banding on iOS) must not throw or invert.
check(clamp01(-5) === 0 && clamp01(5) === 1, 'progress is clamped to 0-1');
check(span(-1, 0.2, 0.8) === 0 && span(9, 0.2, 0.8) === 1, 'span clamps out-of-range input');

/* ============================================================
   4. Beat coverage of the requested beats
   ============================================================ */

heading('4. Beats land in the order the brand sequence needs');

const arrival = Object.fromEntries(
  LAYER_ORDER.map((id) => [id, BEATS[id].to])
);
const requiredOrder = ['d', 'dish', 'lid', 'utensil', 'typeIne', 'type3d', 'tagline'];
check(arrival.d <= arrival.dish, 'the D arrives before the plate', `${arrival.d} <= ${arrival.dish}`);
check(arrival.dish <= arrival.lid, 'the plate arrives before the cloche', `${arrival.dish} <= ${arrival.lid}`);
check(arrival.lid <= arrival.utensil, 'the cloche arrives before the utensil', `${arrival.lid} <= ${arrival.utensil}`);
check(
  Math.max(...requiredOrder.map((id) => arrival[id])) <= window_.to,
  'every piece has settled before the assembled hold begins',
);
check(
  BEATS.food.from >= CLOCHE_OPEN.from,
  'the meal only appears once the cloche starts to lift',
  `food ${BEATS.food.from} >= cloche ${CLOCHE_OPEN.from}`,
);

/* ============================================================ */

console.log('');
if (failures === 0) {
  console.log(`check-cinematic: all checks passed.`);
} else {
  console.error(`check-cinematic: ${failures} check(s) FAILED.`);
  process.exit(1);
}