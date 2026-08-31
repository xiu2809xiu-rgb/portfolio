'use client';

import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';

export const ARENA = 52;

/**
 * The world the car drives around.
 *
 * Every shape is a primitive placed by a seeded generator rather than a modelled
 * scene: there is no low-poly asset pack in this project, and buying one would
 * cost a licence and several megabytes for something the player drives past at
 * 45kph. Trees and street furniture are instanced, so a hundred of them are one
 * draw call each rather than a hundred.
 *
 * Layout is deliberate rather than scattered. A clear plaza in the middle to
 * learn the handling, a ring of trees that hides what is behind it, a cluster of
 * towers to thread through, ramps on the long straights, and stacks of crates
 * that exist purely to be driven into.
 */

/** Mulberry32 — small, fast, and identical every run, which a scene needs. */
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

const PLAZA_RADIUS = 17;

export function World({ night }: { night: boolean }) {
  const trees = useMemo(() => {
    const random = seeded(20260831);
    const out: { x: number; z: number; scale: number; tilt: number }[] = [];
    let guard = 0;
    while (out.length < 84 && guard < 4000) {
      guard += 1;
      const x = (random() - 0.5) * 2 * (ARENA - 4);
      const z = (random() - 0.5) * 2 * (ARENA - 4);
      const fromCentre = Math.hypot(x, z);
      // Keep the plaza clear, and leave the tower district alone.
      if (fromCentre < PLAZA_RADIUS + 4) continue;
      if (x > 12 && x < 44 && z > -40 && z < -8) continue;
      if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 4.5)) continue;
      out.push({ x, z, scale: 0.75 + random() * 0.8, tilt: (random() - 0.5) * 0.14 });
    }
    return out;
  }, []);

  const towers = useMemo(() => {
    const random = seeded(77);
    return Array.from({ length: 13 }, (_, i) => {
      const x = 16 + (i % 4) * 8.5 + random() * 2;
      const z = -12 - Math.floor(i / 4) * 9 - random() * 2;
      return {
        x,
        z,
        w: 2.6 + random() * 2.4,
        d: 2.6 + random() * 2.4,
        h: 5 + random() * 13,
      };
    });
  }, []);

  const crates = useMemo(() => {
    const random = seeded(4242);
    const stacks = [
      { x: -22, z: 6 },
      { x: -26, z: -14 },
      { x: 4, z: 26 },
      { x: -8, z: -28 },
    ];
    return stacks.flatMap((stack, s) =>
      Array.from({ length: 6 }, (_, i) => ({
        key: `${s}-${i}`,
        x: stack.x + (random() - 0.5) * 1.6,
        y: 0.5 + Math.floor(i / 2) * 1.02,
        z: stack.z + (random() - 0.5) * 1.6,
        spin: random() * Math.PI,
      })),
    );
  }, []);

  return (
    <>
      <Ground />
      <Plaza />
      <Trees trees={trees} />
      <Towers towers={towers} night={night} />
      <Ramps />
      <LetterBlocks />
      <Crates crates={crates} />
      <LampPosts night={night} />
      <Walls />
    </>
  );
}

function Ground() {
  return (
    <RigidBody type="fixed" friction={1.1} restitution={0.02} name="ground">
      <CuboidCollider args={[ARENA, 0.5, ARENA]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA * 2, ARENA * 2]} />
        <meshStandardMaterial color="#0c1117" roughness={0.96} />
      </mesh>
    </RigidBody>
  );
}

/** A paler disc in the middle, so the open area reads as a place rather than a gap. */
function Plaza() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 64]} />
        <meshStandardMaterial color="#141b23" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAZA_RADIUS - 0.35, PLAZA_RADIUS, 64]} />
        <meshStandardMaterial color="#b4ff39" emissive="#b4ff39" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Instanced trees.
 *
 * Two `Instances` groups — trunks and canopies — so the whole wood is two draw
 * calls. Their colliders are one fixed body holding many cylinders, which is far
 * cheaper for the broad phase than one body each.
 */
function Trees({ trees }: { trees: { x: number; z: number; scale: number; tilt: number }[] }) {
  return (
    <>
      <Instances limit={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.6, 6]} />
        <meshStandardMaterial color="#2a2118" roughness={0.95} />
        {trees.map((tree, i) => (
          <Instance
            key={i}
            position={[tree.x, 0.8 * tree.scale, tree.z]}
            scale={tree.scale}
            rotation={[tree.tilt, 0, 0]}
          />
        ))}
      </Instances>

      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.5, 3.6, 7]} />
        <meshStandardMaterial color="#1f7a3d" roughness={0.85} flatShading />
        {trees.map((tree, i) => (
          <Instance
            key={i}
            position={[tree.x, (1.6 + 1.8) * tree.scale, tree.z]}
            scale={tree.scale}
            rotation={[tree.tilt, i, 0]}
          />
        ))}
      </Instances>

      <RigidBody type="fixed" name="trees">
        {trees.map((tree, i) => (
          <CylinderCollider
            key={i}
            args={[1.6 * tree.scale, 0.4 * tree.scale]}
            position={[tree.x, 1.6 * tree.scale, tree.z]}
          />
        ))}
      </RigidBody>
    </>
  );
}

