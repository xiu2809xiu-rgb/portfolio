'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
  type RapierRigidBody,
} from '@react-three/rapier';
import type { DriveInputRef } from './useDriveControls';

/**
 * The physics step, shared with `<Physics timeStep>`.
 *
 * Never read from `world.timestep` inside a step callback: the binding assigns
 * that after running beforeStep callbacks, so a read there returns the previous
 * step's value.
 */
export const FIXED_DT = 1 / 60;

/* ── The car ───────────────────────────────────────────────────────────────
   A spring-and-tyre model written here rather than handed to Rapier's raycast
   vehicle controller, which absorbed better than 90% of the drive whenever its
   wheels were loaded — a 3000N.s impulse that should have produced 10 m/s gave
   0.26. The same impulse on the same body in mid-air gave 9.95, so the chassis
   was never the problem.

   Everything below is SI and sized against the 400kg chassis, which means the
   numbers can be reasoned about rather than swept: static compression is
   CORNER_LOAD / STIFFNESS, peak cornering is GRIP * g, and the car tips at its
   static stability factor.                                                   */

const MASS = 400;
const GRAVITY = 9.81;
const CORNER_LOAD = (MASS * GRAVITY) / 4;

const CHASSIS = { halfWidth: 0.78, halfHeight: 0.3, halfLength: 1.7 };
const WHEEL = { radius: 0.34, halfTrack: 0.86, front: 1.22, back: -1.22, mount: -0.16 };

const REST_LENGTH = 0.45;
/** Static compression lands at CORNER_LOAD / STIFFNESS = 0.11m, a quarter of travel. */
const STIFFNESS = 9000;
/** Roughly 0.4 of critical for a 100kg corner: firm, and settles in one bounce. */
const DAMPING = 800;
const MAX_SUSPENSION_FORCE = CORNER_LOAD * 6;

/*
  Peak lateral acceleration is GRIP * g. The body tips at its static stability
  factor — half track over centre-of-mass height — which is about 1.39 here.
  Grip sits below that on purpose, so the tyres let go before the car does.
*/
const GRIP = 1.15;
/** Share of a wheel's sideways velocity cancelled per step. Rear lower, so it slides. */
const LATERAL_BITE = { front: 0.62, rear: 0.5 };

const ENGINE_FORCE = MASS * GRAVITY * 0.5;
const REVERSE_FORCE = ENGINE_FORCE * 0.55;
const BRAKE_FORCE = MASS * GRAVITY * 1.1;
const ROLLING_RESISTANCE = 22;
const DRAG = 2.4;

const MAX_STEER = 0.55;
/** Steering tightens with speed, or the car is undriveable above a crawl. */
const STEER_FALLOFF = 0.05;

const UP = new THREE.Vector3(0, 1, 0);

export interface CarHandle {
  body: RapierRigidBody | null;
  speedKph: number;
  grounded: number;
}

interface CarProps {
  input: DriveInputRef;
  spawn?: [number, number, number];
  handle: React.RefObject<CarHandle>;
}

/** Scratch vectors. Allocating inside a 60Hz loop is how you invite the GC in. */
const v = {
  pos: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  mount: new THREE.Vector3(),
  down: new THREE.Vector3(),
  contact: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  ang: new THREE.Vector3(),
  arm: new THREE.Vector3(),
  com: new THREE.Vector3(),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  patch: new THREE.Vector3(),
  impulse: new THREE.Vector3(),
};

