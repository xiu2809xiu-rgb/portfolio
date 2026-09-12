'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { districtGate, districts, type District } from '@/content/drive-world';
import type { CarHandle } from './Car';
import type { DriveInputRef } from './useDriveControls';

export interface ZoneState {
  /** The district the car is standing in front of, or null. */
  active: District | null;
  /** Bumped whenever `active`, `target` or `visited` changes. */
  version: number;
  /** District ids, in the order they were reached. */
  visited: string[];
  /** Where to head next, or null once every chapter has been reached. */
  target: District | null;
  /** Metres to the target's gate. */
  targetDistance: number;
  /**
   * Radians from the car's nose to the target, signed. Feeds the compass
   * needle directly — 0 is dead ahead, negative is to the left.
   */
  targetHeading: number;
}

/**
 * Signed angle from the car's nose to a target, in radians.
 *
 * Pure, exported and tested, because this is a sign convention and sign
 * conventions on this project have twice shipped backwards. 0 is dead ahead,
 * positive is to the car's right, and the value can be handed to a CSS rotation
 * unconverted — an up-arrow rotated by it points where the target is.
 *
 * Note the world axes: with the chase camera looking along +Z, the car's right
 * is world -X. That is the same convention the steering already uses.
 */
export function headingTo(
  forwardX: number,
  forwardZ: number,
  dx: number,
  dz: number,
): number {
  const length = Math.hypot(dx, dz) || 1;
  const tx = dx / length;
  const tz = dz / length;
  return Math.atan2(forwardX * tz - forwardZ * tx, forwardX * tx + forwardZ * tz);
}

const ENTER_RADIUS = 15;
const LEAVE_RADIUS = 19;

/** Close enough to count as having arrived. */
const ARRIVE_RADIUS = 13;

export function makeZoneState(): ZoneState {
  return {
    active: null,
    version: 0,
    visited: [],
    target: districts[0],
    targetDistance: 0,
    targetHeading: 0,
  };
}

/**
 * Where the car is, and where it should go next.
 *
 * The route is not invented for the sake of having one: `drive-world.ts` already
 * orders the six districts the way the work happened, so following the ring
 * clockwise from the campus is the CV in chronological order. All this does is
 * make that legible — point at the next chapter, count them off, and stop
 * pointing once they have all been seen.
 *
 * It stays entirely optional. Nothing blocks, nothing fails, and a visitor who
 * ignores the compass and drives into the woods loses nothing.
 *
 * Distance is measured against each district's gate rather than its centre, so
 * the panel appears as you arrive at the entrance rather than once you are
 * already among the buildings. Enter and leave use different radii on purpose:
 * with a single threshold, a car idling exactly on the line makes the panel
 * flicker on and off every frame.
 */
export function Zones({
  handle,
  zoneRef,
  input,
}: {
  handle: React.RefObject<CarHandle>;
  zoneRef: React.RefObject<ZoneState>;
  input: DriveInputRef;
}) {
  const gates = useRef(
    districts.map((district) => {
      const [x, z] = districtGate(district);
      return { district, position: new THREE.Vector2(x, z) };
    }),
  );
  const here = useRef(new THREE.Vector2());
  const quat = useRef(new THREE.Quaternion());
  const forward = useRef(new THREE.Vector3());

  /*
    Ref writes inside the render loop, which the React Compiler's immutability
    rule reads as render-phase mutation. They are not — this is a frame callback,
    and the whole point of the zone state is to change without re-rendering.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const body = handle.current?.body;
    const zone = zoneRef.current;
    if (!body || !zone) return;

    const t = body.translation();
    here.current.set(t.x, t.z);

    let nearest: District | null = null;
    let nearestDistance = Infinity;
    for (const gate of gates.current) {
      const distance = here.current.distanceTo(gate.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = gate.district;
      }
    }

    const threshold = zone.active ? LEAVE_RADIUS : ENTER_RADIUS;
    const next = nearestDistance <= threshold ? nearest : null;

    if (next?.id !== zone.active?.id) {
      zone.active = next;
      zone.version += 1;
    }

    /*
      Arriving counts wherever it happens. Reaching chapter four first does not
      make chapters two and three unreachable — the target simply moves to
      whichever is still unvisited and nearest in the original order.
    */
    if (nearest && nearestDistance <= ARRIVE_RADIUS && !zone.visited.includes(nearest.id)) {
      zone.visited.push(nearest.id);
      zone.target = districts.find((d) => !zone.visited.includes(d.id)) ?? null;
      zone.version += 1;
    }

    /* Bearing to the target, for the compass. */
    const target = zone.target;
    if (target) {
      const [gx, gz] = districtGate(target);
      const dx = gx - t.x;
      const dz = gz - t.z;
      zone.targetDistance = Math.hypot(dx, dz);

      const r = body.rotation();
      quat.current.set(r.x, r.y, r.z, r.w);
      forward.current.set(0, 0, 1).applyQuaternion(quat.current);
      forward.current.y = 0;
      if (forward.current.lengthSq() < 1e-6) forward.current.set(0, 0, 1);
      forward.current.normalize();

      zone.targetHeading = headingTo(forward.current.x, forward.current.z, dx, dz);
    } else {
      zone.targetDistance = 0;
      zone.targetHeading = 0;
    }

    /*
      Navigation happens here rather than in a key handler so it can only fire
      while a district is actually active — and the flag is cleared immediately,
      because the key is polled every frame and would otherwise open the same
      page dozens of times in one press.
    */
    if (input.current.interact && zone.active) {
      input.current.interact = false;
      window.location.assign(zone.active.href);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
