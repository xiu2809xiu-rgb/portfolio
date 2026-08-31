'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, Grid } from '@react-three/drei';
import { Car, FIXED_DT, type CarHandle } from './Car';
import { ARENA, World } from './World';
import { FollowCamera } from './FollowCamera';
import { useDriveControls } from './useDriveControls';

/* Just above resting ride height, so it settles rather than slams. */
/*
  Spawned at its settled ride height rather than above it. Dropping the car even
  20cm sets the suspension ringing, and a spring that rings is a spring that
  eventually bounces a wheel off the ground and puts the car on its roof.
*/
const SPAWN: [number, number, number] = [0, 0.95, -6];
/**
 * The drivable world.
 *
 * Deliberately not a copy of the reference's hand-modelled village — there is no
 * low-poly asset library here, and importing one would cost a megabyte and a
 * licence. Everything is primitives in the site's own palette, which ends up
 * being the better answer: it reads as an extension of the portfolio rather than
 * as someone else's world with different furniture in it.
 */
export function DriveScene({
  night,
  handle,
}: {
  night: boolean;
  /* Owned by the client wrapper, so the HTML HUD can read it too — it lives
     outside the canvas and cannot reach into the scene graph. */
  handle: React.RefObject<CarHandle>;
}) {
  const input = useDriveControls();

  /*
    `?debug` turns on Rapier's collider wireframes and publishes the car handle,
    so the chassis can be inspected from the console or a test script. Tuning a
    vehicle by screenshot alone is guesswork — you cannot see a centre of mass.
  */
  const [debug] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(location.search).has('debug'),
  );

  useEffect(() => {
    if (!debug) return;
    (window as unknown as { __drive?: unknown }).__drive = handle;
  }, [debug]);

  return (
    <Canvas
      shadows
      /* Capped: a physics world plus shadows on a 4x-density phone screen is the
         quickest way to turn a toy into a space heater. */
      dpr={[1, 1.75]}
      camera={{ position: [0, 6, -14], fov: 55, near: 0.1, far: 260 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[night ? '#04060a' : '#0a0f16']} />
      <fog attach="fog" args={[night ? '#04060a' : '#0a0f16', 60, 190]} />

      <Lights night={night} />
      <Environment preset={night ? 'night' : 'city'} environmentIntensity={night ? 0.25 : 0.5} />

      {/*
        Fixed timestep, not "vary". A raycast vehicle integrates its own
        suspension against the dt it is handed, so a step that changes length
        frame to frame makes the spring alternately bottom out and launch — which
        is exactly what a stiffness sweep showed: wheels reading fully extended
        while the chassis sat underground. 1/60 also makes the handling identical
        on a 60Hz laptop and a 144Hz monitor.
      */}
      <Physics timeStep={FIXED_DT} debug={debug} /* Earth gravity. Doubling it to feel snappy also doubles what the springs
         must hold, which is half of why the car sat on its belly. */
        gravity={[0, -9.81, 0]}>
        <World night={night} />
        <Car input={input} spawn={SPAWN} handle={handle} />
      </Physics>

      <FollowCamera handle={handle} />

      <Grid
        position={[0, 0.02, 0]}
        args={[ARENA * 2, ARENA * 2]}
        cellSize={2}
        cellThickness={0.6}
        cellColor={night ? '#16351a' : '#1d2b20'}
        sectionSize={10}
        sectionThickness={1.1}
        sectionColor={night ? '#2c6b33' : '#375a3c'}
        fadeDistance={150}
        fadeStrength={1.4}
        infiniteGrid={false}
      />
    </Canvas>
  );
}

function Lights({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.18 : 0.55} color={night ? '#5f7fb5' : '#ffffff'} />
      <directionalLight
        position={[24, 34, 18]}
        intensity={night ? 0.35 : 2.1}
        color={night ? '#7d9ad6' : '#fff6e2'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        /*
          The shadow frustum has to wrap the whole plaza. Left at its default it
          covers about 10 metres, so shadows simply stop existing a short drive
          from the origin — which reads as a rendering bug rather than a setting.
        */
        shadow-camera-left={-ARENA}
        shadow-camera-right={ARENA}
        shadow-camera-top={ARENA}
        shadow-camera-bottom={-ARENA}
        shadow-camera-far={140}
        shadow-bias={-0.0008}
      />
      {/* Lime bounce from below, so the underside of things picks up the ground. */}
      <hemisphereLight
        args={[night ? '#1b3a5c' : '#cfe8ff', '#0d2a12', night ? 0.5 : 0.9]}
      />
    </>
  );
}
