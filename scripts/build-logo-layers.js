/**
 * scripts/build-logo-layers.js
 *
 * Splits the supplied Dine3D logo into the separate transparent layers the
 * cinematic scroll sequence animates.
 *
 * WHY THIS EXISTS
 * ---------------
 * The shipped logo is a single flattened PNG. Animating it as one object would
 * be a cross-fade, so the artwork has to be separated. Rather than redrawing
 * anything, this script partitions the ORIGINAL pixels into disjoint layers.
 *
 * NOTHING IS REDRAWN, REROUTED OR RESAMPLED. Every output pixel is a verbatim
 * copy of a source pixel; only the crop and the layer membership change.
 *
 * THE PARTITION IS EXACT AND VERIFIED
 * ----------------------------------
 * The layers are defined as a mutually exclusive, exhaustive cover of their
 * source regions, so at rest they recompose into the original file pixel for
 * pixel. `verify()` below recomposes every layer and compares the result to the
 * source RGBA buffer; the build fails if a single channel differs anywhere.
 *
 * LAYERS
 * ------
 *   d          the capital D of the wordmark
 *   type-ine   "ine"
 *   type-3d    "3D"
 *   tagline    the small tagline row under the wordmark
 *   dish       lower half of the emblem: the plate the food is served on
 *   lid        upper half of the emblem: the serving cloche that lifts off
 *   utensil    the vertical fork/knife bar running through the emblem
 *
 * USAGE
 * -----
 *   node scripts/build-logo-layers.js
 *
 * Requires `pngjs`. It ships transitively with this project's dependencies; if
 * it ever stops being present, install it explicitly:
 *
 *   npm i -D pngjs
 */

'use strict';

const fs = require('fs');
const path = require('path');

let PNG;
try {
  ({ PNG } = require('pngjs'));
} catch {
  console.error(
    'pngjs is required to build the logo layers.\n' +
      'Install it with:  npm i -D pngjs'
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Source
 * ------------------------------------------------------------------ */

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'images', 'dine3d-logo.png');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'logo-layers');

const png = PNG.sync.read(fs.readFileSync(SOURCE));
const W = png.width;
const H = png.height;

/**
 * A pixel counts as artwork when it carries any opacity at all.
 *
 * The threshold is deliberately zero rather than a "visible alpha" cut. The
 * faintest antialiasing fringe around the letterforms has an alpha in the
 * single digits, and dropping it would shave a halo off every layer and leave
 * the recomposed logo measurably different from the source.
 */
const ALPHA_MIN = 1;

/**
 * Every region below was measured from the shipped artwork by connected
 * component analysis and per-row ink-span analysis, not guessed. Each is a
 * closed box in source pixel coordinates.
 */
const GEOMETRY = {
  canvas: { x0: 0, y0: 0, x1: W - 1, y1: H - 1 },

  /** Capital D: x 261-398, y 54-192. Champagne. */
  d: { x0: 261, y0: 54, x1: 398, y1: 192 },

  /** "ine" (including the dot of the i): x 410-671, y 55-194. Champagne. */
  typeIne: { x0: 410, y0: 55, x1: 671, y1: 194 },

  /** "3D": x 685-923, y 51-195. Gold. */
  type3d: { x0: 685, y0: 51, x1: 923, y1: 195 },

  /** Tagline row: x 262-920, y 230-251. */
  tagline: { x0: 262, y0: 230, x1: 920, y1: 251 },

  /** Whole emblem: x 5-209, y 5-251. */
  emblem: { x0: 5, y0: 5, x1: 209, y1: 251 },

  /** The vertical utensil bar: x 105-110, the full height of the emblem. */
  utensilBar: { x0: 105, x1: 110 },

  /** Seam between the plate and the cloche lid: the emblem's vertical centre. */
  lidSeamY: 128,
};

/** Region -> the layer(s) that may own it. Used to catch a mis-typed box. */
const REGION_OWNERS = ['d', 'typeIne', 'type3d', 'tagline', 'emblem'];

/* ------------------------------------------------------------------ *
 * Layer membership
 * ------------------------------------------------------------------ */

const inBox = (x, y, b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

/**
 * Returns the layer id that owns a pixel, or null when the pixel is empty
 * canvas or falls outside every region.
 *
 * The emblem is split three ways:
 *   - the utensil bar column range belongs to `utensil`
 *   - above the seam belongs to `lid`
 *   - below the seam belongs to `dish`
 * The seam test is `y < seam` so the two halves never share a row.
 */
function ownerOf(x, y) {
  if (inBox(x, y, GEOMETRY.d)) return 'd';
  if (inBox(x, y, GEOMETRY.typeIne)) return 'typeIne';
  if (inBox(x, y, GEOMETRY.type3d)) return 'type3d';
  if (inBox(x, y, GEOMETRY.tagline)) return 'tagline';

  if (inBox(x, y, GEOMETRY.emblem)) {
    const bar = GEOMETRY.utensilBar;
    if (x >= bar.x0 && x <= bar.x1) return 'utensil';
    return y < GEOMETRY.lidSeamY ? 'lid' : 'dish';
  }

  return null;
}

/* ------------------------------------------------------------------ *
 * Render the layers
 * ------------------------------------------------------------------ */

const LAYER_IDS = ['d', 'typeIne', 'type3d', 'tagline', 'dish', 'lid', 'utensil'];

/** layerId -> { minX, minY, maxX, maxY }, filled in by the pass below. */
const layers = new Map(
  LAYER_IDS.map((id) => [
    id,
    { minX: undefined, minY: undefined, maxX: undefined, maxY: undefined },
  ])
);

// First pass: work out the tight bounding box of every layer so the crops carry
// no dead margin.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (png.data[i + 3] < ALPHA_MIN) continue;
    const id = ownerOf(x, y);
    if (!id) continue;
    const layer = layers.get(id);
    if (!layer) continue;
    if (!layer.minX || x < layer.minX) layer.minX = x;
    if (!layer.maxX || x > layer.maxX) layer.maxX = x;
    if (!layer.minY || y < layer.minY) layer.minY = y;
    if (!layer.maxY || y > layer.maxY) layer.maxY = y;
  }
}

