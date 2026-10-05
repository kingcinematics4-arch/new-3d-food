'use client';

// components/site/vadaPav/assets.ts
//
// Everything the hero's Vada Pav is built from: the procedural PBR maps and the
// geometry helpers.
//
// WHY PROCEDURAL TEXTURES
// -----------------------
// A convincing bread crumb, a blistered fried batter and a glazed ceramic are all
// about surface *behaviour* — how rough, how far light scatters, how deep the
// small pits are — not about a photograph. Generating them from noise costs a few
// milliseconds of idle time and no network at all, where the equivalent
// downloaded maps would be several megabytes on the landing page's critical
// path.
//
// Everything is generated deterministically from a fixed seed, so the hero looks
// identical on every visit and on every device.

import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ============================================================
   NOISE
   Deterministic, tileable value noise. Tileable matters: these maps
   repeat across the bread and the batter, and a visible seam where
   the pattern restarts reads immediately as plastic.
   ============================================================ */

function hash2i(x: number, y: number, seed: number): number {
  const h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  const m = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((m ^ (m >>> 16)) >>> 0) / 4294967295;
}

function hash3i(x: number, y: number, z: number, seed: number): number {
  const h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(z | 0, 2147483647) ^
    Math.imul(seed | 0, 1442695041);
  const m = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((m ^ (m >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Squared ramp, used to carve pits and blisters out of a height field. */
const punch = (v: number, lo: number, hi: number) => {
  const t = clamp01((v - lo) / (hi - lo));
  return t * t;
};

function noise2(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = (n: number) => ((n % period) + period) % period;
  const x0 = w(xi);
  const y0 = w(yi);
  const x1 = w(xi + 1);
  const y1 = w(yi + 1);
  const a = hash2i(x0, y0, seed);
  const b = hash2i(x1, y0, seed);
  const c = hash2i(x0, y1, seed);
  const d = hash2i(x1, y1, seed);
  return mix(mix(a, b, u), mix(c, d, u), v);
}

function noise3(x: number, y: number, z: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const m = (n: number) => ((n % period) + period) % period;
  const x0 = m(xi);
  const y0 = m(yi);
  const z0 = m(zi);
  const x1 = m(xi + 1);
  const y1 = m(yi + 1);
  const z1 = m(zi + 1);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c00 = lerp(hash3i(x0, y0, z0, seed), hash3i(x1, y0, z0, seed), u);
  const c10 = lerp(hash3i(x0, y1, z0, seed), hash3i(x1, y1, z0, seed), u);
  const c01 = lerp(hash3i(x0, y0, z1, seed), hash3i(x1, y0, z1, seed), u);
  const c11 = lerp(hash3i(x0, y1, z1, seed), hash3i(x1, y1, z1, seed), u);
  return lerp(lerp(c00, c10, v), lerp(c01, c11, v), v);
}

/** Fractal sum over 2D. `u`/`v` are normalised 0-1; `base` is the lowest frequency. */
function fbm2(u: number, v: number, octaves: number, base: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = base;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(u * p, v * p, p, seed + o * 977);
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

function fbm3(x: number, y: number, z: number, octaves: number, base: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = base;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise3(x * p, y * p, z * p, p, seed + o * 613);
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

/* ============================================================
   SURFACE MAP GENERATION
   One pass over the pixels writes colour, roughness and a height field; the
   normal map is then derived from that height by a Sobel filter, which is what
   keeps the lighting and the texture agreeing with each other instead of
   fighting.
   ============================================================ */

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

interface Fill {
  r: number;
  g: number;
  b: number;
  rough: number;
  h: number;
}

function canvasOf(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return [canvas, ctx];
}

function colorTexture(canvas: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function dataTexture(canvas: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds the three maps for one surface.
 *
 * `fill` is called once per pixel with normalised u/v and writes straight into
 * `out`. `normalStrength` scales the derived normal, which is the difference
 * between a surface that looks embossed and one that looks sculpted.
 */
export function buildSurface(
  size: number,
  fill: (u: number, v: number, out: Fill) => void,
  normalStrength: number,
  repeat: number
): SurfaceMaps {
  const height = new Float32Array(size * size);
  const out: Fill = { r: 0, g: 0, b: 0, rough: 0, h: 0 };

  const [colorCanvas, colorCtx] = canvasOf(size);
  const colorData = colorCtx.createImageData(size, size);

  const [roughCanvas, roughCtx] = canvasOf(size);
  const roughData = roughCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      fill(u, v, out);

      const i = (y * size + x) * 4;
      colorData.data[i] = clamp01(out.r) * 255;
      colorData.data[i + 1] = clamp01(out.g) * 255;
      colorData.data[i + 2] = clamp01(out.b) * 255;
      colorData.data[i + 3] = 255;

      // three reads roughness from the green channel; writing all three keeps
      // the map legible if it is ever opened in an image editor.
      const rough = clamp01(out.rough) * 255;
      roughData.data[i] = rough;
      roughData.data[i + 1] = rough;
      roughData.data[i + 2] = rough;
      roughData.data[i + 3] = 255;

      height[y * size + x] = out.h;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  const [normalCanvas, normalCtx] = canvasOf(size);
  const normalData = normalCtx.createImageData(size, size);
  const at = (x: number, y: number) => height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      let nx = dx * normalStrength;
      let ny = dy * normalStrength;
      const len = Math.hypot(nx, ny, 1);
      nx /= len;
      ny /= len;

      const i = (y * size + x) * 4;
      normalData.data[i] = (nx * 0.5 + 0.5) * 255;
      normalData.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      normalData.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      normalData.data[i + 3] = 255;
    }
  }

  normalCtx.putImageData(normalData, 0, 0);

  return {
    map: colorTexture(colorCanvas, repeat),
    normalMap: dataTexture(normalCanvas, repeat),
    roughnessMap: dataTexture(roughCanvas, repeat),
  };
}

/* ============================================================
   THE MATERIAL RECIPES
   ============================================================ */

/**
 * The pav: a soft Indian bread roll.
 *
 * Pale beige, low saturation, matte. Real Mumbai pav is not a golden
 * hamburger-bun colour — it is the washed-out beige of an atta-floured white
 * roll that has been baked just enough to brown, and the toasted patches are
 * only a shade or two darker than the rest. The contrast here is deliberately
 * low: bread is a quiet surface, and a busy crust map would pull attention off
 * the vada, which is the point of the shot.
 */
function breadCrustMaps(): SurfaceMaps {
  return buildSurface(
    512,
    (u, v, out) => {
      const mottle = fbm2(u, v, 4, 4, 17);
      const fine = fbm2(u, v, 3, 26, 53);
      // Broad, soft toasted patches rather than hard speckle.
      const toast = punch(fbm2(u, v, 3, 2, 91), 0.58, 0.94);
      // Bread pores: small, round, clustered rather than evenly scattered.
      const pore = punch(fbm2(u, v, 2, 34, 131) * 0.55 + fbm2(u, v, 2, 72, 149) * 0.45, 0.66, 0.82);

      const tone = clamp01(mottle * 0.6 + fine * 0.4);
      // #C9AE8C -> #E4D2B6 — a narrow, desaturated beige range.
      let r = mix(0.788, 0.894, tone);
      let g = mix(0.682, 0.824, tone);
      let b = mix(0.549, 0.714, tone);
      // Toasting, kept gentle: a shade darker, not a fried brown.
      r = mix(r, r * 0.88, toast);
      g = mix(g, g * 0.85, toast);
      b = mix(b, b * 0.79, toast);
      r = mix(r, 0.5, pore * 0.6);
      g = mix(g, 0.42, pore * 0.6);
      b = mix(b, 0.33, pore * 0.6);

      out.r = r;
      out.g = g;
      out.b = b;
      // Uniformly matte. A real roll has no sheen at all, and any gloss here
      // immediately reads as a glazed pastry.
      out.rough = clamp01(0.9 - tone * 0.06 + pore * 0.06 + toast * 0.03);
      out.h = clamp01(mottle * 0.42 + fine * 0.22 + pore * 0.5 - toast * 0.1);
    },
    2.4,
    3
  );
}

/** The cut face: pale, aerated, matte, with open pockets. */
function breadCrumbMap(): THREE.CanvasTexture {
  const out: Fill = { r: 0, g: 0, b: 0, rough: 0, h: 0 };
  return buildSurface(
    256,
    (u, v, fill) => {
      const mottle = fbm2(u, v, 3, 6, 211);
      const pocket = punch(fbm2(u, v, 2, 30, 233), 0.6, 0.78);
      const tone = clamp01(mottle * 0.7 + 0.3);
      fill.r = mix(0.898, 0.949, tone) - pocket * 0.16;
      fill.g = mix(0.816, 0.882, tone) - pocket * 0.16;
      fill.b = mix(0.678, 0.769, tone) - pocket * 0.17;
      fill.rough = 0.94;
      fill.h = tone - pocket * 0.6;
    },
    1.4,
    1
  ).map;
}

/**
 * The vada: deep-fried gram-flour batter.
 *
 * Built around contrast, because at hero distance the texture is the only thing
 * saying "deep-fried" — the silhouette alone just says "disc". Two ridged fields
 * at different scales give the crumpled batter surface; hard near-black blisters
 * are the scorched speckling; pale matte flour patches sit between them so the
 * whole thing is not one flat brown.
 */
function vadaFryMaps(): SurfaceMaps {
  return buildSurface(
    512,
    (u, v, out) => {
      const ridge = 1 - Math.abs(fbm2(u, v, 4, 7, 307) * 2 - 1);
      const ridge2 = 1 - Math.abs(fbm2(u, v, 3, 23, 331) * 2 - 1);
      const big = fbm2(u, v, 3, 3, 347);

      const blister = punch(fbm2(u, v, 2, 30, 353), 0.52, 0.72);
      const scorch = punch(fbm2(u, v, 2, 41, 367), 0.6, 0.78);
      const flour = punch(fbm2(u, v, 2, 15, 379), 0.62, 0.86);
      const speck = punch(fbm2(u, v, 2, 96, 389), 0.68, 0.86);

      const tone = clamp01(ridge * 0.42 + ridge2 * 0.32 + big * 0.26);
      // #8A4E15 -> #E8B863
      let r = mix(0.541, 0.91, tone);
      let g = mix(0.306, 0.722, tone);
      let b = mix(0.082, 0.388, tone);

      // Flour: lighter and desaturated, not just brighter.
      r = mix(r, 0.886, flour * 0.62);
      g = mix(g, 0.769, flour * 0.62);
      b = mix(b, 0.576, flour * 0.62);

      r = mix(r, 0.412, blister * 0.85);
      g = mix(g, 0.212, blister * 0.85);
      b = mix(b, 0.082, blister * 0.85);
      r = mix(r, 0.239, scorch * 0.8);
      g = mix(g, 0.114, scorch * 0.8);
      b = mix(b, 0.039, scorch * 0.8);
      r = mix(r, 0.286, speck * 0.55);
      g = mix(g, 0.145, speck * 0.55);
      b = mix(b, 0.055, speck * 0.55);

      out.r = r;
      out.g = g;
      out.b = b;
      out.rough = clamp01(0.9 - ridge * 0.13 - ridge2 * 0.09 + flour * 0.06 + blister * 0.05);
      out.h = clamp01(ridge * 0.44 + ridge2 * 0.32 + big * 0.12 - blister * 0.22 - speck * 0.26 + flour * 0.06);
    },
    4.2,
    3
  );
}

/** Glazed ceramic: almost smooth, with faint orange-peel in the roughness. */
function ceramicRoughnessMap(): THREE.CanvasTexture {
  return buildSurface(
    128,
    (u, v, out) => {
      const peel = fbm2(u, v, 2, 5, 401);
      out.rough = 0.1 + peel * 0.11;
      out.h = peel;
    },
    0.5,
    1
  ).roughnessMap;
}

/**
 * Chutney: a near-white speckle tinted per material, so the same texture serves
 * both the green and the dry garlic without doubling the download.
 */
function chutneySpeckleMap(): THREE.CanvasTexture {
  return buildSurface(
    128,
    (u, v, out) => {
      const herb = fbm2(u, v, 3, 9, 457);
      const flake = punch(fbm2(u, v, 2, 40, 463), 0.55, 0.8);
      const tone = clamp01(herb * 0.7 + flake * 0.3);
      out.r = mix(0.55, 1.05, tone);
      out.g = mix(0.52, 1.0, tone);
      out.b = mix(0.46, 0.92, tone);
      out.rough = 0.62;
      out.h = tone;
    },
    1.2,
    1
  ).map;
}

/** Fried green chilli: blistered skin over a taut, waxy surface. */
function chilliMaps(): SurfaceMaps {
  return buildSurface(
    256,
    (u, v, out) => {
      const mottle = fbm2(u, v, 3, 5, 601);
      const blister = punch(fbm2(u, v, 2, 14, 617), 0.56, 0.8);
      const wrinkle = punch(fbm2(u, v, 2, 30, 631), 0.62, 0.82);

      const tone = clamp01(mottle * 0.7 + 0.3);
      // #3E6B22 -> #86B247
      let r = mix(0.243, 0.525, tone);
      let g = mix(0.42, 0.698, tone);
      let b = mix(0.133, 0.278, tone);
      r = mix(r, 0.239, blister * 0.75);
      g = mix(g, 0.286, blister * 0.75);
      b = mix(b, 0.145, blister * 0.75);
      r = mix(r, 0.35, wrinkle * 0.35);
      g = mix(g, 0.44, wrinkle * 0.35);
      b = mix(b, 0.2, wrinkle * 0.35);

      out.r = r;
      out.g = g;
      out.b = b;
      out.rough = clamp01(0.52 - tone * 0.2 + blister * 0.28 + wrinkle * 0.12);
      out.h = clamp01(mottle * 0.35 - blister * 0.3 - wrinkle * 0.25);
    },
    2.2,
    2
  );
}

/* ============================================================
   ASSET ASSEMBLY
   Generated off the critical path, one surface per idle slot, so the hero paints
   and becomes interactive immediately and simply sharpens a frame or two later.
   ============================================================ */

export interface VadaPavTextures {
  breadCrust?: SurfaceMaps;
  breadCrumb?: THREE.CanvasTexture;
  vadaFry?: SurfaceMaps;
  ceramicRoughness?: THREE.CanvasTexture;
  chutneySpeckle?: THREE.CanvasTexture;
  chilli?: SurfaceMaps;
}

function disposeAll(sets: VadaPavTextures[]) {
  for (const set of sets) {
    for (const value of Object.values(set)) {
      const group = value as SurfaceMaps | THREE.CanvasTexture | undefined;
      if (!group) continue;
      if ('normalMap' in group) {
        group.map?.dispose();
        group.normalMap?.dispose();
        group.roughnessMap?.dispose();
      } else {
        group.dispose?.();
      }
    }
  }
}

export function useVadaPavTextures(): VadaPavTextures {
  const [textures, setTextures] = useState<VadaPavTextures>({});
  const created = useRef<VadaPavTextures[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Ordered by how much they matter to the read: crust first, then the fried
    // vada, then everything else.
    const jobs: Array<[keyof VadaPavTextures, () => SurfaceMaps | THREE.CanvasTexture]> = [
      ['breadCrust', breadCrustMaps],
      ['vadaFry', vadaFryMaps],
      ['chilli', chilliMaps],
      ['breadCrumb', breadCrumbMap],
      ['ceramicRoughness', ceramicRoughnessMap],
      ['chutneySpeckle', chutneySpeckleMap],
    ];

    let index = 0;
    const schedule = (fn: () => void) => {
      const idle = (window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (idle) idle(fn, { timeout: 600 });
      else window.setTimeout(fn, 24);
    };

    const step = () => {
      if (cancelled || index >= jobs.length) return;
      const [key, build] = jobs[index++];
      const value = build();
      if (cancelled) {
        if ('normalMap' in value) {
          (value as SurfaceMaps).map.dispose();
          (value as SurfaceMaps).normalMap.dispose();
          (value as SurfaceMaps).roughnessMap.dispose();
        } else {
          (value as CanvasTextureLike).dispose();
        }
        return;
      }
      created.current.push({ [key]: value } as VadaPavTextures);
      setTextures((prev) => ({ ...prev, [key]: value } as VadaPavTextures));
      schedule(step);
    };

    schedule(step);

    return () => {
      cancelled = true;
      disposeAll(created.current);
      created.current = [];
    };
  }, []);

  return textures;
}

type CanvasTextureLike = THREE.CanvasTexture;

/* ============================================================
   GEOMETRY HELPERS
   ============================================================ */

/**
 * Pushes every vertex along its own normal by a low-frequency noise field.
 *
 * This is the only displacement used on the food. Everything is deliberately
 * gentle: a few millimetres of handmade irregularity, which is all that is
 * wanted. Anything stronger starts producing spikes and thorns, which read as
 * sci-fi rather than as bread.
 */
export function soften(
  geometry: THREE.BufferGeometry,
  amplitude: number,
  frequency: number,
  seed: number
) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const normal = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const n = fbm3(x * frequency, y * frequency, z * frequency, 3, 1, seed) - 0.5;
    let dx = 0;
    let dy = 0;
    let dz = 0;
    if (normal) {
      dx = normal.getX(i);
      dy = normal.getY(i);
      dz = normal.getZ(i);
    } else {
      const len = Math.hypot(x, y, z) || 1;
      dx = x / len;
      dy = y / len;
      dz = z / len;
    }
    position.setXYZ(i, x + dx * n * amplitude, y + dy * n * amplitude, z + dz * n * amplitude);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Rounds the corners of a shape in plan, so it is a soft-cornered square rather
 * than a perfect circle.
 *
 * A surface of revolution is always circular, and a circle is a hamburger bun. A
 * real pav is proofed dough that gets pressed, so its plan is a soft-cornered
 * square with a slightly oblong footprint. Every vertex is pushed out along the
 * superellipse of its own angle; `squareness` is the exponent, where 2 is exactly
 * circular and about 2.8 is as square as a pav ever really gets.
 */
export function roundToSquare(
  geometry: THREE.BufferGeometry,
  squareness: number,
  xScale: number,
  zScale: number
) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    // The poles of a lathe have no direction, so the centres of the faces are
    // left alone.
    if (Math.hypot(x, z) < 1e-5) continue;
    const theta = Math.atan2(z, x);
    const c = Math.abs(Math.cos(theta));
    const s = Math.abs(Math.sin(theta));
    const grow = 1 / Math.pow(Math.pow(c, squareness) + Math.pow(s, squareness), 1 / squareness);
    position.setXYZ(i, x * grow * xScale, position.getY(i), z * grow * zScale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Sweeps a circle of varying radius along a curve — a tube that can taper to a
 * point, which is the only way to get a chilli rather than a sausage.
 */
export function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  tubularSegments = 48,
  radialSegments = 10
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    N.copy(frames.normals[i]);
    B.copy(frames.binormals[i]);
    const r = radiusAt(t);

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = -Math.cos(angle);
      normal.set(
        cos * N.x + sin * B.x,
        // Chillies are flattened, not perfectly round.
        (cos * N.y + sin * B.y) * 0.82,
        cos * N.z + sin * B.z
      );
      normal.normalize();

      positions.push(P.x + r * normal.x, P.y + r * normal.y, P.z + r * normal.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(t, j / radialSegments);
    }
  }

  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1);
      const b = (radialSegments + 1) * i + (j - 1);
      const c = (radialSegments + 1) * i + j;
      const d = (radialSegments + 1) * (i - 1) + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  const cap = (ringStart: number, flip: boolean) => {
    const centreIndex = positions.length / 3;
    curve.getPointAt(flip ? 1 : 0, P);
    positions.push(P.x, P.y, P.z);
    normals.push(0, flip ? -1 : 1, 0);
    uvs.push(flip ? 1 : 0, 0.5);
    for (let j = 0; j < radialSegments; j++) {
      const a = ringStart + j;
      const b = ringStart + j + 1;
      if (flip) indices.push(centreIndex, a, b);
      else indices.push(centreIndex, b, a);
    }
  };
  cap(0, false);
  cap((radialSegments + 1) * (tubularSegments + 1) - (radialSegments + 1), true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* ============================================================
   THE OPTIONAL HAND-MODELLED GLB
   Drop a real, sculpted Vada Pav at the path below and the hero will use it
   instead of the generated one, with no code change. The plate and the chilli
   stay part of the scene either way.
   ============================================================ */

export const VADA_PAV_GLB_PATH = '/assets/models/vada-pav.glb';

export type GlbAvailability = 'checking' | 'present' | 'absent';

/**
 * A single HEAD request, cached for the lifetime of the tab.
 *
 * Checking before mounting matters: `useGLTF` throws on a missing file, and a
 * throw during render would cost an error boundary and a console warning on
 * every single landing page view for an asset that is usually not there.
 */
export function useOptionalGlb(path: string): GlbAvailability {
  const [state, setState] = useState<GlbAvailability>('checking');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(path, { method: 'HEAD', signal: controller.signal })
      .then((res) => {
        if (!cancelled) setState(res.ok ? 'present' : 'absent');
      })
      .catch(() => {
        if (!cancelled) setState('absent');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path]);

  return state;
}
