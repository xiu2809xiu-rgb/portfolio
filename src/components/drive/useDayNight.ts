'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * A running clock for the world, and the palette that follows from it.
 *
 * Time is held in a ref and advanced inside the render loop rather than in React
 * state: the sky changes every frame, and re-rendering the tree sixty times a
 * second to move a colour would cost more than everything else in the scene put
 * together. Components that care read the ref in their own `useFrame`.
 *
 * `t` runs 0 → 1 over one full day. 0 is midnight, 0.25 sunrise, 0.5 noon,
 * 0.75 sunset — the same convention a sundial uses, so the numbers can be
 * reasoned about rather than looked up.
 */

export const DAY_LENGTH_SECONDS = 240;

export interface DayNight {
  /** 0 → 1 across a full cycle. Mutated in place each frame. */
  t: number;
  /** Sun height, -1 (midnight) → 1 (noon). Negative means it has set. */
  elevation: number;
  /** 0 in full dark, 1 in full day, with a soft shoulder at each twilight. */
  daylight: number;
  /** True once the lamps and headlights should be on. */
  lampsOn: boolean;
  /** Set by the scrubber; while non-null the clock holds still. */
  scrub: number | null;
}

interface Keyframe {
  readonly at: number;
  readonly sky: string;
  readonly fog: string;
  readonly sun: string;
  readonly ambient: string;
}

const KEYFRAMES: readonly Keyframe[] = [
  /* t,     sky,       fog,       sun,       ambient  */
  { at: 0.0, sky: '#04060c', fog: '#04060c', sun: '#2a3a6b', ambient: '#16203a' },
  { at: 0.22, sky: '#101a2e', fog: '#12203a', sun: '#4a5b8f', ambient: '#1d2a45' },
  { at: 0.28, sky: '#5b3f52', fog: '#7a5560', sun: '#ff9d5c', ambient: '#4a3a48' },
  { at: 0.34, sky: '#8fb4d9', fog: '#a9c7e2', sun: '#ffd9a8', ambient: '#7b93ad' },
  { at: 0.5, sky: '#9ec9ef', fog: '#bcd8ef', sun: '#fff6e2', ambient: '#a8c0d6' },
  { at: 0.68, sky: '#8bb0d4', fog: '#a8c4dd', sun: '#ffe9c4', ambient: '#8fa8bf' },
  { at: 0.76, sky: '#6b4152', fog: '#8a5a58', sun: '#ff7a45', ambient: '#4d3742' },
  { at: 0.84, sky: '#1a1e33', fog: '#1d2440', sun: '#3d4a7a', ambient: '#222c48' },
  { at: 1.0, sky: '#04060c', fog: '#04060c', sun: '#2a3a6b', ambient: '#16203a' },
];

/** Linear blend between the two keyframes bracketing `t`. */
export function paletteAt(t: number, out: { sky: THREE.Color; fog: THREE.Color; sun: THREE.Color; ambient: THREE.Color }) {
  const wrapped = ((t % 1) + 1) % 1;
  let a = KEYFRAMES[0];
  let b = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i += 1) {
    if (wrapped >= KEYFRAMES[i].at && wrapped <= KEYFRAMES[i + 1].at) {
      a = KEYFRAMES[i];
      b = KEYFRAMES[i + 1];
      break;
    }
  }
  const span = b.at - a.at || 1;
  const k = (wrapped - a.at) / span;

  out.sky.set(a.sky).lerp(TEMP.set(b.sky), k);
  out.fog.set(a.fog).lerp(TEMP.set(b.fog), k);
  out.sun.set(a.sun).lerp(TEMP.set(b.sun), k);
  out.ambient.set(a.ambient).lerp(TEMP.set(b.ambient), k);
}

const TEMP = new THREE.Color();

/**
 * Sun elevation for a given time.
 *
 * A plain sine through the day: -1 at midnight, +1 at noon. Real solar geometry
 * would add a declination term for latitude and season, which would be invisible
 * here and is the kind of accuracy that costs more than it returns.
 */
export const elevationAt = (t: number) => -Math.cos(t * Math.PI * 2);

/** Daylight with soft shoulders, so dawn and dusk are gradual rather than a switch. */
export const daylightAt = (elevation: number) =>
  THREE.MathUtils.clamp((elevation + 0.18) / 0.55, 0, 1);

/** Starts mid-morning, so the first thing a visitor sees is daylight. */
export const START_AT = 0.34;

export function makeClock(): DayNight {
  return {
    t: START_AT,
    elevation: elevationAt(START_AT),
    daylight: daylightAt(elevationAt(START_AT)),
    lampsOn: false,
    scrub: null,
  };
}

/**
 * Takes the clock ref rather than owning it: the HUD lives outside the canvas
 * and needs to read the same object, and the scrubber writes to it.
 */
export function useDayNight(state: React.RefObject<DayNight>) {
  const colours = useMemo(
    () => ({
      sky: new THREE.Color(),
      fog: new THREE.Color(),
      sun: new THREE.Color(),
      ambient: new THREE.Color(),
    }),
    [],
  );

  /*
    Mutates the clock in place, by design: it is read from the render loop and
    from the HUD's own animation frame, neither of which should re-render.
  */
  /* eslint-disable react-hooks/immutability */
  const advance = (delta: number) => {
    const s = state.current;
    if (s.scrub === null) s.t = (s.t + delta / DAY_LENGTH_SECONDS) % 1;
    else s.t = s.scrub;

    s.elevation = elevationAt(s.t);
    s.daylight = daylightAt(s.elevation);
    s.lampsOn = s.daylight < 0.45;
    paletteAt(s.t, colours);
    return s;
  };
  /* eslint-enable react-hooks/immutability */

  return { colours, advance };
}

/** 24-hour clock string, for the HUD. */
export function clockLabel(t: number): string {
  const minutes = Math.floor(((t % 1) + 1) % 1 * 24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
