'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { SPAWN } from '@/content/drive-world';
import { Car, FIXED_DT, type CarHandle } from './Car';
import { FollowCamera } from './FollowCamera';
import { Sky } from './Sky';
import { World } from './World';
import { Zones, type ZoneState } from './Zones';
import { useDayNight, type DayNight } from './useDayNight';
import { useDriveControls } from './useDriveControls';

/**
 * The drivable world.
 *
 * Deliberately not a copy of a hand-modelled village — there is no low-poly
 * asset library here, and licensing one would cost megabytes for something seen
 * at 45kph. Everything is primitives placed from map data, which ends up the
 * better answer: it reads as an extension of the portfolio rather than as
 * someone else's world with different furniture in it.
 */
export function DriveScene({
  handle,
  clockRef,
  zoneRef,
  onClock,
}: {
  handle: React.RefObject<CarHandle>;
  /* Owned by the client wrapper so the HTML HUD can read them; the HUD lives
     outside the canvas and cannot reach into the scene graph. */
  clockRef: React.RefObject<DayNight>;
  zoneRef: React.RefObject<ZoneState>;
  onClock?: (label: string, daylight: number) => void;
}) {
  const input = useDriveControls();
  const { colours, advance } = useDayNight(clockRef);

  /*
    `?debug` turns on Rapier's collider wireframes and publishes the car handle,
    so the chassis can be inspected from a test script. Tuning a vehicle by
    screenshot alone is guesswork — you cannot see a centre of mass.
  */
  const [debug] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(location.search).has('debug'),
  );

  useEffect(() => {
    if (!debug) return;
    (window as unknown as { __drive?: unknown }).__drive = handle;
  }, [debug, handle]);

  return (
    <Canvas
      shadows
      /* Capped: a physics world plus shadows on a 4x-density phone screen is the
         quickest way to turn a toy into a space heater. */
      dpr={[1, 1.75]}
      camera={{ position: [0, 6, -14], fov: 55, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#0a0f16');
        scene.fog = new THREE.Fog('#0a0f16', 60, 220);
      }}
    >
      <Sky clock={clockRef} colours={colours} advance={advance} onTick={onClock} />

      {/*
        Fixed timestep, not "vary". The vehicle integrates its own suspension
        against the dt it is handed, so a step that changes length frame to frame
        makes the spring alternately bottom out and launch. 1/60 also makes the
        handling identical on a 60Hz laptop and a 144Hz monitor.
      */}
      <Physics timeStep={FIXED_DT} debug={debug} gravity={[0, -9.81, 0]}>
        <World clock={clockRef} />
        <Car input={input} spawn={SPAWN} handle={handle} clock={clockRef} />
      </Physics>

      <Zones handle={handle} zoneRef={zoneRef} input={input} />
      <FollowCamera handle={handle} />
    </Canvas>
  );
}
