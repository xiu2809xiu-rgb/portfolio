"use client";

import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { PLAZA_RADIUS } from "@/content/drive-world";

/**
 * W O R K, standing in the plaza where the car spawns.
 *
 * These were four identical slabs. The code said they were letters, the comment
 * said they were letters, and they rendered as blank green boxes — which is the
 * first thing anyone sees on arriving, and said nothing at all.
 *
 * They are drawn as strokes now: each letter is a list of line segments in
 * metres, turned into boxes. No font file, no text geometry, no download. The
 * O is a torus because four straight strokes make a rectangle, and a rectangle
 * next to a real W and K reads as a D.
 */

/** Letter cell, in metres. */
const H = 4.4;
const THICK = 0.72;
const DEPTH = 0.95;

/** [ax, ay, bx, by] in metres, origin at the letter's base centre. */
type Stroke = readonly [number, number, number, number];

const W_STROKES: readonly Stroke[] = [
  [-1.45, H, -0.75, 0],
  [-0.75, 0, 0, H * 0.62],
  [0, H * 0.62, 0.75, 0],
  [0.75, 0, 1.45, H],
];

const R_STROKES: readonly Stroke[] = [
  [-1.0, 0, -1.0, H],
  [-1.0, H, 0.5, H],
  [0.5, H, 0.5, H * 0.58],
  [-1.0, H * 0.58, 0.5, H * 0.58],
  [-0.25, H * 0.58, 1.05, 0],
];

const K_STROKES: readonly Stroke[] = [
  [-1.0, 0, -1.0, H],
  [-0.92, H * 0.48, 0.95, H],
  [-0.92, H * 0.48, 0.95, 0],
];

/** One box spanning two points, slightly over-long so joins do not gap. */
function bar([ax, ay, bx, by]: Stroke) {
  const dx = bx - ax;
  const dy = by - ay;
  return {
    x: (ax + bx) / 2,
    y: (ay + by) / 2,
    length: Math.hypot(dx, dy) + THICK * 0.72,
    angle: Math.atan2(dy, dx),
  };
}

function Strokes({
  strokes,
  colour,
}: {
  strokes: readonly Stroke[];
  colour: string;
}) {
  const bars = useMemo(() => strokes.map(bar), [strokes]);
  return (
    <>
      {bars.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y, 0]}
          rotation={[0, 0, b.angle]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.length, THICK, DEPTH]} />
          <meshStandardMaterial
            color={colour}
            emissive={colour}
            emissiveIntensity={0.18}
            roughness={0.45}
            metalness={0.1}
          />
        </mesh>
      ))}
    </>
  );
}

const LIME = "#b4ff39";

export function PlazaLetters() {
  /* Spacing and placement kept from the version this replaces, so the letters
     still sit where the plaza was laid out for them. */
  const spacing = 5.4;
  const z = PLAZA_RADIUS - 4;

  /*
    Turned to face -Z, because that is the side the plaza is read from: the car
    spawns pointing away from these and comes back round to them, so the face
    they present is the one looking back towards the middle. Rotating the whole
    group rather than each glyph also reverses the letter order for free —
    without it the sign reads KROW, with every R and K mirrored.
  */
  return (
    <RigidBody type="fixed" name="letters">
      <group position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} position={[(i - 1.5) * spacing, 0, 0]}>
            {/*
            One collider per letter rather than one per stroke. The strokes are
            thin and diagonal; approximating each of them would add a dozen
            colliders to be pushed through for a hull nobody can feel the shape
            of at 40kph.
          */}
            <CuboidCollider
              args={[1.7, H / 2, DEPTH / 2]}
              position={[0, H / 2, 0]}
            />
            {i === 0 ? <Strokes strokes={W_STROKES} colour={LIME} /> : null}
            {i === 1 ? <LetterO /> : null}
            {i === 2 ? <Strokes strokes={R_STROKES} colour={LIME} /> : null}
            {i === 3 ? <Strokes strokes={K_STROKES} colour={LIME} /> : null}
          </group>
        ))}
      </group>
    </RigidBody>
  );
}

function LetterO() {
  return (
    <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
      {/* Radial segments kept low so it matches the faceting of everything else
          in the world rather than being the one smooth object in it. */}
      <torusGeometry args={[H / 2 - THICK / 2, THICK / 2, 6, 16]} />
      <meshStandardMaterial
        color={LIME}
        emissive={LIME}
        emissiveIntensity={0.18}
        roughness={0.45}
        metalness={0.1}
      />
    </mesh>
  );
}
