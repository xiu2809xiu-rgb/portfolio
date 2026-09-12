'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Vehicle } from '@/content/drive-vehicles';
import type { CarHandle } from './Car';
import { clockLabel, type DayNight } from './useDayNight';
import type { DriveInputRef } from './useDriveControls';
import { VIEWS } from './FollowCamera';

/**
 * What you see from the driver's seat.
 *
 * Only exists because the cockpit camera sits *inside* the hull, and a box seen
 * from the inside is invisible — back faces are culled, so without this the
 * first-person view would be a floating camera with no car around it at all.
 *
 * Everything is positioned relative to the vehicle's own eye point, so the same
 * component works in the van (eye 0.86m up) and the roadster (0.42m) without a
 * per-car layout. The driver sits on the right, which is the correct side here.
 *
 * The whole group is hidden unless the cockpit view is active. Hidden, not
 * unmounted: the dashboard texture costs a canvas and a GPU upload to build, and
 * paying that every time someone taps V would be a stutter on every press.
 */

/** Matches the index of 'Cockpit' in the camera's view list. */
const COCKPIT_VIEW = VIEWS.indexOf('Cockpit');

const DIAL_SIZE = 512;

/* ── The instrument cluster ───────────────────────────────────────────────
   Drawn on a canvas rather than with 3D geometry or a text mesh: digits need to
   change several times a second, and a canvas redraw is far cheaper than
   rebuilding text geometry — and costs no font download at all. */

