'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Vehicle } from '@/content/drive-vehicles';
import type { CarHandle } from './Car';
import { clockLabel, type DayNight } from './useDayNight';
import type { DriveInputRef } from './useDriveControls';
import { VIEWS } from './FollowCamera';

/** Matches the index of 'Cockpit' in the camera's view list. */
const COCKPIT_VIEW = VIEWS.indexOf('Cockpit');
const DIAL_SIZE = 512;

function drawCluster(
  ctx: CanvasRenderingContext2D,
  kph: number,
  revs: number,
  clock: string,
) {
  const width = DIAL_SIZE;
  const height = DIAL_SIZE / 2;

  ctx.clearRect(0, 0, width, height);
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, '#101820');
  backdrop.addColorStop(1, '#030508');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const dial = (cx: number, value: number, max: number, label: string, accent: string) => {
    const radius = 58;
    const from = Math.PI * 0.78;
    const to = Math.PI * 2.22;
    const cy = height * 0.66;

    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#26333f';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, from, to);
    ctx.stroke();

    const filled = from + (to - from) * Math.min(value / max, 1);
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, from, filled);
    ctx.stroke();

    ctx.strokeStyle = '#788795';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i += 1) {
      const angle = from + ((to - from) * i) / 8;
      const inner = radius - 13;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * (radius - 4), cy + Math.sin(angle) * (radius - 4));
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff6a55';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(filled) * (radius - 18), cy + Math.sin(filled) * (radius - 18));
    ctx.stroke();

    ctx.fillStyle = '#a8b4bf';
    ctx.font = '600 15px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + radius - 4);
  };

  dial(96, Math.abs(kph), 120, 'KM/H', '#b4ff39');
  dial(width - 96, revs * 8, 8, 'x1000 RPM', '#39ffd8');

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 84px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(Math.abs(kph))), width / 2, height * 0.36);

  ctx.fillStyle = '#81909d';
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText('KM/H', width / 2, height * 0.36 + 24);

  ctx.fillStyle = '#b4ff39';
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText(clock, width / 2, 26);
}

function createBonnetGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        -0.84, 0, -0.72,
        0, 0.035, -0.72,
        0.84, 0, -0.72,
        -0.67, -0.055, 0.72,
        0, -0.022, 0.72,
        0.67, -0.055, 0.72,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

function DriverHand({ side }: { side: -1 | 1 }) {
  return (
    <group position={[0.164 * side, -0.002, 0.038]} rotation={[0, 0, side * 0.26]}>
      {/* Rounded palm and individual finger silhouettes replace the old cuboid
          hand, which read as a voxel at exactly this camera distance. */}
      <mesh rotation={[0.08, 0, side * 0.06]} castShadow>
        <capsuleGeometry args={[0.029, 0.062, 7, 12]} />
        <meshStandardMaterial color="#b77a57" roughness={0.68} />
      </mesh>

      {[-0.018, -0.006, 0.006, 0.018].map((offset, index) => (
        <mesh
          key={offset}
          position={[offset * side, 0.035 - index * 0.002, 0.003]}
          rotation={[Math.PI / 2, 0, side * 0.08]}
          castShadow
        >
          <capsuleGeometry args={[0.0065, 0.037 - index * 0.0025, 5, 8]} />
          <meshStandardMaterial color={index > 1 ? '#ad704f' : '#bc7f5c'} roughness={0.7} />
        </mesh>
      ))}

      <mesh
        position={[-0.035 * side, 0.014, 0.018]}
        rotation={[0.45, 0, side * 0.92]}
        castShadow
      >
        <capsuleGeometry args={[0.009, 0.038, 6, 9]} />
        <meshStandardMaterial color="#b57955" roughness={0.7} />
      </mesh>

      {/* Cuff and sleeve run back towards the driver with a rounded profile. */}
      <mesh position={[0.018 * side, -0.066, -0.008]}>
        <cylinderGeometry args={[0.031, 0.035, 0.046, 14]} />
        <meshStandardMaterial color="#252d36" roughness={0.82} />
      </mesh>
      <mesh position={[0.048 * side, -0.185, -0.055]} rotation={[1.28, 0, side * 0.3]}>
        <capsuleGeometry args={[0.031, 0.14, 7, 12]} />
        <meshStandardMaterial color="#18222c" roughness={0.88} />
      </mesh>
    </group>
  );
}