export function Car({ input, spawn = [0, 1, 0], handle }: CarProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const wheelRefs = useRef<(THREE.Object3D | null)[]>([]);
  const { world, rapier } = useRapier();

  /* Per-wheel state, written in the physics step and read when rendering. */
  const wheels = useRef(
    [0, 1, 2, 3].map(() => ({ compression: 0, spin: 0, steer: 0, grounded: false })),
  );

  const [armed, setArmed] = useState(false);
  const smoothFrames = useRef(0);
  const elapsed = useRef(0);
  const upsideDownFor = useRef(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    /*
      Mass set explicitly rather than derived from collider density, so the centre
      of mass can sit below the axle line. A box chassis puts it in the middle of
      the box, above the contact patches, and a car with only tyre grip resisting
      roll then trips over its outside wheels in every corner.
    */
    body.setAdditionalMassProperties(
      MASS,
      { x: 0, y: -0.18, z: 0 },
      {
        x: (MASS / 3) * (CHASSIS.halfHeight ** 2 + CHASSIS.halfLength ** 2),
        y: (MASS / 3) * (CHASSIS.halfWidth ** 2 + CHASSIS.halfLength ** 2),
        z: (MASS / 3) * (CHASSIS.halfWidth ** 2 + CHASSIS.halfHeight ** 2) * 1.6,
      },
      { x: 0, y: 0, z: 0, w: 1 },
      true,
    );
  }, []);

  /*
    The React Compiler's immutability rule does not know what useBeforePhysicsStep
    is, so it reads these writes as render-phase mutation. They are not: this runs
    from Rapier's fixed-step loop, which is exactly what refs are for.
  */
  /* eslint-disable react-hooks/immutability */
  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    const t = body.translation();
    const r = body.rotation();
    v.pos.set(t.x, t.y, t.z);
    v.quat.set(r.x, r.y, r.z, r.w);

    const linvel = body.linvel();
    const angvel = body.angvel();
    v.vel.set(linvel.x, linvel.y, linvel.z);
    v.ang.set(angvel.x, angvel.y, angvel.z);
    const com = body.worldCom();
    v.com.set(com.x, com.y, com.z);

    const { steer, throttle, brake, reset } = input.current;
    const speed = v.vel.length();

    if (reset) {
      respawn(body, spawn);
      input.current.reset = false;
      return;
    }

    /*
      Right itself rather than stranding the player. Upside down the wheels point
      at the sky and find no ground, so no force exists that could turn it back.
    */
    const upY = 1 - 2 * (r.x * r.x + r.z * r.z);
    if (upY < 0.2 && speed < 2) {
      upsideDownFor.current += FIXED_DT;
      if (upsideDownFor.current > 1.2) {
        respawn(body, [t.x, spawn[1], t.z]);
        upsideDownFor.current = 0;
        return;
      }
    } else {
      upsideDownFor.current = 0;
    }

    if (!armed) return;

    // Speed along the car's own nose, which is what steering should scale on.
    v.forward.set(0, 0, 1).applyQuaternion(v.quat);
    const forwardSpeed = v.vel.dot(v.forward);

    const steerAngle = (steer * MAX_STEER) / (1 + Math.abs(forwardSpeed) * STEER_FALLOFF);
    v.down.set(0, -1, 0).applyQuaternion(v.quat);

    let grounded = 0;

    for (let i = 0; i < 4; i += 1) {
      const isFront = i < 2;
      const wheel = wheels.current[i];
      wheel.steer = isFront ? steerAngle : 0;

      v.mount
        .set(
          i % 2 === 0 ? WHEEL.halfTrack : -WHEEL.halfTrack,
          WHEEL.mount,
          isFront ? WHEEL.front : WHEEL.back,
        )
        .applyQuaternion(v.quat)
        .add(v.pos);

      /*
        filterExcludeRigidBody takes the body itself. An earlier attempt compared
        collider.parent().handle against the chassis handle, but that getter reads
        back as a denormal through this binding, so every handle compared equal
        and the filter excluded the entire world.
      */
      const hit = world.castRayAndGetNormal(
        new rapier.Ray(v.mount, v.down),
        REST_LENGTH + WHEEL.radius,
        true,
        undefined,
        undefined,
        undefined,
        body,
      );

      if (!hit) {
        wheel.grounded = false;
        wheel.compression = 0;
        // A free wheel keeps turning rather than stopping dead in mid-air.
        wheel.spin += (forwardSpeed / WHEEL.radius) * FIXED_DT;
        continue;
      }

      wheel.grounded = true;
      grounded += 1;

      const centreDistance = Math.max(hit.timeOfImpact - WHEEL.radius, 0);
      const compression = Math.max(REST_LENGTH - centreDistance, 0);
      wheel.compression = compression;

      v.contact.copy(v.down).multiplyScalar(hit.timeOfImpact).add(v.mount);
      v.normal.set(hit.normal.x, hit.normal.y, hit.normal.z);
      if (v.normal.dot(UP) < 0) v.normal.negate();

      // Chassis velocity at the contact patch: v + ω × r.
      v.arm.copy(v.contact).sub(v.com);
      v.patch.copy(v.ang).cross(v.arm).add(v.vel);

      /* ── Suspension: a spring that can only ever push ── */
      const springVelocity = v.patch.dot(v.normal);
      const suspensionForce = Math.min(
        Math.max(STIFFNESS * compression - DAMPING * springVelocity, 0),
        MAX_SUSPENSION_FORCE,
      );
      v.impulse.copy(v.normal).multiplyScalar(suspensionForce * FIXED_DT);
      body.applyImpulseAtPoint(v.impulse, v.contact, true);

      /* ── Tyre: one budget of grip, spent on turning and driving together ── */
      v.right
        .set(1, 0, 0)
        .applyQuaternion(v.quat)
        .applyAxisAngle(v.normal, wheel.steer)
        .projectOnPlane(v.normal)
        .normalize();
      v.forward.copy(v.normal).cross(v.right).normalize();

      const lateralSpeed = v.patch.dot(v.right);
      const rollSpeed = v.patch.dot(v.forward);

      const bite = isFront ? LATERAL_BITE.front : LATERAL_BITE.rear;
      let lateralImpulse = -lateralSpeed * (MASS / 4) * bite;

      let driveForce = 0;
      if (!isFront) {
        // Rear-wheel drive, halved because two wheels share it.
        driveForce =
          (throttle >= 0 ? throttle * ENGINE_FORCE : throttle * REVERSE_FORCE) * 0.5;
      }
      const brakeForce = brake ? -Math.sign(rollSpeed) * BRAKE_FORCE * 0.25 : 0;
      const resistance = -rollSpeed * ROLLING_RESISTANCE;
      let longitudinalImpulse = (driveForce + brakeForce + resistance) * FIXED_DT;

      /*
        The friction circle. A tyre cannot corner and accelerate at full commitment
        at once; without this the car would behave as though it were on rails, and
        the moment where the back steps out under power would never happen.
      */
      const budget = GRIP * suspensionForce * FIXED_DT;
      const demand = Math.hypot(lateralImpulse, longitudinalImpulse);
      if (demand > budget && demand > 0) {
        const scale = budget / demand;
        lateralImpulse *= scale;
        longitudinalImpulse *= scale;
      }

      v.impulse
        .copy(v.right)
        .multiplyScalar(lateralImpulse)
        .addScaledVector(v.forward, longitudinalImpulse);
      body.applyImpulseAtPoint(v.impulse, v.contact, true);

      wheel.spin += (rollSpeed / WHEEL.radius) * FIXED_DT;
    }

    // Drag, so the car has a top speed rather than an ever-rising one.
    if (speed > 0.1) {
      v.impulse.copy(v.vel).multiplyScalar(-DRAG * speed * FIXED_DT);
      body.applyImpulse(v.impulse, true);
    }

    if (handle.current) {
      handle.current.body = body;
      handle.current.speedKph = Math.abs(forwardSpeed) * 3.6;
      handle.current.grounded = grounded;
    }
  });
  /* eslint-enable react-hooks/immutability */

  useFrame((_, delta) => {
    if (!armed) {
      /*
        Arm on measured smoothness, not a stopwatch. Compiling the physics WASM
        stalls the main thread; the fixed-step loop then catches up on the whole
        backlog at once, and a suspension integrated across a dozen steps in one
        go throws the car onto its roof before the player has seen anything. The
        wall-clock fallback matters too — a weak GPU may never meet the budget,
        and a car that refuses to start is worse than a rough first second.
      */
      elapsed.current += delta;
      smoothFrames.current = delta < 0.1 ? smoothFrames.current + 1 : 0;
      if (smoothFrames.current > 20 || elapsed.current > 4) setArmed(true);
    }

    for (let i = 0; i < 4; i += 1) {
      const node = wheelRefs.current[i];
      const wheel = wheels.current[i];
      if (!node) continue;

      const drop = wheel.grounded ? REST_LENGTH - wheel.compression : REST_LENGTH;
      node.position.set(
        i % 2 === 0 ? WHEEL.halfTrack : -WHEEL.halfTrack,
        WHEEL.mount - drop,
        i < 2 ? WHEEL.front : WHEEL.back,
      );
      node.rotation.set(-wheel.spin, wheel.steer, 0, 'YXZ');
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={spawn}
      colliders={false}
      /* Mass comes from setAdditionalMassProperties, so the centre of mass is ours. */
      linearDamping={0}
      angularDamping={0.4}
      canSleep={false}
      ccd
      gravityScale={armed ? 1 : 0}
      name="car"
    >
      <CuboidCollider
        args={[CHASSIS.halfWidth, CHASSIS.halfHeight, CHASSIS.halfLength]}
        density={0}
        /* Low: the tyres are meant to provide grip, not the box scraping along. */
        friction={0.2}
        restitution={0.05}
      />

      <CarBody />

      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(node) => {
            wheelRefs.current[i] = node;
          }}
        >
          <Wheel />
        </group>
      ))}
    </RigidBody>
  );
}

