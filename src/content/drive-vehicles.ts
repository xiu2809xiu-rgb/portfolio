/**
 * The cars, as data.
 *
 * Bodywork, handling and engine note all live here. What does NOT live here is
 * the suspension model: spring rates, wheel positions, the friction circle and
 * the centre of mass are shared by every car in Car.tsx, so no choice made below
 * can make one of them roll over or fall through the road. The tuning factors
 * are deliberately narrow multipliers on top of that one known-good baseline
 * rather than free parameters.
 *
 * Measurements are half-extents in metres, in the car's own space: +Z is the
 * nose, +Y is up. The physics chassis is 0.78 × 0.30 × 1.70, and the hulls below
 * are deliberately a little larger — the collider sits well inside the bodywork,
 * which is what stops the car looking like it is hovering.
 */

export interface Box {
  /** Half-extents. */
  readonly w: number;
  readonly h: number;
  readonly l: number;
  /** Centre offset from the chassis origin. */
  readonly y: number;
  readonly z: number;
}

/**
 * Handling, as multipliers on the shared baseline.
 *
 * The spread is intentionally narrow — roughly ±15%. A portfolio detour is not
 * a driving sim, and the point of the slow one is that it feels different, not
 * that it feels bad: every car here still pulls away briskly and stops when
 * asked. The van is the floor, and the van is fine.
 */
export interface Tune {
  /** Engine force. How hard it pulls away. */
  readonly accel: number;
  /** Top speed, applied as the inverse of aerodynamic drag. */
  readonly topSpeed: number;
  /** Brake force. */
  readonly braking: number;
  /** Maximum steering angle. */
  readonly agility: number;
}

/** One harmonic of the engine note. */
export interface Partial {
  readonly ratio: number;
  readonly gain: number;
  readonly type: OscillatorType;
  /** Cents. A little detune between near-unison partials is what makes an
      engine sound like several cylinders rather than one oscillator. */
  readonly detune: number;
}

/**
 * What the engine sounds like.
 *
 * An engine is a periodic bang, and which harmonics that bang contains is most
 * of what separates a small four from a diesel from a V8. Firing frequency sets
 * the pitch; the partial stack sets the character; the filter sweep is what
 * makes opening the throttle sound like acceleration rather than like volume.
 */
export interface Engine {
  /** Fundamental firing frequency at idle and at the limiter, in Hz. */
  readonly idleHz: number;
  readonly redlineHz: number;
  readonly partials: readonly Partial[];
  /** Lowpass cutoff: floor, how far revs open it, how far throttle adds. */
  readonly cutoffBase: number;
  readonly cutoffSweep: number;
  readonly cutoffThrottle: number;
  /** Induction and road roar. */
  readonly noise: number;
  /** Twin-tone horn, in Hz. One note alone sounds like a test signal. */
  readonly horn: readonly [number, number];
}

export interface Vehicle {
  readonly id: string;
  readonly name: string;
  /** One line, shown in the picker. */
  readonly blurb: string;
  /** How it drives, in the picker's words. */
  readonly character: string;
  readonly paint: string;
  /** Trim strip and mirror caps. */
  readonly trim: string;
  readonly glass: string;
  /** The main hull. */
  readonly hull: Box;
  /** The greenhouse. `null` gives an open car with a low screen instead. */
  readonly cabin: Box | null;
  /** A load bed behind the cabin. */
  readonly bed: Box | null;
  /** Roof bars — reads as a working vehicle rather than a styling choice. */
  readonly roofBars: boolean;
  readonly rim: string;
  readonly tune: Tune;
  readonly engine: Engine;
  /** Where the driver's eyes sit, for the first-person view. */
  readonly eye: readonly [number, number, number];
}

/*
  The hulls all start below y = 0 and run to about -0.5. The suspension holds the
  chassis roughly half a metre off the road at rest, so a body that stopped at
  the collider's own underside left a visible gap of daylight under the car.
*/

