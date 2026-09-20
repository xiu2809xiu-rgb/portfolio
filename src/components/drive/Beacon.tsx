'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { districtGate } from '@/content/drive-world';
import type { ZoneState } from './Zones';

/** A restrained navigation beacon that stays readable without tinting the view. */
const HEIGHT = 38;
const NAVIGATION_BLUE = new THREE.Color('#77d7ff');
const NAVIGATION_LIME = new THREE.Color('#c6f36b');

export function Beacon({ zoneRef }: { zoneRef: React.RefObject<ZoneState> }) {
  const group = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.MeshBasicMaterial>(null);
  const ringMesh = useRef<THREE.Mesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const placed = useRef(-1);

  useFrame((state) => {
    const zone = zoneRef.current;
    const node = group.current;
    if (!node || !zone) return;

    if (!zone.target) {
      node.visible = false;
      return;
    }

    if (zone.version !== placed.current) {
      placed.current = zone.version;
      const [x, z] = districtGate(zone.target);
      node.position.set(x, 0, z);
      const colour = zone.target.accent === 'aqua' ? NAVIGATION_BLUE : NAVIGATION_LIME;
      shaft.current?.color.copy(colour);
      ringMaterial.current?.color.copy(colour);
    }

    const distance = Math.hypot(
      state.camera.position.x - node.position.x,
      state.camera.position.z - node.position.z,
    );
    /* Fade before the camera can enter the beam. FrontSide below is the second
       guard: even a fast car crossing the threshold cannot paint the viewport. */
    const proximity = THREE.MathUtils.smoothstep(distance, 7, 22);
    node.visible = proximity > 0.01;

    const t = state.clock.elapsedTime;
    if (shaft.current) {
      shaft.current.opacity = (0.075 + Math.sin(t * 1.55) * 0.018) * proximity;
    }
    if (ringMesh.current && ringMaterial.current) {
      const pulse = (t * 0.42) % 1;
      ringMaterial.current.opacity = 0.26 * (1 - pulse) * proximity;
      ringMesh.current.scale.setScalar(1.8 + pulse * 4.8);
    }
  });

  return (
    <group ref={group}>
      <mesh position={[0, HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.38, 0.78, HEIGHT, 24, 1, true]} />
        <meshBasicMaterial
          ref={shaft}
          color={NAVIGATION_BLUE}
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
          depthWrite={false}
          toneMapped
        />
      </mesh>

      <mesh ref={ringMesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
        <ringGeometry args={[0.82, 1, 64]} />
        <meshBasicMaterial
          ref={ringMaterial}
          color={NAVIGATION_BLUE}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped
        />
      </mesh>
    </group>
  );
}
