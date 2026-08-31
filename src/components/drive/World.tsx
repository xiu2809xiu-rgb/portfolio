'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import {
  districtCentre,
  districtGate,
  districts,
  HALF,
  inDistrict,
  onRoad,
  PLAZA_RADIUS,
  RING_RADIUS,
  ROAD_WIDTH,
  SPUR_WIDTH,
  spurBearings,
  type District,
} from '@/content/drive-world';
import type { DayNight } from './useDayNight';

/**
 * The world, laid out from `content/drive-world`.
 *
 * Nothing here chooses where anything goes — the map data does, and this reads
 * it. Trees are excluded by the same `onRoad` predicate that draws the tarmac,
 * so a tree can never grow through a road, and district clearings come from the
 * same radii that place the buildings. The previous version scattered blocks at
 * random and had no idea where its own roads were.
 */

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function World({ clock }: { clock: React.RefObject<DayNight> }) {
  return (
    <>
      <Terrain />
      <Roads />
      <PlazaLetters />
      <Districts clock={clock} />
      <Trees />
      <StreetLamps clock={clock} />
      <Crates />
      <Boundary />
    </>
  );
}

/** Grass everywhere, with the tarmac laid on top of it. */
function Terrain() {
  return (
    <RigidBody type="fixed" friction={1.1} restitution={0.02} name="ground">
      <CuboidCollider args={[HALF, 0.5, HALF]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color="#16301c" roughness={0.98} />
      </mesh>
    </RigidBody>
  );
}

/**
 * The road network: a plaza, a ring, four radial spurs, and an access road into
 * each district. Drawn slightly proud of the grass so it never z-fights.
 */
function Roads() {
  const spurs = useMemo(
    () =>
      spurBearings.map((bearing) => {
        const angle = (bearing * Math.PI) / 180;
        const mid = (PLAZA_RADIUS + RING_RADIUS) / 2;
        return {
          bearing,
          x: Math.sin(angle) * mid,
          z: -Math.cos(angle) * mid,
          length: RING_RADIUS - PLAZA_RADIUS,
          rotation: -angle,
        };
      }),
    [],
  );

  const access = useMemo(
    () =>
      districts.map((district) => {
        const angle = (district.bearing * Math.PI) / 180;
        const mid = RING_RADIUS + district.radius * 0.4;
        return {
          x: Math.sin(angle) * mid,
          z: -Math.cos(angle) * mid,
          length: district.radius * 0.9,
          rotation: -angle,
        };
      }),
    [],
  );

  return (
    <group>
      {/* Plaza */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 64]} />
        <meshStandardMaterial color="#22262c" roughness={0.85} />
      </mesh>

      {/* Ring road */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[RING_RADIUS - ROAD_WIDTH / 2, RING_RADIUS + ROAD_WIDTH / 2, 96]} />
        <meshStandardMaterial color="#22262c" roughness={0.85} />
      </mesh>
      {/* Centre line, dashed by using a thin ring of segments */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RING_RADIUS - 0.12, RING_RADIUS + 0.12, 180, 1, 0, Math.PI * 2]} />
        <meshStandardMaterial color="#d8dee6" opacity={0.5} transparent />
      </mesh>

      {[...spurs, ...access].map((strip, i) => (
        <mesh
          key={i}
          position={[strip.x, 0.02, strip.z]}
          rotation={[-Math.PI / 2, 0, strip.rotation]}
          receiveShadow
        >
          <planeGeometry args={[SPUR_WIDTH, strip.length]} />
          <meshStandardMaterial color="#22262c" roughness={0.85} />
        </mesh>
      ))}

      {/* Plaza edging, so the open middle reads as a place rather than a gap. */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAZA_RADIUS - 0.3, PLAZA_RADIUS, 64]} />
        <meshStandardMaterial color="#b4ff39" emissive="#b4ff39" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** W O R K, standing in the plaza where the car spawns. */