function drawCluster(
  ctx: CanvasRenderingContext2D,
  kph: number,
  revs: number,
  clock: string,
) {
  const W = DIAL_SIZE;
  const H = DIAL_SIZE / 2;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);

  /** One sweep gauge: arc, tick marks, needle. */
  const dial = (cx: number, value: number, max: number, label: string, accent: string) => {
    const radius = 58;
    const from = Math.PI * 0.78;
    const to = Math.PI * 2.22;
    const cy = H * 0.66;

    ctx.lineWidth = 7;
    ctx.strokeStyle = '#1b232c';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, from, to);
    ctx.stroke();

    const filled = from + (to - from) * Math.min(value / max, 1);
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, from, filled);
    ctx.stroke();

    /* Ticks. Without them a gauge is a progress bar. */
    ctx.strokeStyle = '#5b6672';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i += 1) {
      const a = from + ((to - from) * i) / 8;
      const inner = radius - 13;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * (radius - 4), cy + Math.sin(a) * (radius - 4));
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff5a45';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(filled) * (radius - 18), cy + Math.sin(filled) * (radius - 18));
    ctx.stroke();

    ctx.fillStyle = '#8b97a3';
    ctx.font = '600 15px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + radius - 4);
  };

  dial(96, Math.abs(kph), 120, 'KM/H', '#b4ff39');
  dial(W - 96, revs * 8, 8, 'x1000 RPM', '#39ffd8');

  /* The number itself, big, in the middle where a trip computer would be. */
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 84px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(Math.abs(kph))), W / 2, H * 0.42);

  ctx.fillStyle = '#6f7c89';
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText('KM/H', W / 2, H * 0.42 + 26);

  ctx.fillStyle = '#b4ff39';
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText(clock, W / 2, 26);
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
  const shown = useRef(0);

  const cluster = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = DIAL_SIZE;
    canvas.height = DIAL_SIZE / 2;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (ctx) drawCluster(ctx, 0, 0, '--:--');
    return { canvas, ctx, texture };
  }, []);

  useEffect(() => () => cluster.texture.dispose(), [cluster]);

  /*
    Mutating three.js objects and a canvas texture inside the frame loop, which
    the React Compiler reads as render-phase mutation. It is not: this is the
    render loop, and routing a camera position or a speedometer through state
    would re-render the scene sixty times a second.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const node = group.current;
    if (!node) return;

    const view = ((input.current.view % VIEWS.length) + VIEWS.length) % VIEWS.length;
    const active = view === COCKPIT_VIEW;
    node.visible = active;
    if (!active) return;

    /* The wheel turns about three times as far as the road wheels do, which is
       roughly a real steering rack and reads far better than 1:1. */
    if (wheel.current) wheel.current.rotation.z = -input.current.steer * 2.4;

    /*
      Redraw only when the displayed integer changes. At 60fps an unconditional
      redraw is sixty canvas rasterisations and sixty texture uploads a second to
      show the same two digits.
    */
    const kph = Math.abs(handle.current?.speedKph ?? 0);
    const rounded = Math.round(kph);
    if (rounded !== shown.current && cluster.ctx) {
      shown.current = rounded;
      const revs = Math.min(kph / 88, 1) * 0.8 + Math.abs(input.current.throttle) * 0.2;
      drawCluster(cluster.ctx, kph, revs, clock?.current ? clockLabel(clock.current.t) : '');
      cluster.texture.needsUpdate = true;
    }
  });
  /* eslint-enable react-hooks/immutability */

  const [ex, ey, ez] = vehicle.eye;
  /*
    Everything below is positioned relative to the driver's EYE, not the car
    origin, by putting the whole group there. The first version mixed the two —
    the wheel came from eye coordinates and the pillars from car coordinates —
    which put the rim 0.3m from the camera, filling the screen, and left an
    A-pillar in the middle of the view. One frame of reference removes the whole
    class of mistake.

    `centre` is where the car's centreline falls in that frame, so anything
    spanning the cabin stays symmetric about the car rather than about the
    driver.
  */
  const centre = -ex;

  return (
    <group ref={group} position={[ex, ey, ez]} visible={false}>
      {/* ── Dashboard ──
          A real wheel sits about 0.6m from your eyes, not 0.3m; at 0.3m it
          subtends most of the windscreen. These distances are the ones that
          make the cabin read as a car rather than as a toy held to your face. */}
      <mesh position={[centre, -0.6, 0.84]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.62, 0.34, 0.46]} />
        <meshStandardMaterial color="#12171d" roughness={0.88} metalness={0.04} />
      </mesh>

      {/* Lower fascia and floor. Without them the ground shows through under the
          dash and the cabin has no bottom. */}
      <mesh position={[centre, -0.94, 0.74]}>
        <boxGeometry args={[1.62, 0.44, 0.26]} />
        <meshStandardMaterial color="#0d1116" roughness={0.92} />
      </mesh>
      <mesh position={[centre, -1.18, 0.1]}>
        <boxGeometry args={[1.62, 0.07, 1.5]} />
        <meshStandardMaterial color="#0a0d11" roughness={0.95} />
      </mesh>

      {/* The bonnet, seen through the glass. */}
      <mesh position={[centre, -0.3, 1.9]} rotation={[-0.03, 0, 0]}>
        <boxGeometry args={[1.66, 0.05, 1.25]} />
        <meshPhysicalMaterial
          color={vehicle.paint}
          roughness={0.34}
          metalness={0.35}
          clearcoat={0.8}
        />
      </mesh>

      {/* ── Instruments, directly ahead of the driver ── */}
      <mesh position={[0, -0.19, 0.78]} rotation={[-0.26, 0, 0]}>
        <boxGeometry args={[0.46, 0.25, 0.03]} />
        <meshStandardMaterial color="#080b0e" roughness={0.9} />
      </mesh>
      {/*
        A thin box rather than a plane. A plane has one face, and that face
        points along +Z — away from a driver who is sitting at the origin looking
        forward — so it was being back-face culled and the instruments read as a
        dead black panel. Box faces are UV-mapped to be read from outside, so
        this shows the right way round with no mirroring to undo.

        It is offset towards the driver — MINUS the housing's local +Z, since
        that axis points down-field. Offsetting the other way buried it inside
        the housing, which looked identical to the culling bug above and cost a
        second round of guessing.
      */}
      <mesh position={[0, -0.1951, 0.7607]} rotation={[-0.26, 0, 0]}>
        <boxGeometry args={[0.41, 0.205, 0.012]} />
        <meshBasicMaterial map={cluster.texture} toneMapped={false} />
      </mesh>

      {/* ── Steering wheel ── */}
      <group ref={wheel} position={[0, -0.31, 0.58]} rotation={[-0.42, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.158, 0.018, 10, 30]} />
          <meshStandardMaterial color="#14181e" roughness={0.6} />
        </mesh>
        {/* Three spokes, the arrangement almost every car actually uses. */}
        {[-Math.PI / 2, Math.PI * 0.22, Math.PI * 0.78].map((a) => (
          <mesh key={a} rotation={[0, 0, a]} position={[0, 0, 0.004]}>
            <boxGeometry args={[0.142, 0.022, 0.014]} />
            <meshStandardMaterial color="#1b2027" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.007]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.02, 14]} />
          <meshStandardMaterial
            color={vehicle.trim}
            emissive={vehicle.trim}
            emissiveIntensity={0.25}
            roughness={0.4}
            metalness={0.4}
          />
        </mesh>

        {/*
          Hands at a quarter to three, parented to the wheel so they turn with
          it. Two blocks and a thumb each — at the size they occupy on screen,
          more detail is invisible and less reads as a glove.
        */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.154 * side, 0.012, 0.032]}>
            <mesh rotation={[0, 0, side * 0.3]}>
              <boxGeometry args={[0.05, 0.095, 0.062]} />
              <meshStandardMaterial color="#c08a63" roughness={0.84} />
            </mesh>
            <mesh position={[-0.024 * side, 0.04, 0.014]} rotation={[0, 0, side * 0.75]}>
              <boxGeometry args={[0.044, 0.022, 0.03]} />
              <meshStandardMaterial color="#b67f57" roughness={0.86} />
            </mesh>
            {/* Forearm, running back towards the shoulder and out of frame. */}
            <mesh position={[0.05 * side, -0.15, -0.03]} rotation={[1.3, 0, side * 0.3]}>
              <boxGeometry args={[0.044, 0.1, 0.044]} />
              <meshStandardMaterial color="#1e242b" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── A-pillars and header rail ──
          They do the same job here as in a real car: give the eye something
          fixed to judge the road's movement against. Pushed out to the corners
          of the screen so they frame the view instead of blocking it. */}
      {[-0.86, 0.86].map((x) => (
        <mesh
          key={x}
          position={[centre + x, 0.12, 0.8]}
          rotation={[0.3, 0, x > 0 ? -0.2 : 0.2]}
        >
          <boxGeometry args={[0.055, 0.86, 0.055]} />
          <meshStandardMaterial color="#171c23" roughness={0.86} />
        </mesh>
      ))}
      {vehicle.cabin ? (
        <mesh position={[centre, 0.46, 0.76]} rotation={[-0.16, 0, 0]}>
          <boxGeometry args={[1.72, 0.12, 0.4]} />
          <meshStandardMaterial color="#141920" roughness={0.88} />
        </mesh>
      ) : null}

      {/* Door cards at the edges of vision. */}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[centre + x, -0.64, 0.02]}>
          <boxGeometry args={[0.08, 0.5, 1.15]} />
          <meshStandardMaterial color="#161b21" roughness={0.88} />
        </mesh>
      ))}

      {/* Rear-view mirror, where one actually is. */}
      <group position={[centre, 0.34, 0.8]}>
        <mesh rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.2, 0.06, 0.028]} />
          <meshStandardMaterial color="#0e1217" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* A stalk up to the header rail. Without it the mirror hangs in the
            sky, which is exactly how it read. */}
        <mesh position={[0, 0.06, 0.01]}>
          <boxGeometry args={[0.03, 0.1, 0.02]} />
          <meshStandardMaterial color="#0e1217" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
