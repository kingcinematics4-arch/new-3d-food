// lib/logoContentBox.ts
//
// FINDING THE REAL LOGO INSIDE A UPLOADED IMAGE
//
// WHY THIS EXISTS
// ---------------
// The owner uploads whatever artwork they have, and real logo files routinely
// ship on a large empty canvas: a square or near-square export with the mark
// floating in the middle, or an opaque JPEG whose "transparent" area is really
// black. The browser cannot know that, so it does the only honest thing it can
// with `object-fit: contain` — it scales the WHOLE file to the logo's height and
// leaves the padding as empty space. A 667x655 export whose mark occupies the
// middle 289x234 renders a navbar logo whose visible gold is 24x19 pixels inside
// a 55x54 box.
//
// THE MEASURED FIX, NOT A GUESSED ONE
// -----------------------------------
// This module finds the bounding box of the logo's actual visible pixels and
// reports it. The presentation layer then shows that box and nothing else, so
// the mark fills the space it was always allotted. Nothing is redrawn, nothing
// is resampled, and the file in Supabase Storage is never touched — this is
// purely about which rectangle of the original we choose to display.
//
// WHAT COUNTS AS "THE LOGO"
// -------------------------
// A pixel belongs to the mark when it is not transparent AND is not
// effectively black. The black test is what makes this work for the JPEG case,
// where padding is opaque and there is no alpha channel to threshold. The
// brand's gold peaks far above the threshold (measured 209-239 across the red
// channel) while JPEG noise in the black surround measures 3-11, so the two
// separate cleanly with room to spare.
//
// The box is inflated by a couple of percent before it is reported, so the mark
// never loses an antialiased edge pixel and the navbar's hover zoom has
// somewhere to go.
//
// FAILURE IS NORMAL, NOT EXCEPTIONAL
// ---------------------------------
// If the file cannot be decoded, or the browser refuses to let us read its
// pixels because the host sends no CORS headers, or there is no Server
// Component at all — this resolves to `null` and every surface falls back to
// the plain uncropped render it uses today. A logo that is merely the wrong
// size is a far better outcome than a page that cannot render one at all.

/** The visible content rectangle, in the source image's own pixels. */
export interface LogoContentBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Brightness above which a pixel is treated as part of the mark.
 *
 * Measured against the shipped logo: the gold sits at 209-239 on its strongest
 * channel, while the black surround measures 3-11. 24 sits in the empty gap
 * between the two, so it survives both JPEG compression noise and a genuine
 * dark edge on the artwork.
 */
const CONTENT_LUMINANCE_THRESHOLD = 24;

/** Alpha at or above which a pixel is treated as opaque. */
const CONTENT_ALPHA_THRESHOLD = 8;

/**
 * Longest edge used for the pixel scan.
 *
 * A 4000px upload would otherwise mean reading 16 million pixels. Scanning a
 * proportionally scaled-down copy finds the same box to within a pixel or two
 * at any size the logo is ever displayed at, for a fraction of the cost. The
 * reported box is scaled back up to the source image's own coordinates.
 */
const SCAN_MAX_EDGE = 1024;

/**
 * How much to grow the detected box, as a fraction of its own size.
 *
 * Two purposes: it keeps antialiased edge pixels from being cropped off, and it
 * gives the navbar's hover scale somewhere to expand into without the mark
 * being clipped by the crop.
 */
const BOX_INFLATION = 0.03;

/**
 * A box this close to the whole image means there is no padding worth removing,
 * so the caller keeps its existing render untouched.
 */
const MIN_CROP_RATIO = 0.96;

/* ============================================================
   CACHE
   The answer only depends on the file, so it is computed once per URL and
   shared by every logo surface on the page — the navbar, the hero, the footer,
   the admin previews and the auth screens all read the same measurement.
   ============================================================ */

const memory = new Map<string, LogoContentBox | null>();
const inFlight = new Map<string, Promise<LogoContentBox | null>>();

/** Survives a reload so the logo is already the right size on first paint. */
const STORAGE_PREFIX = 'd3-logo-box:';

const SESSION_KEYS = new Set<string>();

function readStored(key: string): LogoContentBox | null | undefined {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as LogoContentBox | null;
    return parsed && typeof parsed.width === 'number' ? parsed : null;
  } catch {
    return undefined;
  }
}

