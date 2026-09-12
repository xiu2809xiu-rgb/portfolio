'use client';

import { useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { SPAWN } from '@/content/drive-world';
import { Car, FIXED_DT, type CarHandle } from './Car';
import { FollowCamera } from './FollowCamera';
import { Post } from './Post';
import { Sky } from './Sky';
import { World } from './World';
import { Zones, type ZoneState } from './Zones';
import { Beacon } from './Beacon';
import { useDayNight, type DayNight } from './useDayNight';
import { useDriveControls, type DriveInputRef } from './useDriveControls';
import type { EngineAudio } from './engine-audio';
import { qualityById, type QualityId } from './quality';

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
  vehicleId,
  audio,
  qualityId,
  onContextLost,
}: {
  handle: React.RefObject<CarHandle>;
  /* Owned by the client wrapper so the HTML HUD can read them; the HUD lives
     outside the canvas and cannot reach into the scene graph. */
  clockRef: React.RefObject<DayNight>;
  zoneRef: React.RefObject<ZoneState>;
  onClock?: (label: string, daylight: number) => void;
  /** Appearance only — every body shares one suspension model. */
  vehicleId?: string;
  /** Null until the visitor starts the engine; audio needs a user gesture. */
  audio?: EngineAudio | null;
  qualityId?: QualityId;
  /** Called once if the GPU drops the context, so the page can offer a way out. */
  onContextLost?: () => void;
}) {
  const input = useDriveControls();
  const quality = qualityById(qualityId);
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

  /*
    `?probe` publishes the renderer WITHOUT preserving the drawing buffer.
    Keeping the buffer alive makes the compositor read it back every frame —
    a real, measurable GPU stall — so a diagnostic that needs `?shot` cannot
    tell you anything about how the page performs for an actual visitor.
  */
  const [probe] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(location.search).has('probe'),
  );

  useEffect(() => {
    if (!debug) return;
    (window as unknown as { __drive?: unknown }).__drive = handle;
  }, [debug, handle]);

  const publish = (state: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }) => {
    if (!shot && !probe) return;
    (window as unknown as { __three?: unknown }).__three = state;
  };

  /* The harness needs to see tour state to assert on it; refs are invisible. */
  useEffect(() => {
    if (!shot && !probe) return;
    const w = window as unknown as { __zone?: unknown; __car?: unknown; __input?: unknown };
    w.__zone = zoneRef;
    w.__car = handle;
    /* The harness drives the camera itself, so it needs to be able to change
       view without a keyboard — and the cockpit only builds itself when the
       cockpit view is selected. */
    w.__input = input;
  }, [shot, probe, zoneRef, handle, input]);

  return (
    <Canvas
      shadows={quality.shadows}
      /* Capped: a physics world plus shadows on a 4x-density phone screen is the
         quickest way to turn a toy into a space heater. */
      dpr={[1, quality.dpr]}
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
      gl={{ antialias: false, powerPreference: quality.power, preserveDrawingBuffer: shot }}
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
        state.gl.shadowMap.type = quality.shadowType;

        /*
          With no composer there is no pass to tone map at the end, so the curve
          has to go back on the renderer. Same curve either way — dropping the
          post chain costs bloom, not colour.
        */
        if (!quality.post) {
          state.gl.toneMapping = THREE.NeutralToneMapping;
          state.gl.toneMappingExposure = 1.15;
        }

        publish(state);
      }}
    >
      <Sky colours={colours} advance={advance} onTick={onClock} quality={quality} />

      {/*
        Fixed timestep, not "vary". The vehicle integrates its own suspension
        against the dt it is handed, so a step that changes length frame to frame
        makes the spring alternately bottom out and launch. 1/60 also makes the
        handling identical on a 60Hz laptop and a 144Hz monitor.
      */}
      <Physics timeStep={FIXED_DT} debug={debug} gravity={[0, -9.81, 0]}>
        <World clock={clockRef} quality={quality} />
        <Car input={input} spawn={SPAWN} handle={handle} clock={clockRef} vehicleId={vehicleId} />
      </Physics>

      <Zones handle={handle} zoneRef={zoneRef} input={input} />
      <Beacon zoneRef={zoneRef} />
      <EngineSound audio={audio} handle={handle} input={input} />
      <FollowCamera handle={handle} input={input} vehicleId={vehicleId} />
      {quality.post ? <Post shot={shot || probe} /> : null}
      <ContextGuard onLost={onContextLost} />
    </Canvas>
  );
}

/**
 * Feeds the synthesiser from the car, once per frame.
 *
 * Inside the canvas because that is where the input ref and the car handle both
 * live, and because `useFrame` is already the clock everything else here runs
 * on — a second requestAnimationFrame loop for audio would drift against it.
 */
function EngineSound({
  audio,
  handle,
  input,
}: {
  audio?: EngineAudio | null;
  handle: React.RefObject<CarHandle>;
  input: DriveInputRef;
}) {
  useFrame(() => {
    if (!audio) return;
    const car = handle.current;
    audio.update(car?.speedKph ?? 0, input.current.throttle, (car?.grounded ?? 0) === 0);
    audio.horn(input.current.horn);
  });
  return null;
}

/**
 * Notices when the GPU takes the context away.
 *
 * three already calls preventDefault on the lost event, which is what asks the
 * browser to restore — but a driver that has just run out of resources usually
 * cannot, and nothing comes back. The canvas then paints blank white and the
 * HUD carries on over the top of it, which is exactly the state this was
 * reported in: a white page with a working clock on it.
 *
 * There is no rendering trick that recovers from this. The useful thing is to
 * say so, and offer a way back at a cheaper setting.
 */
function ContextGuard({ onLost }: { onLost?: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!onLost) return;
    const canvas = gl.domElement;
    const handle = () => onLost();
    canvas.addEventListener('webglcontextlost', handle);
    return () => canvas.removeEventListener('webglcontextlost', handle);
  }, [gl, onLost]);

  return null;
}
