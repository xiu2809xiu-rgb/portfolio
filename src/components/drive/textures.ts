'use client';

import * as THREE from 'three';

/**
 * Surface textures for the driving world, drawn at runtime.
 *
 * Nothing here is downloaded. A grass or tarmac texture worth having is a few
 * hundred KB as a file, and this world needs several — which is a real cost on a
 * page that exists as a detour. Generating them on a canvas costs a few
 * milliseconds once, at a size nobody can tell from a photograph at 45kph.
 *
 * Every texture is built to tile: the noise wraps in both axes, so a plane 160m
 * across repeats without a visible seam or a repeating blotch.
 *
 * Textures are cached at module scope. They are immutable once built and shared
 * by every mesh that asks, so a component re-render never rebuilds one.
 */

/* ── Noise ────────────────────────────────────────────────────────────────
   Value noise on a wrapping lattice. Not simplex: this needs to tile exactly,
   and a lattice whose corners wrap gives that for free, which is the whole
   requirement here. Smoothstep interpolation keeps it from looking blocky. */

function hash(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise at (x, y) on a lattice of `period` cells, wrapping at the edge. */
function noise2(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  /* The modulo is what makes it tile: the lattice wraps, so the last cell
     interpolates back into the first. */
  const wrap = (n: number) => ((n % period) + period) % period;
  const x0 = wrap(xi);
  const y0 = wrap(yi);
  const x1 = wrap(xi + 1);
  const y1 = wrap(yi + 1);

  const u = smooth(xf);
  const v = smooth(yf);

  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);

  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/**
 * Several octaves of `noise2`, each finer and fainter than the last.
 *
 * `x` and `y` are UVs in 0..1. Multiplying them by the period is the whole
 * point: it is what spreads `period` lattice cells across the texture. (Scaling
 * them back down again — which the first version did — leaves every pixel inside
 * a single cell, so the result is a smooth gradient with no detail at all and
 * normal maps that come out perfectly flat.)
 */
function fbm(x: number, y: number, octaves: number, basePeriod: number, seed: number): number {
  let value = 0;
  let amplitude = 1;
  let total = 0;
  let period = basePeriod;

  for (let o = 0; o < octaves; o += 1) {
    value += noise2(x * period, y * period, period, seed + o * 101) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    period *= 2;
  }
  return value / total;
}

/* ── Canvas plumbing ──────────────────────────────────────────────────── */

function surface(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeat: number, srgb: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  /*
    Albedo is authored in sRGB and must be tagged as such or three will treat the
    bytes as linear and the whole world comes out washed out. Data maps — normals,
    roughness — are not colour and must stay untagged, or they get gamma applied
    to numbers that are not brightness.
  */
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Derives a tangent-space normal map from a height field by Sobel.
 *
 * Cheaper than authoring normals directly and guaranteed to agree with the
 * albedo, because both come from the same noise — which is what stops the lit
 * detail from sliding against the painted detail.
 */
function normalFromHeight(height: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(size);
  const image = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      /* Normalise (dx, dy, 1/strength) into the 0..255 range a normal map uses. */
      let nx = dx * strength;
      let ny = dy * strength;
      const nz = 1;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length;
      ny /= length;

      const i = (y * size + x) * 4;
      image.data[i] = (nx * 0.5 + 0.5) * 255;
      image.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      image.data[i + 2] = (nz / length) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

/* ── Grass ────────────────────────────────────────────────────────────── */

function buildGrass(size = 512): SurfaceMaps {
  const { canvas, ctx } = surface(size);
  const image = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const rough = surface(size);
  const roughImage = rough.ctx.createImageData(size, size);

  /*
    Two scales of variation doing different jobs: a broad one that makes large
    patches read as different growth, and a fine one for blade-level detail. A
    single scale is what makes procedural grass look like carpet.
  */
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const broad = fbm(x / size, y / size, 4, 8, 11);
      const fine = fbm(x / size, y / size, 3, 64, 27);
      const blades = fbm(x / size, y / size, 2, 96, 53);

      const mix = broad * 0.62 + fine * 0.26 + blades * 0.12;

      /* Dry, yellower grass in the thin patches; deeper green where it is lush. */
      const r = 52 + mix * 62 + blades * 26;
      const g = 92 + mix * 74 + fine * 22;
      const b = 40 + mix * 34;

      const i = (y * size + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;

      height[y * size + x] = blades * 0.7 + fine * 0.3;

      /* Lush grass scatters more; dry patches are slightly glossier. */
      const roughness = 218 - mix * 34;
      roughImage.data[i] = roughness;
      roughImage.data[i + 1] = roughness;
      roughImage.data[i + 2] = roughness;
      roughImage.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  rough.ctx.putImageData(roughImage, 0, 0);

  return {
    map: toTexture(canvas, 42, true),
    normalMap: toTexture(normalFromHeight(height, size, 1.1), 42, false),
    roughnessMap: toTexture(rough.canvas, 42, false),
  };
}

/* ── Tarmac ───────────────────────────────────────────────────────────── */

function buildTarmac(size = 512): SurfaceMaps {
  const { canvas, ctx } = surface(size);
  const image = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const rough = surface(size);
  const roughImage = rough.ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      /* Aggregate: high-frequency speckle is most of what makes asphalt asphalt. */
      const grit = fbm(x / size, y / size, 2, 120, 71);
      const patch = fbm(x / size, y / size, 4, 6, 89);
      const wear = fbm(x / size, y / size, 3, 24, 97);

      const base = 38 + patch * 20 + grit * 30 - wear * 6;

      const i = (y * size + x) * 4;
      image.data[i] = base;
      image.data[i + 1] = base + 1;
      image.data[i + 2] = base + 4; /* asphalt reads very slightly blue */
      image.data[i + 3] = 255;

      height[y * size + x] = grit;

      /* Polished where traffic runs, coarse at the edges. */
      const roughness = 150 + grit * 70 + patch * 30;
      roughImage.data[i] = roughness;
      roughImage.data[i + 1] = roughness;
      roughImage.data[i + 2] = roughness;
      roughImage.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  rough.ctx.putImageData(roughImage, 0, 0);

  return {
    map: toTexture(canvas, 26, true),
    normalMap: toTexture(normalFromHeight(height, size, 0.8), 26, false),
    roughnessMap: toTexture(rough.canvas, 26, false),
  };
}

/* ── Cache ────────────────────────────────────────────────────────────── */

let grassCache: SurfaceMaps | null = null;
let tarmacCache: SurfaceMaps | null = null;

export function grassMaps(): SurfaceMaps {
  if (!grassCache) grassCache = buildGrass();
  return grassCache;
}

export function tarmacMaps(): SurfaceMaps {
  if (!tarmacCache) tarmacCache = buildTarmac();
  return tarmacCache;
}
