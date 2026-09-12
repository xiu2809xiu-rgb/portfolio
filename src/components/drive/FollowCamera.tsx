'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { vehicleById } from '@/content/drive-vehicles';
import { liveBody, type CarHandle } from './Car';
import type { DriveInputRef } from './useDriveControls';

/** Cycled by V, in this order. */
export const VIEWS = ['Chase', 'Cockpit', 'Front'] as const;
export type ViewName = (typeof VIEWS)[number];

const CHASE = { behind: 8.5, height: 3.6, lookAhead: 4 };
const FRONT = { ahead: 9.5, height: 2.2 };

/**
 * The camera, in three positions.
 *
 * Chase trails the car's *heading* rather than its velocity, so reversing or
 * sliding sideways does not whip the view around. Cockpit sits at the driver's
 * eye, which is per-vehicle — the van's is most of a metre higher than the
 * roadster's, and using one height for all of them would put you through the
 * roof of one and under the bonnet of another. Front stands ahead of the car
 * looking back at it.
 *
 * Every mode eases toward its target with a frame-rate-independent lerp: the
 * `1 - e^(-k·dt)` form converges at the same rate per second regardless of frame
 * rate, where a plain `lerp(0.1)` would make the camera three times tighter on a
 * 144Hz display and feel like a different game.
 *
 * Cockpit is deliberately much tighter than the others. A chase camera that lags
 * reads as weight; a head that lags reads as concussion.
 */
export function FollowCamera({
  handle,
  input,
  vehicleId,
}: {
  handle: React.RefObject<CarHandle>;
  input: DriveInputRef;
  vehicleId?: string;
}) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const smoothed = useRef(new THREE.Vector3(0, CHASE.height, -CHASE.behind));
  const lookAt = useRef(new THREE.Vector3());
  const quat = useRef(new THREE.Quaternion());
  const forward = useRef(new THREE.Vector3());
  const eye = useRef(new THREE.Vector3());
  const lastView = useRef(-1);

  /*
    Mutating three.js objects and a canvas texture inside the frame loop, which
    the React Compiler reads as render-phase mutation. It is not: this is the
    render loop, and routing a camera position or a speedometer through state
    would re-render the scene sixty times a second.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    const body = liveBody(handle);
    if (!body) return;

    const t = body.translation();
    const r = body.rotation();
    quat.current.set(r.x, r.y, r.z, r.w);

    // The car's own forward, flattened so a wheelie does not point the camera skyward.
    forward.current.set(0, 0, 1).applyQuaternion(quat.current);
    forward.current.y = 0;
    if (forward.current.lengthSq() < 1e-4) forward.current.set(0, 0, 1);
    forward.current.normalize();

    const view = ((input.current.view % VIEWS.length) + VIEWS.length) % VIEWS.length;
    const speed = handle.current?.speedKph ?? 0;

    /* Snap rather than sweep when the view changes: easing between two cameras
       metres apart is a swoop through the bodywork, not a cut. */
    const switched = view !== lastView.current;
    lastView.current = view;

    if (view === 1) {
      /* ── Cockpit ── */
      const vehicle = vehicleById(vehicleId);
      eye.current
        .set(vehicle.eye[0], vehicle.eye[1], vehicle.eye[2])
        .applyQuaternion(quat.current);
      desired.current.set(t.x, t.y, t.z).add(eye.current);

      target.current
        .copy(desired.current)
        .addScaledVector(forward.current, 12)
        /* Looking very slightly down, the way you actually sit. */
        .add(DOWN_TILT);

      const ease = switched ? 1 : 1 - Math.exp(-26 * delta);
      smoothed.current.lerp(desired.current, ease);
      lookAt.current.lerp(target.current, switched ? 1 : 1 - Math.exp(-22 * delta));
    } else if (view === 2) {
      /* ── Front: ahead of the car, looking back along its nose. ── */
      desired.current
        .set(t.x, t.y, t.z)
        .addScaledVector(forward.current, FRONT.ahead)
        .add(new THREE.Vector3(0, FRONT.height, 0));

      target.current.set(t.x, t.y + 0.4, t.z);

      const ease = switched ? 1 : 1 - Math.exp(-7 * delta);
      smoothed.current.lerp(desired.current, ease);
      lookAt.current.lerp(target.current, switched ? 1 : 1 - Math.exp(-9 * delta));
    } else {
      /* ── Chase ── */
      // Pull back faster the quicker you are going, which sells the speed.
      const distance = CHASE.behind + Math.min(speed / 26, 3);

      desired.current
        .set(t.x, t.y, t.z)
        .addScaledVector(forward.current, -distance)
        .add(new THREE.Vector3(0, CHASE.height, 0));

      target.current.set(t.x, t.y, t.z).addScaledVector(forward.current, CHASE.lookAhead);

      const ease = switched ? 1 : 1 - Math.exp(-6 * delta);
      smoothed.current.lerp(desired.current, ease);
      lookAt.current.lerp(target.current, switched ? 1 : 1 - Math.exp(-9 * delta));
    }

    camera.position.copy(smoothed.current);
    camera.lookAt(lookAt.current);

    /*
      A little field-of-view push with speed. Small enough that nobody notices it
      happening and large enough that they notice it stopping — which is most of
      what makes 60kph feel faster than 30 rather than merely be faster.
    */
    if (camera instanceof THREE.PerspectiveCamera) {
      const base = view === 1 ? 68 : 55;
      const wanted = base + Math.min(speed / 12, 7);
      if (Math.abs(camera.fov - wanted) > 0.01) {
        camera.fov += (wanted - camera.fov) * (1 - Math.exp(-4 * delta));
        camera.updateProjectionMatrix();
      }
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}

const DOWN_TILT = new THREE.Vector3(0, -0.9, 0);