/** A small district of towers with lit window strips. */
function Towers({
  towers,
  night,
}: {
  towers: { x: number; z: number; w: number; d: number; h: number }[];
  night: boolean;
}) {
  return (
    <RigidBody type="fixed" name="towers">
      {towers.map((tower, i) => (
        <group key={i} position={[tower.x, 0, tower.z]}>
          <CuboidCollider
            args={[tower.w / 2, tower.h / 2, tower.d / 2]}
            position={[0, tower.h / 2, 0]}
          />
          <mesh position={[0, tower.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[tower.w, tower.h, tower.d]} />
            <meshStandardMaterial color="#10161e" roughness={0.7} metalness={0.15} />
          </mesh>

          {/* Window bands, brighter after dark. */}
          {Array.from({ length: Math.max(2, Math.floor(tower.h / 2.4)) }, (_, band) => (
            <mesh
              key={band}
              position={[0, 1.6 + band * 2.2, tower.d / 2 + 0.01]}
            >
              <planeGeometry args={[tower.w * 0.72, 0.5]} />
              <meshStandardMaterial
                color={band % 3 === 0 ? '#39ffd8' : '#b4ff39'}
                emissive={band % 3 === 0 ? '#39ffd8' : '#b4ff39'}
                emissiveIntensity={night ? 2.4 : 0.5}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </RigidBody>
  );
}

/** Two launch ramps on the long straights. */
function Ramps() {
  const ramps: { pos: [number, number, number]; rot: number; yaw: number }[] = [
    { pos: [-32, 0.9, 26], rot: -0.3, yaw: 0 },
    { pos: [26, 0.9, 30], rot: -0.3, yaw: Math.PI },
    { pos: [-2, 0.75, -34], rot: -0.24, yaw: Math.PI / 2 },
  ];
  return (
    <RigidBody type="fixed" friction={0.9} name="ramps">
      {ramps.map((ramp, i) => (
        <group key={i} position={ramp.pos} rotation={[0, ramp.yaw, 0]}>
          <CuboidCollider args={[3.4, 0.22, 5]} rotation={[ramp.rot, 0, 0]} />
          <mesh rotation={[ramp.rot, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.8, 0.44, 10]} />
            <meshStandardMaterial color="#1b232c" roughness={0.8} />
          </mesh>
          <mesh rotation={[ramp.rot, 0, 0]} position={[0, 0.24, 0]}>
            <boxGeometry args={[6.9, 0.04, 1.2]} />
            <meshStandardMaterial color="#b4ff39" emissive="#b4ff39" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}

/** W O R K, standing in the plaza as solid blocks — the site's own letters. */
function LetterBlocks() {
  const letters: { char: string; x: number }[] = [
    { char: 'W', x: -9 },
    { char: 'O', x: -3 },
    { char: 'R', x: 3 },
    { char: 'K', x: 9 },
  ];
  return (
    <RigidBody type="fixed" name="letters">
      {letters.map((letter, i) => (
        <group key={letter.char} position={[letter.x, 0, -PLAZA_RADIUS + 2.5]}>
          <CuboidCollider args={[1.9, 2.2, 0.5]} position={[0, 2.2, 0]} />
          <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 4.4, 1]} />
            <meshStandardMaterial
              color="#b4ff39"
              emissive="#b4ff39"
              emissiveIntensity={i % 2 === 0 ? 0.22 : 0.12}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}

/** Stacks of crates that exist to be driven into. */
function Crates({
  crates,
}: {
  crates: { key: string; x: number; y: number; z: number; spin: number }[];
}) {
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
          <mesh>
            <boxGeometry args={[1.02, 0.14, 1.02]} />
            <meshStandardMaterial color="#8a6c42" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

/**
 * Lamp posts around the plaza.
 *
 * Their point lights only exist at night — eight live lights in daylight is a
 * cost with nothing to show for it, since the directional sun already lights
 * everything they would.
 */
function LampPosts({ night }: { night: boolean }) {
  const posts = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return { x: Math.cos(angle) * (PLAZA_RADIUS + 2.5), z: Math.sin(angle) * (PLAZA_RADIUS + 2.5) };
  });

  return (
    <>
      <RigidBody type="fixed" name="lamps">
        {posts.map((post, i) => (
          <CylinderCollider key={i} args={[2.4, 0.16]} position={[post.x, 2.4, post.z]} />
        ))}
      </RigidBody>

      <Instances limit={posts.length} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 4.8, 8]} />
        <meshStandardMaterial color="#232b34" roughness={0.6} metalness={0.4} />
        {posts.map((post, i) => (
          <Instance key={i} position={[post.x, 2.4, post.z]} />
        ))}
      </Instances>

      {posts.map((post, i) => (
        <group key={i} position={[post.x, 4.9, post.z]}>
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial
              color="#eaffd0"
              emissive="#eaffd0"
              emissiveIntensity={night ? 3 : 0.6}
              toneMapped={false}
            />
          </mesh>
          {night ? <pointLight color="#dfffa8" intensity={22} distance={16} decay={2} /> : null}
        </group>
      ))}
    </>
  );
}

/** Invisible perimeter, so the car cannot drive off into the fog forever. */
function Walls() {
  const h = 4;
  return (
    <RigidBody type="fixed" name="walls">
      <CuboidCollider args={[ARENA, h, 0.5]} position={[0, h, ARENA]} />
      <CuboidCollider args={[ARENA, h, 0.5]} position={[0, h, -ARENA]} />
      <CuboidCollider args={[0.5, h, ARENA]} position={[ARENA, h, 0]} />
      <CuboidCollider args={[0.5, h, ARENA]} position={[-ARENA, h, 0]} />
    </RigidBody>
  );
}