export function Cockpit({
  vehicle,
  input,
  handle,
  clock,
}: {
  vehicle: Vehicle;
  input: DriveInputRef;
  handle: React.RefObject<CarHandle>;
  clock?: React.RefObject<DayNight>;
}) {
  const group = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const display = useRef({ speed: -1, revs: -1, clock: '', elapsed: 0 });

  const cluster = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = DIAL_SIZE;
    canvas.height = DIAL_SIZE / 2;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    if (ctx) drawCluster(ctx, 0, 0, '--:--');
    return { ctx, texture };
  }, []);

  const bonnetGeometry = useMemo(() => createBonnetGeometry(), []);
  const bonnetColour = useMemo(
    () => new THREE.Color(vehicle.paint).lerp(new THREE.Color('#11171c'), 0.45),
    [vehicle.paint],
  );

  useEffect(
    () => () => {
      cluster.texture.dispose();
      bonnetGeometry.dispose();
    },
    [cluster, bonnetGeometry],
  );

  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;

    const view = ((input.current.view % VIEWS.length) + VIEWS.length) % VIEWS.length;
    const active = view === COCKPIT_VIEW;
    node.visible = active;
    if (!active) return;

    if (wheel.current) wheel.current.rotation.z = -input.current.steer * 2.25;

    const kph = Math.abs(handle.current?.speedKph ?? 0);
    const speed = Math.round(kph);
    const revs = Math.min(kph / 88, 1) * 0.8 + Math.abs(input.current.throttle) * 0.2;
    const revStep = Math.round(revs * 20);
    const time = clock?.current ? clockLabel(clock.current.t) : '';
    display.current.elapsed += delta;

    if (
      cluster.ctx &&
      (display.current.elapsed >= 0.12 ||
        speed !== display.current.speed ||
        revStep !== display.current.revs ||
        time !== display.current.clock)
    ) {
      display.current = { speed, revs: revStep, clock: time, elapsed: 0 };
      drawCluster(cluster.ctx, kph, revs, time);
      cluster.texture.needsUpdate = true;
    }
  });
  /* eslint-enable react-hooks/immutability */

  const [eyeX, eyeY, eyeZ] = vehicle.eye;
  const centre = -eyeX;

  return (
    <group ref={group} position={[eyeX, eyeY, eyeZ]} visible={false}>
      {/* Lower, layered dash. It now sits below the sightline rather than
          blocking the road with one oversized rectangular slab. */}
      <mesh position={[centre, -0.62, 0.98]} rotation={[-0.09, 0, 0]}>
        <boxGeometry args={[1.68, 0.24, 0.42]} />
        <meshStandardMaterial color="#10171d" roughness={0.82} metalness={0.06} />
      </mesh>
      <mesh position={[centre, -0.84, 0.72]}>
        <boxGeometry args={[1.66, 0.31, 0.32]} />
        <meshStandardMaterial color="#0a0f14" roughness={0.92} />
      </mesh>
      <mesh position={[centre, -1.08, 0.06]}>
        <boxGeometry args={[1.64, 0.055, 1.48]} />
        <meshStandardMaterial color="#070a0d" roughness={0.96} />
      </mesh>

      {/* A narrow cowl and a low, tapered bonnet leave most of the windscreen
          clear. The former box sat only 30 cm below the eye and filled half of
          the screenshot with neon paint. */}
      <mesh position={[centre, -0.56, 1.27]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.68, 0.09, 0.22]} />
        <meshStandardMaterial color="#0c1116" roughness={0.72} />
      </mesh>
      <mesh geometry={bonnetGeometry} position={[centre, -0.72, 1.91]} receiveShadow>
        <meshPhysicalMaterial
          color={bonnetColour}
          roughness={0.5}
          metalness={0.24}
          clearcoat={0.42}
          clearcoatRoughness={0.34}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Instrument binnacle and anti-glare hood. */}
      <mesh position={[0, -0.225, 0.8]} rotation={[-0.19, 0, 0]}>
        <boxGeometry args={[0.52, 0.27, 0.055]} />
        <meshStandardMaterial color="#080c10" roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.229, 0.77]} rotation={[-0.19, 0, 0]}>
        <boxGeometry args={[0.46, 0.215, 0.012]} />
        <meshBasicMaterial map={cluster.texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.08, 0.78]} rotation={[0.14, 0, 0]}>
        <boxGeometry args={[0.57, 0.035, 0.18]} />
        <meshStandardMaterial color="#0a0e12" roughness={0.9} />
      </mesh>

      {/*
        Positions here are derived from sightlines, not nudged. With the eye at
        the origin looking ~4 degrees down through a 70 degree lens, the bottom
        of the frame falls about 39 degrees below horizontal. The wheel centre
        sits at 27, which puts its lower rim at 37 — just inside — and its upper
        rim at 14, so the whole wheel is in shot with both hands on it. The
        cluster sits at 18, which is inside the rim but above the hub, i.e.
        exactly where a real one is read from. The previous centre was at 42
        degrees: three degrees below the frame edge, which is why the wheel was
        sliced off and only one hand showed.
      */}
      <group ref={wheel} position={[0, -0.345, 0.6]} rotation={[-0.36, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.17, 0.018, 12, 48]} />
          <meshStandardMaterial color="#171b20" roughness={0.54} metalness={0.04} />
        </mesh>
        {[-Math.PI / 2, Math.PI * 0.23, Math.PI * 0.77].map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 0.072, Math.sin(angle) * 0.072, 0.004]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <capsuleGeometry args={[0.011, 0.105, 5, 9]} />
            <meshStandardMaterial color="#242b32" roughness={0.64} metalness={0.08} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.036, 0.04, 0.022, 20]} />
          <meshStandardMaterial
            color={vehicle.trim}
            emissive={vehicle.trim}
            emissiveIntensity={0.12}
            roughness={0.46}
            metalness={0.36}
          />
        </mesh>
        <DriverHand side={-1} />
        <DriverHand side={1} />
      </group>

      {/* Slim, rounded windshield frame pushed away from the eye. */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          position={[centre + side * 0.91, 0.1, 1.25]}
          rotation={[0.22, 0, side * -0.13]}
        >
          <capsuleGeometry args={[0.03, 0.82, 6, 10]} />
          <meshStandardMaterial color="#141a20" roughness={0.78} metalness={0.08} />
        </mesh>
      ))}
      {vehicle.cabin ? (
        <mesh position={[centre, 0.64, 1.28]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[1.78, 0.065, 0.18]} />
          <meshStandardMaterial color="#11171d" roughness={0.82} />
        </mesh>
      ) : null}

      {[-0.82, 0.82].map((x) => (
        <mesh key={x} position={[centre + x, -0.7, 0.14]}>
          <boxGeometry args={[0.07, 0.38, 1.1]} />
          <meshStandardMaterial color="#121920" roughness={0.86} />
        </mesh>
      ))}

      <group position={[centre, 0.43, 1.08]}>
        <mesh rotation={[0, 0.08, 0]}>
          <boxGeometry args={[0.24, 0.065, 0.025]} />
          <meshPhysicalMaterial color="#18222b" roughness={0.2} metalness={0.72} />
        </mesh>
        <mesh position={[0, 0.065, 0.01]}>
          <cylinderGeometry args={[0.012, 0.014, 0.1, 10]} />
          <meshStandardMaterial color="#11171d" roughness={0.58} />
        </mesh>
      </group>
    </group>
  );
}
