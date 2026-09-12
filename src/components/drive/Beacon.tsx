'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { districtGate } from '@/content/drive-world';
import type { ZoneState } from './Zones';

/**
 * A column of light over wherever you are meant to go next.
 *
 * The compass in the HUD tells you the direction; this tells you the place. One
 * without the other is worse than either: a needle alone gives you a bearing
 * into a treeline with no idea how far, and a marker alone disappears the moment
 * it is behind you.
 *
 * Tall enough to clear the woodland — the treeline is the thing it has to be
 * seen over, and a marker you have to already be close to is no help at all.
 */
const HEIGHT = 44;

export function Beacon({ zoneRef }: { zoneRef: React.RefObject<ZoneState> }) {
  const group = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const placed = useRef(-1);

  useFrame((state) => {
    const zone = zoneRef.current;
    const node = group.current;
    if (!node || !zone) return;

    /* Nothing left to point at once every chapter has been reached. */
    if (!zone.target) {
      node.visible = false;
      return;
    }
    node.visible = true;

    /* Only move it when the target actually changes — recomputing a gate
       position every frame to write the same two numbers is pure waste. */
    if (zone.version !== placed.current) {
      placed.current = zone.version;
      const [x, z] = districtGate(zone.target);
      node.position.set(x, 0, z);
    }

    const t = state.clock.elapsedTime;
    if (shaft.current) shaft.current.opacity = 0.22 + Math.sin(t * 1.8) * 0.07;
    if (ring.current) {
      /* A slow ground ripple. Motion is what makes it read as a marker rather
         than as a piece of scenery someone left standing there. */
      const pulse = (t * 0.55) % 1;
      ring.current.scale.setScalar(3 + pulse * 9);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - pulse);
    }
  });

  return (
    <group ref={group}>
      {/* The shaft. Open-ended and double-sided so it reads as light rather
          than as a solid post, and depthWrite off so it never punches a hole
          in whatever is behind it. */}
      <mesh position={[0, HEIGHT / 2, 0]}>
        <cylinderGeometry args={[1.15, 2.1, HEIGHT, 14, 1, true]} />
        <meshBasicMaterial
          ref={shaft}
          color="#b4ff39"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.85, 1, 40]} />
        <meshBasicMaterial
          color="#b4ff39"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