function store(key: string, box: LogoContentBox | null) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(box));
    SESSION_KEYS.add(key);
  } catch {
    /* Storage unavailable or full: the in-memory cache still does its job. */
  }
}

/** The already-known box for a URL, or `null` if it has not been measured yet. */
export function peekLogoContentBox(url: string | null | undefined): LogoContentBox | null {
  if (!url) return null;
  if (memory.has(url)) return memory.get(url) ?? null;
  return null;
}

/* ============================================================
   MEASUREMENT
   ============================================================ */

function detectBox(image: HTMLImageElement): LogoContentBox | null {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (naturalWidth < 4 || naturalHeight < 4) return null;

  const longest = Math.max(naturalWidth, naturalHeight);
  const scaleDown = longest > SCAN_MAX_EDGE ? SCAN_MAX_EDGE / longest : 1;
  const scanWidth = Math.max(1, Math.round(naturalWidth * scaleDown));
  const scanHeight = Math.max(1, Math.round(naturalHeight * scaleDown));

  const canvas = document.createElement('canvas');
  canvas.width = scanWidth;
  canvas.height = scanHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, scanWidth, scanHeight);

  let data: Uint8ClampedArray;
  try {
    // Throws if the image was decoded without CORS permission. That is a
    // supported outcome, not a crash: the caller keeps the uncropped render.
    data = context.getImageData(0, 0, scanWidth, scanHeight).data;
  } catch {
    return null;
  }

  let minX = scanWidth;
  let minY = scanHeight;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      const i = (y * scanWidth + x) * 4;
      if (data[i + 3] < CONTENT_ALPHA_THRESHOLD) continue;
      const strongest = data[i] > data[i + 1] ? (data[i] > data[i + 2] ? data[i] : data[i + 2]) : data[i + 1] > data[i + 2] ? data[i + 1] : data[i + 2];
      if (strongest <= CONTENT_LUMINANCE_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;

  // No meaningful padding: leave this asset's rendering exactly as it is.
if (boxWidth >= scanWidth * MIN_CROP_RATIO && boxHeight >= scanHeight * MIN_CROP_RATIO) {
    return null;
  }

  const growX = boxWidth * BOX_INFLATION;
  const growY = boxHeight * BOX_INFLATION;

  const left = Math.max(0, minX - growX);
  const top = Math.max(0, minY - growY);
  const right = Math.min(scanWidth, maxX + 1 + growX);
  const bottom = Math.min(scanHeight, maxY + 1 + growY);

  // Back to the source image's own pixel space, which is what the renderer
  // needs in order to position the untouched file inside the crop window.
  const toNaturalX = naturalWidth / scanWidth;
  const toNaturalY = naturalHeight / scanHeight;

  return {
    x: left * toNaturalX,
    y: top * toNaturalY,
    width: (right - left) * toNaturalX,
    height: (bottom - top) * toNaturalY,
  };
}

/**
 * Measures the visible logo inside `url`, once per URL.
 *
 * Resolves to `null` when there is nothing to crop, or when the file cannot be
 * measured — both of which mean "render it the way we always have".
 */
export function measureLogoContentBox(url: string): Promise<LogoContentBox | null> {
  if (!url) return Promise.resolve(null);
  if (memory.has(url)) return Promise.resolve(memory.get(url) ?? null);

  const existing = inFlight.get(url);
  if (existing) return existing;

  const key = STORAGE_PREFIX + url;
  if (!SESSION_KEYS.has(key)) {
    const stored = readStored(key);
    if (stored !== undefined) {
      memory.set(url, stored);
      return Promise.resolve(stored);
    }
  }

  const task = new Promise<LogoContentBox | null>((resolve) => {
    const probe = new Image();
    // Requests read permission rather than merely permission to display, which
    // is what lets getImageData see the pixels. Served from the same origin as
    // bundled assets and from Supabase's public bucket, which allows it.
    probe.crossOrigin = 'anonymous';
    probe.decoding = 'async';

    const finish = (box: LogoContentBox | null) => {
      probe.onload = null;
      probe.onerror = null;
      memory.set(url, box);
      store(key, box);
      inFlight.delete(url);
      resolve(box);
    };

    probe.onload = () => finish(detectBox(probe));
    probe.onerror = () => finish(null);
    probe.src = url;
  });

  inFlight.set(url, task);
  return task;
}
