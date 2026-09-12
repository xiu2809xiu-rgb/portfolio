'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { HALF } from '@/content/drive-world';
import { clockLabel, type DayNight } from './useDayNight';

/**
 * Sun, sky and fog, all driven from the clock.
 *
 * The sky used to be `scene.background = new THREE.Color(...)`, and that single
 * line was most of what made the world look wrong. A plain colour background is
 * painted by a dedicated path that does NOT tone map — so the sky was drawn at
 * its literal authored value while every lit surface in the world went through
 * the tone curve. A sky at 201/255 over grass resolving to 24/255 is not a
 * lighting bug, it is two different pipelines disagreeing, and no amount of
 * brightening the grass would have closed it honestly.
 *
 * So the sky is now a dome: real geometry, a real material, tone mapped with
 * everything else. That also buys a horizon gradient, a sun you can drive
 * towards, and stars — none of which a clear colour can have.
 *
 * Everything here is mutated in place inside `useFrame`. A day/night cycle that
 * went through React state would re-render the scene graph on every frame to
 * move a light a fraction of a degree.
 */

/** Comfortably inside the camera's far plane; the dome rides with the camera. */
const DOME_RADIUS = 300;

const VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
  Writes linear HDR. With the composer mounted, TONE_MAPPING is not defined and
  the include below is inert — the composer's own pass applies the curve at the
  end, to this and to everything else at once. Without the composer the include
  does the work instead. Correct either way, which is the point of using the
  engine's own chunks rather than hand-rolling the curve.
*/
const FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uNight;
  varying vec3 vDir;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    /* Tight band at the horizon rather than a linear wash — the pow is what
       stops it reading as a two-stop gradient. */
    float t = pow(clamp(h * 1.5 + 0.06, 0.0, 1.0), 0.55);
    vec3 sky = mix(uHorizon, uZenith, t);

    /* A darker skirt below the horizon so the dome has a floor to sit against
       instead of the gradient continuing under the world. */
    sky = mix(uHorizon * 0.38, sky, smoothstep(-0.14, 0.015, h));

    /* Stars: a hash per cell of a quantised direction. Cheap, stable as the
       camera turns, and gone by sunrise. */
    if (uNight > 0.01) {
      vec3 sp = dir * 190.0;
      vec3 cell = floor(sp);
      float r = hash31(cell);
      float twinkle = step(0.9972, r);
      float soft = 1.0 - clamp(length(fract(sp) - 0.5) * 2.2, 0.0, 1.0);
      sky += vec3(twinkle * soft * soft) * uNight * 2.2 * smoothstep(-0.02, 0.12, h);
    }

    /* The sun. The disc is pushed well above 1.0 on purpose: bloom needs
       something genuinely brighter than white to grab, and this is the only
       thing in the sky that should ever bleed. */
    float d = max(dot(dir, uSunDir), 0.0);
    float disc = smoothstep(0.9988, 0.9996, d);
    float halo = pow(d, 260.0) * 0.6 + pow(d, 9.0) * 0.12;
    sky += uSun * (halo + disc * 16.0);

    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

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
  const { scene, camera } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.HemisphereLight>(null);
  const bounceRef = useRef<THREE.HemisphereLight>(null);
  const domeRef = useRef<THREE.Mesh>(null);
  const since = useRef(0);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color('#8fb4d9') },
      uHorizon: { value: new THREE.Color('#a9c7e2') },
      uSun: { value: new THREE.Color('#ffd9a8') },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uNight: { value: 0 },
    }),
    [],
  );

  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    const state = advance(Math.min(delta, 0.1));

    /* No clear colour any more — the dome is the sky. Leaving a background
       Color here would paint over the dome with the untone-mapped version. */
    if (scene.background) scene.background = null;

    const angle = state.t * Math.PI * 2;
    const sunPosition = SUN.set(Math.sin(angle) * 90, state.elevation * 80, Math.cos(angle) * 40);

    const sun = sunRef.current;
    if (sun) {
      sun.position.copy(sunPosition);
      sun.color.copy(colours.sun);
      sun.intensity = 0.15 + state.daylight * 2.6;
      // No point costing a shadow pass once the sun is below the horizon.
      sun.castShadow = state.elevation > 0.02;
    }

    const ambient = ambientRef.current;
    if (ambient) {
      ambient.color.copy(colours.ambient);
      /*
        A floor of 0.38 rather than 0.25. Deep night with only headlights is
        atmospheric for about ten seconds and then simply hard to drive in.
      */
      ambient.intensity = 0.38 + state.daylight * 0.62;
    }

    /*
      One weak light pointing up from the ground. Without it, undersides — the
      arches of the car, the soffits of the gates, anything overhanging — go to
      pure black and read as holes cut in the object rather than as shade.
    */
    const bounce = bounceRef.current;
    if (bounce) bounce.intensity = 0.12 + state.daylight * 0.3;

    const dome = domeRef.current;
    if (dome) {
      /* Rides with the camera, so the horizon never approaches and the far
         plane never clips a corner of it. */
      dome.position.copy(camera.position);
      uniforms.uZenith.value.copy(colours.sky);
      uniforms.uHorizon.value.copy(colours.fog);
      uniforms.uSun.value.copy(colours.sun);
      uniforms.uSunDir.value.copy(sunPosition).normalize();
      uniforms.uNight.value = 1 - state.daylight;
    }

    if (scene.fog instanceof THREE.FogExp2) {
      /*
        Matched to the dome's horizon so distance dissolves into sky rather than
        into a differently-coloured wall. Denser after dark, which is most of
        what makes night feel like night.
      */
      scene.fog.color.copy(colours.fog);
      scene.fog.density = 0.0105 - state.daylight * 0.0062;
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
      <mesh ref={domeRef} frustumCulled={false} renderOrder={-1000}>
        <sphereGeometry args={[DOME_RADIUS, 32, 20]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          uniforms={uniforms}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
        />
      </mesh>

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
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        /* Only VSM honours this. PCFSoftShadowMap is deprecated in three 0.185
           and silently downgraded to hard PCF, which is why the shadows read as
           stamped-out black shapes. */
        shadow-radius={4}
        shadow-blurSamples={12}
      />

      <hemisphereLight ref={ambientRef} groundColor="#3a4a32" intensity={0.6} />
      {/* Up-facing fill. groundColor is the sky here, deliberately: it is the
          sky colour that should be bouncing back up off the ground. */}
      <hemisphereLight
        ref={bounceRef}
        color="#2a3320"
        groundColor="#9fc0dd"
        intensity={0.2}
      />
    </>
  );
}

const SUN = new THREE.Vector3();