function PlazaLetters() {
  const letters = ['W', 'O', 'R', 'K'];
  return (
    <RigidBody type="fixed" name="letters">
      {letters.map((letter, i) => (
        <group key={letter} position={[(i - 1.5) * 5.4, 0, PLAZA_RADIUS - 4]}>
          <CuboidCollider args={[1.9, 2.2, 0.5]} position={[0, 2.2, 0]} />
          <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 4.4, 1]} />
            <meshStandardMaterial color="#b4ff39" emissive="#b4ff39" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}

/** Buildings and a lit gate for each chapter. */
function Districts({ clock }: { clock: React.RefObject<DayNight> }) {
  return (
    <>
      {districts.map((district) => (
        <DistrictBlock key={district.id} district={district} clock={clock} />
      ))}
    </>
  );
}

function DistrictBlock({
  district,
  clock,
}: {
  district: District;
  clock: React.RefObject<DayNight>;
}) {
  const [cx, cz] = districtCentre(district);
  const [gx, gz] = districtGate(district);
  const accent = district.accent === 'lime' ? '#b4ff39' : '#39ffd8';
  const yaw = -(district.bearing * Math.PI) / 180;

  const blocks = useMemo(() => massing(district), [district]);
  const glowRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame(() => {
    const lit = clock.current ? 1 - clock.current.daylight : 0;
    for (const material of glowRefs.current) {
      if (material) material.emissiveIntensity = 0.25 + lit * 2.6;
    }
  });

  return (
    <group>
      {/* Cleared apron, so the district reads as built-up ground. */}
      <mesh position={[cx, 0.015, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[district.radius, 48]} />
        <meshStandardMaterial color="#1c2128" roughness={0.9} />
      </mesh>

      <RigidBody type="fixed" name={`district-${district.id}`}>
        {blocks.map((block, i) => (
          <group key={i} position={[cx + block.x, 0, cz + block.z]} rotation={[0, yaw, 0]}>
            <CuboidCollider
              args={[block.w / 2, block.h / 2, block.d / 2]}
              position={[0, block.h / 2, 0]}
            />
            <mesh position={[0, block.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[block.w, block.h, block.d]} />
              <meshStandardMaterial color="#161c24" roughness={0.75} metalness={0.1} />
            </mesh>
            {Array.from({ length: Math.max(1, Math.floor(block.h / 2.6)) }, (_, band) => (
              <mesh key={band} position={[0, 1.5 + band * 2.4, block.d / 2 + 0.02]}>
                <planeGeometry args={[block.w * 0.68, 0.44]} />
                <meshStandardMaterial
                  ref={(material) => {
                    if (material) glowRefs.current.push(material);
                  }}
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={0.5}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* The gate: two posts and a lintel, standing on the ring. */}
        <group position={[gx, 0, gz]} rotation={[0, yaw, 0]}>
          {[-SPUR_WIDTH / 2 - 0.6, SPUR_WIDTH / 2 + 0.6].map((x) => (
            <group key={x}>
              <CuboidCollider args={[0.3, 3, 0.3]} position={[x, 3, 0]} />
              <mesh position={[x, 3, 0]} castShadow>
                <boxGeometry args={[0.6, 6, 0.6]} />
                <meshStandardMaterial color="#1a2029" roughness={0.6} metalness={0.3} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 6.2, 0]} castShadow>
            <boxGeometry args={[SPUR_WIDTH + 2.4, 0.9, 0.5]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.9}
              toneMapped={false}
            />
          </mesh>
        </group>
      </RigidBody>
    </group>
  );
}

/** Each district is massed differently, so they are told apart at a distance. */
function massing(district: District) {
  const random = seeded(district.bearing * 977 + 13);
  const r = district.radius;

  switch (district.form) {
    case 'campus':
      // Low, wide, arranged around a quad.
      return [
        { x: -r * 0.45, z: 0, w: 5, d: 12, h: 5 },
        { x: r * 0.45, z: 0, w: 5, d: 12, h: 5 },
        { x: 0, z: -r * 0.5, w: 14, d: 5, h: 6.5 },
      ];
    case 'arena':
      // One big hall with a podium in front of it.
      return [
        { x: 0, z: -r * 0.35, w: 16, d: 11, h: 9 },
        { x: -5.5, z: r * 0.35, w: 2.6, d: 2.6, h: 2.4 },
        { x: 0, z: r * 0.4, w: 3, d: 3, h: 3.4 },
        { x: 5.5, z: r * 0.35, w: 2.6, d: 2.6, h: 1.8 },
      ];
    case 'studio':
      // A cluster of small studios at odd angles.
      return Array.from({ length: 5 }, () => ({
        x: (random() - 0.5) * r * 1.1,
        z: (random() - 0.5) * r * 1.1,
        w: 3.4 + random() * 2,
        d: 3.4 + random() * 2,
        h: 3.5 + random() * 3.5,
      }));
    case 'workshop':
      // Long sheds and a tall stack.
      return [
        { x: -3, z: 0, w: 8, d: 16, h: 6 },
        { x: 6, z: -3, w: 6, d: 9, h: 5 },
        { x: 8, z: 6, w: 2.2, d: 2.2, h: 14 },
      ];
    case 'court':
      // A low pavilion beside an open court.
      return [
        { x: -r * 0.4, z: 0, w: 6, d: 10, h: 4.5 },
        { x: r * 0.3, z: -r * 0.4, w: 3, d: 3, h: 3 },
      ];
    case 'lookout':
    default:
      // A single tower you can see from anywhere on the ring.
      return [
        { x: 0, z: 0, w: 5, d: 5, h: 22 },
        { x: -6, z: 4, w: 4, d: 4, h: 4 },
      ];
  }
}

/**
 * Trees, placed by rule rather than scattered.
 *
 * Rejection sampling against the same predicates the roads and districts are
 * drawn from, plus a density that rises toward the edge of the map — so the wood
 * thickens into a treeline that reads as the boundary, instead of the invisible
 * wall the old version stopped you with.
 */
function Trees() {
  const trees = useMemo(() => {
    const random = seeded(20260901);
    const out: { x: number; z: number; scale: number; spin: number }[] = [];
    let guard = 0;

    while (out.length < 260 && guard < 20000) {
      guard += 1;
      const x = (random() - 0.5) * 2 * (HALF - 2);
      const z = (random() - 0.5) * 2 * (HALF - 2);
      const fromCentre = Math.hypot(x, z);

      if (onRoad(x, z)) continue;
      if (inDistrict(x, z)) continue;
      // Keep the gates and their approaches visible.
      if (districts.some((d) => {
        const [gx, gz] = districtGate(d);
        return Math.hypot(x - gx, z - gz) < 12;
      })) continue;

      // Denser further out: sparse parkland inside the ring, forest beyond it.
      const density = THREE.MathUtils.clamp((fromCentre - PLAZA_RADIUS) / (HALF - PLAZA_RADIUS), 0, 1);
      if (random() > 0.25 + density * 0.75) continue;
      if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3.4)) continue;

      out.push({ x, z, scale: 0.7 + random() * 0.9, spin: random() * Math.PI });
    }
    return out;
  }, []);

  return (
    <>
      <Instances limit={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.23, 1.7, 6]} />
        <meshStandardMaterial color="#2b2118" roughness={0.95} />
        {trees.map((tree, i) => (
          <Instance key={i} position={[tree.x, 0.85 * tree.scale, tree.z]} scale={tree.scale} />
        ))}
      </Instances>

      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.6, 4, 7]} />
        <meshStandardMaterial color="#1d6b37" roughness={0.9} flatShading />
        {trees.map((tree, i) => (
          <Instance
            key={i}
            position={[tree.x, 3.3 * tree.scale, tree.z]}
            scale={tree.scale}
            rotation={[0, tree.spin, 0]}
          />
        ))}
      </Instances>

      <RigidBody type="fixed" name="trees">
        {trees.map((tree, i) => (
          <CylinderCollider
            key={i}
            args={[1.7 * tree.scale, 0.38 * tree.scale]}
            position={[tree.x, 1.7 * tree.scale, tree.z]}
          />
        ))}
      </RigidBody>
    </>
  );
}

/** Lamps along the ring road, lit by the clock rather than by a toggle. */
function StreetLamps({ clock }: { clock: React.RefObject<DayNight> }) {
  const posts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const radius = RING_RADIUS + (i % 2 === 0 ? ROAD_WIDTH / 2 + 1.4 : -ROAD_WIDTH / 2 - 1.4);
        return { x: Math.sin(angle) * radius, z: -Math.cos(angle) * radius };
      }),
    [],
  );

  const bulbs = useRef<THREE.MeshStandardMaterial[]>([]);
  const lights = useRef<THREE.PointLight[]>([]);

  useFrame(() => {
    const lit = clock.current ? 1 - clock.current.daylight : 0;
    for (const bulb of bulbs.current) if (bulb) bulb.emissiveIntensity = 0.3 + lit * 3.4;
    for (const light of lights.current) {
      if (!light) continue;
      light.intensity = lit * 26;
      // Switching them off entirely below the threshold saves the shadow work.
      light.visible = lit > 0.08;
    }
  });

  return (
    <>
      <RigidBody type="fixed" name="lamps">
        {posts.map((post, i) => (
          <CylinderCollider key={i} args={[2.6, 0.15]} position={[post.x, 2.6, post.z]} />
        ))}
      </RigidBody>

      <Instances limit={posts.length} castShadow>
        <cylinderGeometry args={[0.11, 0.15, 5.2, 8]} />
        <meshStandardMaterial color="#232b34" roughness={0.6} metalness={0.4} />
        {posts.map((post, i) => (
          <Instance key={i} position={[post.x, 2.6, post.z]} />
        ))}
      </Instances>

      {posts.map((post, i) => (
        <group key={i} position={[post.x, 5.3, post.z]}>
          <mesh>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) bulbs.current.push(material);
              }}
              color="#f2ffd8"
              emissive="#f2ffd8"
              emissiveIntensity={0.3}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={(light) => {
              if (light) lights.current.push(light);
            }}
            color="#e8ffb0"
            intensity={0}
            distance={18}
            decay={2}
          />
        </group>
      ))}
    </>
  );
}

