/**
 * The cars, as data.
 *
 * Every one of these is a change of *appearance only*. The raycast suspension in
 * Car.tsx — wheel positions, spring rates, the friction circle, the centre of
 * mass — is shared by all of them and none of these numbers reaches it. That is
 * deliberate: the handling took a long time to get right, and a picker that
 * quietly changed how the car drove would be a worse feature, not a better one.
 * Pick whichever you like the look of; they all drive the same.
 *
 * Measurements are half-extents in metres, in the car's own space: +Z is the
 * nose, +Y is up. The physics chassis is 0.78 × 0.30 × 1.70, and the hulls below
 * are deliberately a little larger than that — the collider sits well inside the
 * bodywork, which is what stops the car looking like it is hovering.
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

export interface Vehicle {
  readonly id: string;
  readonly name: string;
  /** One line, shown in the picker. */
  readonly blurb: string;
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
}

/*
  The hulls all start below y = 0 and run to about -0.5. The suspension holds the
  chassis roughly half a metre off the road at rest, so a body that stopped at
  the collider's own underside left a visible gap of daylight under the car —
  which no amount of panel detail would have fixed.
*/

export const vehicles: readonly Vehicle[] = [
  {
    id: 'hatch',
    name: 'The hatch',
    blurb: 'Light, short overhangs, quick to change direction.',
    paint: '#b4ff39',
    trim: '#39ffd8',
    glass: '#0b0e13',
    rim: '#cfd6dd',
    hull: { w: 0.84, h: 0.42, l: 1.72, y: -0.11, z: 0 },
    cabin: { w: 0.72, h: 0.26, l: 0.86, y: 0.52, z: -0.2 },
    bed: null,
    roofBars: false,
  },
  {
    id: 'van',
    name: 'The van',
    blurb: 'Tall, square, and all roof. Rolls more and makes no secret of it.',
    paint: '#39ffd8',
    trim: '#0e1a18',
    glass: '#0b0e13',
    rim: '#9aa4ad',
    hull: { w: 0.86, h: 0.46, l: 1.74, y: -0.07, z: 0 },
    cabin: { w: 0.8, h: 0.52, l: 1.2, y: 0.82, z: -0.3 },
    bed: null,
    roofBars: true,
  },
  {
    id: 'roadster',
    name: 'The roadster',
    blurb: 'No roof, low screen, and nothing behind your head.',
    paint: '#ff7a45',
    trim: '#2a1a12',
    glass: '#101820',
    rim: '#e6c37a',
    hull: { w: 0.86, h: 0.34, l: 1.74, y: -0.16, z: 0 },
    cabin: null,
    bed: null,
    roofBars: false,
  },
  {
    id: 'pickup',
    name: 'The pickup',
    blurb: 'Cab forward, tray behind. Crates fit in the back.',
    paint: '#dbe3ea',
    trim: '#1b232c',
    glass: '#0b0e13',
    rim: '#78838d',
    hull: { w: 0.84, h: 0.42, l: 1.72, y: -0.11, z: 0 },
    cabin: { w: 0.74, h: 0.3, l: 0.6, y: 0.56, z: 0.42 },
    bed: { w: 0.78, h: 0.2, l: 0.78, y: 0.38, z: -0.82 },
    roofBars: false,
  },
];

export const DEFAULT_VEHICLE = vehicles[0].id;

export function vehicleById(id: string | null | undefined): Vehicle {
  return vehicles.find((v) => v.id === id) ?? vehicles[0];
}
