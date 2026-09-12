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
  PLAZA_RADIUS,
  RING_RADIUS,
  ROAD_WIDTH,
  SPUR_WIDTH,
  spurBearings,
  type District,
} from '@/content/drive-world';
import { grassMaps, tarmacMaps } from './textures';
import { Trees } from './Trees';
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

/**
 * Grass everywhere, with the tarmac laid on top of it.
 *
 * The albedo used to be #16301c, which is 2.4% linear reflectance — darker than
 * coal, and about a tenth of what real grass returns. That, and not the lighting,
 * is why sunlit ground was resolving to near-black under a bright sky. The
 * texture carries the colour now, so the material tint stays white and lets it
 * through unchanged.
 */
function Terrain() {
  const maps = useMemo(() => grassMaps(), []);
  return (
    <RigidBody type="fixed" friction={1.1} restitution={0.02} name="ground">
      <CuboidCollider args={[HALF, 0.5, HALF]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial
          map={maps.map}
          normalMap={maps.normalMap}
          roughnessMap={maps.roughnessMap}
          normalScale={NORMAL_SCALE}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}

/** Shared so every surface gets the same normal strength without reallocating. */
const NORMAL_SCALE = new THREE.Vector2(0.85, 0.85);

/**
 * The road network: a plaza, a ring, four radial spurs, and an access road into
 * each district. Drawn slightly proud of the grass so it never z-fights.
 */
function Roads() {
  const tarmac = useMemo(() => tarmacMaps(), []);
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
        <Tarmac maps={tarmac} />
      </mesh>

      {/* Ring road */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[RING_RADIUS - ROAD_WIDTH / 2, RING_RADIUS + ROAD_WIDTH / 2, 96]} />
        <Tarmac maps={tarmac} />
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
          <Tarmac maps={tarmac} />
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

/** One material description, reused by every piece of road surface. */
function Tarmac({ maps }: { maps: ReturnType<typeof tarmacMaps> }) {
  return (
    <meshStandardMaterial
      map={maps.map}
      normalMap={maps.normalMap}
      roughnessMap={maps.roughnessMap}
      normalScale={NORMAL_SCALE}
      roughness={1}
      metalness={0}
    />
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
        <meshStandardMaterial color="#6f7379" roughness={0.92} metalness={0} />
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