/** Crate stacks on the plaza and at two lay-bys, purely to be driven into. */
function Crates() {
  const crates = useMemo(() => {
    const random = seeded(515);
    const stacks: [number, number][] = [
      [-10, 4],
      [11, -3],
      [RING_RADIUS - 14, RING_RADIUS - 14],
    ];
    return stacks.flatMap((stack, s) =>
      Array.from({ length: 6 }, (_, i) => ({
        key: `${s}-${i}`,
        x: stack[0] + (random() - 0.5) * 1.7,
        y: 0.52 + Math.floor(i / 2) * 1.04,
        z: stack[1] + (random() - 0.5) * 1.7,
        spin: random() * Math.PI,
      })),
    );
  }, []);

  return (
    <>
      {crates.map((crate) => (
        <RigidBody
          key={crate.key}
          position={[crate.x, crate.y, crate.z]}
          rotation={[0, crate.spin, 0]}
          colliders={false}
          mass={12}
          friction={0.6}
          restitution={0.1}
        >
          <CuboidCollider args={[0.5, 0.5, 0.5]} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6b5433" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

/** The map's edge. The treeline hides it; this stops the car leaving. */
function Boundary() {
  const h = 6;
  return (
    <RigidBody type="fixed" name="boundary">
      <CuboidCollider args={[HALF, h, 0.5]} position={[0, h, HALF]} />
      <CuboidCollider args={[HALF, h, 0.5]} position={[0, h, -HALF]} />
      <CuboidCollider args={[0.5, h, HALF]} position={[HALF, h, 0]} />
      <CuboidCollider args={[0.5, h, HALF]} position={[-HALF, h, 0]} />
    </RigidBody>
  );
}