export const vehicles: readonly Vehicle[] = [
  {
    id: 'hatch',
    name: 'The hatch',
    blurb: 'Light, short overhangs, quick to change direction.',
    character: 'Eager and easy. The one to learn the map in.',
    paint: '#b4ff39',
    trim: '#39ffd8',
    glass: '#0b0e13',
    rim: '#cfd6dd',
    hull: { w: 0.84, h: 0.42, l: 1.72, y: -0.11, z: 0 },
    cabin: { w: 0.72, h: 0.26, l: 0.86, y: 0.52, z: -0.2 },
    bed: null,
    roofBars: false,
    tune: { accel: 1.05, topSpeed: 1.0, braking: 1.0, agility: 1.08 },
    /* A small four: buzzy, revs freely, thin at the bottom. */
    engine: {
      idleHz: 34,
      redlineHz: 128,
      partials: [
        { ratio: 0.5, gain: 0.35, type: 'sawtooth', detune: 0 },
        { ratio: 1, gain: 1, type: 'sawtooth', detune: 0 },
        { ratio: 1.01, gain: 0.55, type: 'sawtooth', detune: 10 },
        { ratio: 2, gain: 0.4, type: 'square', detune: 0 },
        { ratio: 3, gain: 0.18, type: 'sawtooth', detune: -6 },
      ],
      cutoffBase: 380,
      cutoffSweep: 2600,
      cutoffThrottle: 900,
      noise: 0.16,
      horn: [392, 494],
    },
    eye: [-0.3, 0.5, 0.12],
  },
  {
    id: 'van',
    name: 'The van',
    blurb: 'Tall, square, and all roof.',
    character: 'Slower off the mark and slower to stop. Still perfectly happy.',
    paint: '#39ffd8',
    trim: '#0e1a18',
    glass: '#0b0e13',
    rim: '#9aa4ad',
    hull: { w: 0.86, h: 0.46, l: 1.74, y: -0.07, z: 0 },
    cabin: { w: 0.8, h: 0.52, l: 1.2, y: 0.82, z: -0.3 },
    bed: null,
    roofBars: true,
    tune: { accel: 0.86, topSpeed: 0.92, braking: 0.92, agility: 0.86 },
    /* A diesel: low, clattery, strong half-order, dies away early. */
    engine: {
      idleHz: 24,
      redlineHz: 78,
      partials: [
        { ratio: 0.5, gain: 0.72, type: 'square', detune: 0 },
        { ratio: 1, gain: 1, type: 'sawtooth', detune: 0 },
        { ratio: 1.02, gain: 0.7, type: 'sawtooth', detune: 16 },
        { ratio: 1.5, gain: 0.3, type: 'square', detune: 0 },
        { ratio: 2, gain: 0.22, type: 'sawtooth', detune: 0 },
      ],
      cutoffBase: 240,
      cutoffSweep: 1200,
      cutoffThrottle: 500,
      noise: 0.22,
      horn: [262, 330],
    },
    eye: [-0.32, 0.86, 0.3],
  },
  {
    id: 'roadster',
    name: 'The roadster',
    blurb: 'No roof, low screen, nothing behind your head.',
    character: 'The quickest thing here, and the one that stops hardest.',
    paint: '#ff7a45',
    trim: '#2a1a12',
    glass: '#101820',
    rim: '#e6c37a',
    hull: { w: 0.86, h: 0.34, l: 1.74, y: -0.16, z: 0 },
    cabin: null,
    bed: null,
    roofBars: false,
    tune: { accel: 1.22, topSpeed: 1.12, braking: 1.12, agility: 1.14 },
    /* High-revving and bright: a full harmonic stack and a wide filter sweep. */
    engine: {
      idleHz: 40,
      redlineHz: 165,
      partials: [
        { ratio: 0.5, gain: 0.25, type: 'sawtooth', detune: 0 },
        { ratio: 1, gain: 1, type: 'sawtooth', detune: 0 },
        { ratio: 1.005, gain: 0.6, type: 'sawtooth', detune: 6 },
        { ratio: 2, gain: 0.55, type: 'sawtooth', detune: 0 },
        { ratio: 3, gain: 0.35, type: 'sawtooth', detune: -4 },
        { ratio: 4, gain: 0.2, type: 'square', detune: 0 },
      ],
      cutoffBase: 520,
      cutoffSweep: 3600,
      cutoffThrottle: 1300,
      noise: 0.13,
      horn: [440, 554],
    },
    eye: [-0.3, 0.42, 0.1],
  },
  {
    id: 'pickup',
    name: 'The pickup',
    blurb: 'Cab forward, tray behind. Crates fit in the back.',
    character: 'Unhurried and planted. Rumbles.',
    paint: '#dbe3ea',
    trim: '#1b232c',
    glass: '#0b0e13',
    rim: '#78838d',
    hull: { w: 0.84, h: 0.42, l: 1.72, y: -0.11, z: 0 },
    cabin: { w: 0.74, h: 0.3, l: 0.6, y: 0.56, z: 0.42 },
    bed: { w: 0.78, h: 0.2, l: 0.78, y: 0.38, z: -0.82 },
    roofBars: false,
    tune: { accel: 0.95, topSpeed: 0.96, braking: 0.96, agility: 0.92 },
    /* Eight lazy cylinders: a heavy half-order under everything, little top end. */
    engine: {
      idleHz: 28,
      redlineHz: 96,
      partials: [
        { ratio: 0.5, gain: 0.85, type: 'sawtooth', detune: 0 },
        { ratio: 1, gain: 1, type: 'sawtooth', detune: 0 },
        { ratio: 1.015, gain: 0.6, type: 'sawtooth', detune: 14 },
        { ratio: 2, gain: 0.3, type: 'square', detune: 0 },
        { ratio: 2.5, gain: 0.15, type: 'sawtooth', detune: 0 },
      ],
      cutoffBase: 300,
      cutoffSweep: 1700,
      cutoffThrottle: 700,
      noise: 0.19,
      horn: [330, 415],
    },
    eye: [-0.3, 0.58, 0.5],
  },
];

export const DEFAULT_VEHICLE = vehicles[0].id;

export function vehicleById(id: string | null | undefined): Vehicle {
  return vehicles.find((v) => v.id === id) ?? vehicles[0];
}