// Second pass: copy the source pixels of each layer into its own crop.
const results = [];
for (const id of LAYER_IDS) {
  const bounds = layers.get(id);
  if (!bounds || bounds.minX === undefined) {
    console.error(`Layer "${id}" matched no pixels. The source artwork may have changed.`);
    process.exit(1);
  }

  const w = bounds.maxX - bounds.minX + 1;
  const h = bounds.maxY - bounds.minY + 1;
  const out = new PNG({ width: w, height: h });

  let copied = 0;
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const src = (y * W + x) * 4;
      if (png.data[src + 3] < ALPHA_MIN) continue;
      if (ownerOf(x, y) !== id) continue;
      const dst = ((y - bounds.minY) * w + (x - bounds.minX)) * 4;
      out.data[dst] = png.data[src];
      out.data[dst + 1] = png.data[src + 1];
      out.data[dst + 2] = png.data[src + 2];
      out.data[dst + 3] = png.data[src + 3];
      copied++;
    }
  }

  const file = path.join(OUT_DIR, `${id}.png`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(out, { colorType: 6 }));

  const layer = layers.get(id);
  layer.pixels = out.data;
  layer.width = w;
  layer.height = h;

  results.push({
    id,
    file: `public/images/logo-layers/${id}.png`,
    box: { x: bounds.minX, y: bounds.minY, w, h },
    pixels: copied,
    bytes: fs.statSync(file).size,
  });
}

/* ------------------------------------------------------------------ *
 * Verify the partition recomposes the original exactly
 * ------------------------------------------------------------------ */

function verify() {
  // Recompose: every generated layer is blitted back onto a blank canvas at the
  // offset it was cut from, then compared against the source. Anything the
  // partition dropped, duplicated or misassigned shows up here.
  const canvas = Buffer.alloc(W * H * 4);

  for (const id of LAYER_IDS) {
    const layer = layers.get(id);
    const { minX, minY, width, height, pixels } = layer;
    for (let ly = 0; ly < height; ly++) {
      for (let lx = 0; lx < width; lx++) {
        const src = (ly * width + lx) * 4;
        if (pixels[src + 3] < ALPHA_MIN) continue;
        const x = minX + lx;
        const y = minY + ly;
        const dst = (y * W + x) * 4;
        canvas[dst] = pixels[src];
        canvas[dst + 1] = pixels[src + 1];
        canvas[dst + 2] = pixels[src + 2];
        canvas[dst + 3] = pixels[src + 3];
      }
    }
  }

  let mismatch = 0;
  let firstBad = null;

  for (let i = 0; i < W * H; i++) {
    for (let ch = 0; ch < 4; ch++) {
      if (canvas[i * 4 + ch] === png.data[i * 4 + ch]) continue;
      mismatch++;
      if (!firstBad) {
        const x = i % W;
        const y = (i / W) | 0;
        firstBad = {
          x,
          y,
          channel: ch,
          source: png.data[i * 4 + ch],
          recomposed: canvas[i * 4 + ch],
        };
      }
    }
  }
  return { mismatch, firstBad };
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log(`source        ${path.relative(ROOT, SOURCE)}  ${W}x${H}`);
console.log('');

// Sanity: the declared regions must not overlap, otherwise a pixel could be
// claimed by two layers and the cover would stop being a partition.
for (let i = 0; i < REGION_OWNERS.length; i++) {
  for (let j = i + 1; j < REGION_OWNERS.length; j++) {
    const a = GEOMETRY[REGION_OWNERS[i]];
    const b = GEOMETRY[REGION_OWNERS[j]];
    const overlap =
      a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1;
    if (overlap) {
      console.error(`Region overlap: ${REGION_OWNERS[i]} and ${REGION_OWNERS[j]}`);
      process.exit(1);
    }
  }
}

console.log('layer    file                                    box (x,y,w,h)          pixels   KB');
for (const r of results) {
  console.log(
    r.id.padEnd(8) +
      r.file.replace('public/images/logo-layers/', '').padEnd(38) +
      `(${r.box.x},${r.box.y},${r.box.w},${r.box.h})`.padEnd(22) +
      String(r.pixels).padStart(7) +
      (r.bytes / 1024).toFixed(1).padStart(7)
  );
}

const { mismatch, firstBad } = verify();
console.log('');
if (mismatch === 0) {
  console.log('verify: PASS - the layers recompose the source artwork pixel for pixel.');
} else {
  console.error(`verify: FAIL - ${mismatch} pixel(s) differ. First: ${JSON.stringify(firstBad)}`);
  process.exit(1);
}

console.log('');
console.log('// Paste into lib/logoLayers.ts');
console.log('export const LOGO_LAYER_BOXES = {');
for (const r of results) {
  console.log(`  ${r.id}: { x: ${r.box.x}, y: ${r.box.y}, w: ${r.box.w}, h: ${r.box.h} },`);
}
console.log('} as const;');