function respawn(body: RapierRigidBody, spawn: [number, number, number]) {
  body.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

/**
 * The shell, built from primitives.
 *
 * There is no low-poly vehicle in this project to load, and a downloaded one
 * costs a megabyte and a licence to honour. Six boxes in the site's palette read
 * as a car at this camera distance and cost nothing.
 */
function CarBody() {
  const { halfWidth: w, halfHeight: h, halfLength: l } = CHASSIS;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w * 2, h * 2, l * 2]} />
        <meshStandardMaterial color="#b4ff39" metalness={0.15} roughness={0.42} />
      </mesh>

      <mesh position={[0, h + 0.2, -0.24]} castShadow>
        <boxGeometry args={[w * 1.62, 0.46, l * 0.98]} />
        <meshStandardMaterial color="#0b0e13" metalness={0.3} roughness={0.35} />
      </mesh>

      <mesh position={[0, h + 0.24, 0.36]}>
        <boxGeometry args={[w * 1.5, 0.28, 0.06]} />
        <meshStandardMaterial
          color="#39ffd8"
          emissive="#39ffd8"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>

      {[-0.46, 0.46].map((x) => (
        <mesh key={`head-${x}`} position={[x, 0.02, l]}>
          <boxGeometry args={[0.28, 0.15, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive="#eaffd0" emissiveIntensity={2.4} />
        </mesh>
      ))}

      {[-0.46, 0.46].map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.06, -l]}>
          <boxGeometry args={[0.26, 0.13, 0.08]} />
          <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function Wheel() {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[WHEEL.radius, WHEEL.radius, 0.3, 18]} />
      <meshStandardMaterial color="#15181e" roughness={0.85} />
    </mesh>
  );
}
