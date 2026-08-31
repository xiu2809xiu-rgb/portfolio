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
  /** Bumped whenever `active` changes, so the HUD can react without polling deep. */
  version: number;
}

const ENTER_RADIUS = 15;
const LEAVE_RADIUS = 19;

/**
 * Which chapter the car is standing in front of.
 *
 * Distance is measured against each district's gate rather than its centre, so
 * the panel appears as you arrive at the entrance rather than once you are
 * already among the buildings.
 *
 * Enter and leave use different radii on purpose. With a single threshold, a car
 * idling exactly on the line makes the panel flicker on and off every frame; the
 * gap between 15m and 19m is what stops that.
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
