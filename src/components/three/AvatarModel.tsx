'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_URL = '/models/avatar.glb';

interface AvatarModelProps {
  /** Track name from `avatarClips.ts`. */
  clip: string;
  /** How strongly the head/torso follows the pointer. 0 disables it. */
  lookStrength?: number;
}

/**
 * The rigged avatar itself.
 *
 * Two details matter here:
 *
 * 1. Clip changes cross-fade rather than cut. `fadeOut`/`fadeIn` over ~0.35 s
 *    keeps the skeleton continuous, so switching from Idle to Dance does not
 *    snap the limbs through the model.
 * 2. The whole rig is nudged toward the pointer with a damped lerp, which reads
 *    as the avatar noticing you without fighting whichever clip is playing.
 */
export function AvatarModel({ clip, lookStrength = 0.18 }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const { viewport } = useThree();

  // Used directly rather than via `scene.clone(true)`: a plain Object3D clone
  // does not rebind a SkinnedMesh to the cloned skeleton, so the clone renders
  // frozen in its bind pose (a very convincing T-pose) while the mixer happily
  // animates bones nothing is listening to. The stage mounts one avatar, so
  // sharing the cached scene is both correct and cheaper.
  const model = useMemo(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // skinned bounds go stale mid-animation
      }
    });
    return scene;
  }, [scene]);

  useEffect(() => {
    const next = actions[clip];
    if (!next) return;

    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play();

    return () => {
      next.fadeOut(0.35);
    };
  }, [actions, clip]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
    },
    [mixer],
  );

  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!group.current || lookStrength <= 0) return;

    // Pointer is -1…1; scale it down so the rig turns, not spins.
    target.current.x = state.pointer.y * lookStrength * 0.5;
    target.current.y = state.pointer.x * lookStrength;

    // Frame-rate independent damping.
    const alpha = 1 - Math.pow(0.001, delta);
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      target.current.x,
      alpha,
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      target.current.y,
      alpha,
    );
  });

  // The model is ~1 unit tall and origin-at-feet; scale to fill the viewport and
  // drop it so the torso, not the shins, sits in the middle of the frame.
  const scale = Math.min(2.6, Math.max(1.7, viewport.height * 0.62));

  return (
    <group ref={group} dispose={null}>
      <primitive object={model} scale={scale} position={[0, -scale * 0.52, 0]} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
