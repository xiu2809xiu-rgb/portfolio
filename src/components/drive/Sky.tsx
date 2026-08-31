'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { HALF } from '@/content/drive-world';
import { clockLabel, type DayNight } from './useDayNight';

/**
 * Sun, sky and fog, all driven from the clock.
 *
 * Everything here is mutated in place inside `useFrame`. A day/night cycle that
 * went through React state would re-render the scene graph on every frame to
 * move a light a fraction of a degree — the colours and the sun position are
 * exactly the kind of continuously-changing value that belongs in a ref.
 *
 * The sun travels a real arc rather than fading in brightness: its elevation
 * drives the light's height, which is what makes shadows rake long at dawn and
 * shorten to nothing at noon. Brightness alone would look like someone turning
 * down a dimmer, which is what the toggle this replaces actually did.
 */
export function Sky({
  clock,
  colours,
  advance,
  onTick,
}: {
  clock: React.RefObject<DayNight>;
  colours: { sky: THREE.Color; fog: THREE.Color; sun: THREE.Color; ambient: THREE.Color };
  advance: (delta: number) => DayNight;
  /** Called about twice a second with the clock label, for the HUD. */
  onTick?: (label: string, daylight: number) => void;
}) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.HemisphereLight>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const since = useRef(0);

  /*
    The sky is mutated in place every frame. The React Compiler's immutability
    rule reads that as render-phase mutation; it is not — this is the render
    loop, and a day/night cycle routed through state would re-render the scene
    graph sixty times a second to move a light a fraction of a degree.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    const state = advance(Math.min(delta, 0.1));

    if (!scene.background) scene.background = new THREE.Color();
    (scene.background as THREE.Color).copy(colours.sky);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(colours.fog);
      // Visibility closes in after dark, which is most of what makes night feel different.
      scene.fog.near = 45 + state.daylight * 35;
      scene.fog.far = 150 + state.daylight * 130;
    }

    const sun = sunRef.current;
    if (sun) {
      const angle = state.t * Math.PI * 2;
      // Rises in the east, sets in the west, and passes overhead at noon.
      sun.position.set(Math.sin(angle) * 90, state.elevation * 80, Math.cos(angle) * 40);
      sun.color.copy(colours.sun);
      sun.intensity = 0.15 + state.daylight * 2.6;
      // No point costing a shadow pass once the sun is below the horizon.
      sun.castShadow = state.elevation > 0.02;
    }

    const ambient = ambientRef.current;
    if (ambient) {
      ambient.color.copy(colours.ambient);
      ambient.intensity = 0.25 + state.daylight * 0.75;
    }

    const disc = discRef.current;
    if (disc && sun) {
      disc.position.copy(sun.position).multiplyScalar(0.9);
      disc.visible = state.elevation > -0.1;
      (disc.material as THREE.MeshBasicMaterial).color.copy(colours.sun);
    }

    since.current += delta;
    if (since.current > 0.5 && onTick) {
      since.current = 0;
      onTick(clockLabel(state.t), state.daylight);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <>
      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        /*
          The shadow frustum has to wrap the whole map. Left at its default it
          covers about ten metres, so shadows simply stop existing a short drive
          from the origin — which reads as a rendering fault rather than a limit.
        */
        shadow-camera-left={-HALF}
        shadow-camera-right={HALF}
        shadow-camera-top={HALF}
        shadow-camera-bottom={-HALF}
        shadow-camera-far={260}
        shadow-bias={-0.0006}
      />
      <hemisphereLight ref={ambientRef} groundColor="#0d1a12" intensity={0.6} />

      {/* A disc for the sun itself, so there is something to drive towards. */}
      <mesh ref={discRef}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
    </>
  );
}
