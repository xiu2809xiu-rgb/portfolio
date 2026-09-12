'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { SPAWN } from '@/content/drive-world';
import { Car, FIXED_DT, type CarHandle } from './Car';
import { FollowCamera } from './FollowCamera';
import { Post } from './Post';
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

  /*
    `?shot` is the screenshot harness's flag, kept separate from `?debug` so a
    capture is not covered in collider wireframes.

    It preserves the drawing buffer and publishes the renderer. Both are needed
    because a headless browser has only software WebGL: it will not composite
    this canvas into a page screenshot at all, so the pixels have to be read
    back off the canvas instead — and `preserveDrawingBuffer` is what makes that
    return the frame rather than an empty image.
  */
  const [shot] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(location.search).has('shot'),
  );

  useEffect(() => {
    if (!debug) return;
    (window as unknown as { __drive?: unknown }).__drive = handle;
  }, [debug, handle]);

  const publish = (state: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }) => {
    if (!shot) return;
    (window as unknown as { __three?: unknown }).__three = state;
  };

  return (
    <Canvas
      shadows
      /* Capped: a physics world plus shadows on a 4x-density phone screen is the
         quickest way to turn a toy into a space heater. */
      dpr={[1, 1.75]}
      camera={{ position: [0, 6, -14], fov: 55, near: 0.1, far: 400 }}
      /*
        `preserveDrawingBuffer` only under ?debug. Without it the drawing buffer
        is swapped out after compositing, so anything reading the canvas back —
        `toDataURL`, `drawImage` — gets an empty image and a screenshot harness
        cannot tell "rendered black" from "rendered nothing". It costs a buffer
        copy per frame, which is why it is not on for visitors.
      */
      /*
        `antialias` is off deliberately. With a composer mounted the scene is
        drawn into an offscreen buffer and only the final quad reaches the
        default framebuffer, so MSAA on that framebuffer costs memory and
        antialiases nothing.
      */
      gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: shot }}
      onCreated={(state) => {
        /*
          No background colour: the sky is a dome now. A clear colour is painted
          by a path that skips tone mapping, so it would sit at a different
          exposure from the entire rest of the world — which is exactly the
          "bright blue sky over black ground" this world had.
        */
        state.scene.background = null;
        /*
          Exponential, not linear. Linear fog has a visible start distance where
          haze switches on; exponential thickens from the camera outward the way
          air actually does, and it is what makes a 160m world feel open.
        */
        state.scene.fog = new THREE.FogExp2('#a9c7e2', 0.006);

        /*
          VSM, because PCFSoft no longer exists in practice: three 0.185
          deprecates it and silently substitutes hard PCF, which is why the
          shadows were stamped-out black shapes. VSM is the only remaining type
          that honours `shadow.radius`.
        */
        state.gl.shadowMap.type = THREE.VSMShadowMap;

        publish(state);
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
      <Post shot={shot} />
    </Canvas>
  );
}
