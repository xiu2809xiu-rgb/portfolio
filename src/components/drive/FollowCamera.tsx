'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { CarHandle } from './Car';

const BEHIND = 8.5;
const HEIGHT = 3.6;
const LOOK_AHEAD = 4;

/**
 * Chase camera.
 *
 * Two things stop this feeling like a camera bolted to a bumper. It trails the
 * car's *heading* rather than its velocity, so reversing or sliding sideways
 * does not whip the view around; and it eases toward the target with a
 * frame-rate-independent lerp, so the lag is the same on a 60Hz laptop and a
 * 144Hz monitor — a plain `lerp(0.1)` would make the camera three times tighter
 * on a fast display and feel like a different game.
 */
export function FollowCamera({ handle }: { handle: React.RefObject<CarHandle> }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const smoothed = useRef(new THREE.Vector3(0, HEIGHT, -BEHIND));
  const lookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const body = handle.current?.body;
    if (!body) return;

    const t = body.translation();
    const r = body.rotation();
    const quat = new THREE.Quaternion(r.x, r.y, r.z, r.w);

    // The car's own forward, flattened so a wheelie does not point the camera skyward.
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    forward.y = 0;
    if (forward.lengthSq() < 1e-4) forward.set(0, 0, 1);
    forward.normalize();

    // Pull back faster the quicker you are going, which sells the speed.
    const speed = handle.current?.speedKph ?? 0;
    const distance = BEHIND + Math.min(speed / 26, 3);

    desired.current
      .set(t.x, t.y, t.z)
      .addScaledVector(forward, -distance)
      .add(new THREE.Vector3(0, HEIGHT, 0));

    /*
      Exponential smoothing rather than a fixed lerp factor: the 1 - e^(-k·dt)
      form converges at the same rate per second regardless of frame rate.
    */
    const ease = 1 - Math.exp(-6 * delta);
    smoothed.current.lerp(desired.current, ease);
    camera.position.copy(smoothed.current);

    target.current.set(t.x, t.y, t.z).addScaledVector(forward, LOOK_AHEAD);
    lookAt.current.lerp(target.current, 1 - Math.exp(-9 * delta));
    camera.lookAt(lookAt.current);
  });

  return null;
}
