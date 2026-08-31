/**
 * The map, as data.
 *
 * Geometry lives here rather than inside the renderer so the layout can be read
 * and argued about without reading three.js. Everything downstream — road
 * meshes, tree exclusion, collider placement, the proximity panels — is derived
 * from these numbers, which means the map cannot drift out of step with itself:
 * move a district and its access road, its clearing and its marker follow.
 *
 * Units are metres. The world is a square of ±HALF, centred on the plaza.
 */

export const HALF = 80;
export const PLAZA_RADIUS = 16;
export const RING_RADIUS = 52;
export const ROAD_WIDTH = 10;
export const SPUR_WIDTH = 8;

/** Where the car starts, on the plaza, facing the campus spur. */
export const SPAWN: [number, number, number] = [0, 0.95, -8];

export interface District {
  readonly id: string;
  /** Degrees clockwise from north; the district sits on the ring at this bearing. */
  readonly bearing: number;
  readonly name: string;
  readonly kicker: string;
  readonly blurb: string;
  /** Where E takes you. */
  readonly href: string;
  /** Footprint radius — kept clear of trees, and used to place the buildings. */
  readonly radius: number;
  readonly accent: 'lime' | 'aqua';
  /** How the buildings in this district are massed. */
  readonly form: 'campus' | 'arena' | 'studio' | 'workshop' | 'court' | 'lookout';
}

/**
 * Six chapters, arranged around the ring in the order they happened — campus
 * first at north, then clockwise through the work, ending at the lookout where
 * the contact details are. A visitor who drives one way round the ring gets the
 * story in sequence; one who drives the other way gets it backwards, which is
 * also how most people read a CV.
 */
export const districts: readonly District[] = [
  {
    id: 'campus',
    bearing: 0,
    name: 'Nanyang Polytechnic',
    kicker: 'Where it started',
    blurb: 'Diploma in Information Technology. Out in 2028.',
    href: '/#about',
    radius: 17,
    accent: 'aqua',
    form: 'campus',
  },
  {
    id: 'arena',
    bearing: 60,
    name: 'SmartRecap',
    kicker: '1st place · NYP × AWS 2026',
    blurb: 'Twenty-five page components in one overnight sitting. It placed first.',
    href: '/work/smartrecap',
    radius: 18,
    accent: 'lime',
    form: 'arena',
  },
  {
    id: 'studio',
    bearing: 120,
    name: 'CertAIn',
    kicker: 'Mean SUS 74.2',
    blurb: 'Nine participants, three scenarios, and one popup that blocked five of them.',
    href: '/work/certain',
    radius: 16,
    accent: 'aqua',
    form: 'studio',
  },
  {
    id: 'workshop',
    bearing: 180,
    name: 'Singink & SwapLah',
    kicker: 'Flask, tickets, user management',
    blurb: 'Twelve routes, six tables, fifteen validation rules — on the server, where they count.',
    href: '/work/singink-support',
    radius: 17,
    accent: 'lime',
    form: 'workshop',
  },
  {
    id: 'court',
    bearing: 240,
    name: 'Table Tennis CCA',
    kicker: 'From wireframe to a working build',
    blurb: 'The club lived in a group chat. It got a home instead.',
    href: '/work/table-tennis-cca-website',
    radius: 15,
    accent: 'aqua',
    form: 'court',
  },
  {
    id: 'lookout',
    bearing: 300,
    name: 'Say hello',
    kicker: 'Available for a 2027 internship',
    blurb: 'There is a real calendar behind this. Pick a slot.',
    href: '/book',
    radius: 15,
    accent: 'lime',
    form: 'lookout',
  },
];

/** Position of a district's centre, derived from its bearing on the ring. */
export function districtCentre(district: District): [number, number] {
  const angle = (district.bearing * Math.PI) / 180;
  const distance = RING_RADIUS + district.radius * 0.55;
  return [Math.sin(angle) * distance, -Math.cos(angle) * distance];
}

/** Where the marker gate stands: on the ring, at the mouth of the access road. */
export function districtGate(district: District): [number, number] {
  const angle = (district.bearing * Math.PI) / 180;
  return [Math.sin(angle) * RING_RADIUS, -Math.cos(angle) * RING_RADIUS];
}

/** The four radial roads that join the plaza to the ring. */
export const spurBearings = [0, 90, 180, 270] as const;

/**
 * Is this point on tarmac?
 *
 * One predicate, used by three different things: to lay the road surface, to
 * keep trees off it, and to decide the grip under each wheel. Writing it once is
 * what stops a tree growing through a road it was never told about.
 */
export function onRoad(x: number, z: number): boolean {
  const fromCentre = Math.hypot(x, z);

  if (fromCentre <= PLAZA_RADIUS) return true;
  if (Math.abs(fromCentre - RING_RADIUS) <= ROAD_WIDTH / 2) return true;

  const bearing = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
  /** Absolute angular distance between two bearings, in degrees. */
  const apart = (a: number, b: number) => Math.abs((((a - b + 540) % 360) - 180));
  /** Half the corridor width, expressed as an angle at this radius. */
  const halfAngle = (Math.atan(SPUR_WIDTH / 2 / Math.max(fromCentre, 1)) * 180) / Math.PI;

  // Radial spurs run from the plaza edge out to the ring.
  for (const spur of spurBearings) {
    if (apart(bearing, spur) < halfAngle && fromCentre <= RING_RADIUS) return true;
  }

  // Short access roads carry on past the ring into each district.
  for (const district of districts) {
    if (
      apart(bearing, district.bearing) < halfAngle &&
      fromCentre > RING_RADIUS - ROAD_WIDTH &&
      fromCentre <= RING_RADIUS + district.radius
    ) {
      return true;
    }
  }

  return false;
}

/** Is this point inside a district's cleared footprint? */
export function inDistrict(x: number, z: number): boolean {
  return districts.some((district) => {
    const [cx, cz] = districtCentre(district);
    return Math.hypot(x - cx, z - cz) < district.radius;
  });
}
