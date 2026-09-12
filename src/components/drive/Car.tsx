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
import { vehicleById, type Vehicle } from '@/content/drive-vehicles';
import { Cockpit } from './Cockpit';
import type { DriveInputRef } from './useDriveControls';
import type { DayNight } from './useDayNight';

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

/**
 * The car's body, but only while Rapier still owns it.
 *
 * The handle outlives the scene: it belongs to the page, so that the HUD — which
 * lives outside the canvas — can read the speed. When the scene is rebuilt, the
 * old rigid body is freed on the Rust side while the handle still points at it,
 * and a freed body is indistinguishable from a live one from JavaScript. Calling
 * anything on it traps in wasm as "null pointer passed to rust", which is what
 * put a runtime error over the page after a restart.
 *
 * `isValid()` is the only way to ask from this side, so every reader goes
 * through here rather than touching `handle.current.body` directly.
 */
export function liveBody(handle: React.RefObject<CarHandle> | undefined): RapierRigidBody | null {
  const body = handle?.current?.body;
  if (!body) return null;
  return body.isValid() ? body : null;
}

interface CarProps {
  input: DriveInputRef;
  spawn?: [number, number, number];
  handle: React.RefObject<CarHandle>;
  /** Drives the headlights, which come on as the sun goes down. */
  clock?: React.RefObject<DayNight>;
  /** Appearance only. Every body style shares one suspension model. */
  vehicleId?: string;
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

export function Car({ input, spawn = [0, 1, 0], handle, clock, vehicleId }: CarProps) {
  const vehicle: Vehicle = vehicleById(vehicleId);
  const bodyRef = useRef<RapierRigidBody>(null);

  /*
    Whoever creates the body owns its lifetime in the handle. Without this the
    handle keeps pointing at a freed body after an unmount, and the next reader
    to run — the chase camera or the zone check — traps in wasm before the
    replacement car has written itself in.
  */
  /*
    The physics step is registered once; reading `vehicle` through it directly
    would capture whichever car was selected at registration. A ref kept current
    by an effect is the version that cannot go stale.
  */
  const tune = useRef(vehicle.tune);
  useEffect(() => {
    tune.current = vehicle.tune;
  }, [vehicle.tune]);

  useEffect(
    () => () => {
      if (handle.current) {
        handle.current.body = null;
        handle.current.speedKph = 0;
        handle.current.grounded = 0;
      }
    },
    [handle],
  );
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

    /*
      Negated, and the sign is not arbitrary. `steer` is the driver's intent:
      +1 means "go right". A positive rotation about the contact normal turns the
      wheel's forward vector toward world +X — and the chase camera looks along
      the car's +Z, which puts its own right vector at world -X. So world +X is
      screen LEFT, and an unnegated positive steer sends the car the opposite way
      to the key that asked for it.
    */
    const steerAngle =
      (-steer * MAX_STEER * tune.current.agility) /
      (1 + Math.abs(forwardSpeed) * STEER_FALLOFF);
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
      /*
        right x normal, not normal x right. The car's nose is +Z (the headlights
        are modelled there and the chase camera sits behind it), and
        normal x right resolves to -Z — so the engine force was pushing out of
        the back. Distance-based tests never caught it because distance is
        unsigned; the harness now asserts direction.
      */
      v.forward.copy(v.right).cross(v.normal).normalize();

      const lateralSpeed = v.patch.dot(v.right);
      const rollSpeed = v.patch.dot(v.forward);

      const bite = isFront ? LATERAL_BITE.front : LATERAL_BITE.rear;
      let lateralImpulse = -lateralSpeed * (MASS / 4) * bite;

      let driveForce = 0;
      if (!isFront) {
        // Rear-wheel drive, halved because two wheels share it.
        driveForce =
          (throttle >= 0 ? throttle * ENGINE_FORCE : throttle * REVERSE_FORCE) *
          0.5 *
          tune.current.accel;
      }
      const brakeForce = brake
        ? -Math.sign(rollSpeed) * BRAKE_FORCE * 0.25 * tune.current.braking
        : 0;
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
      /* Top speed is set by where drag balances engine force, so a higher top
         speed is less drag rather than more power — which keeps acceleration
         and maximum speed independently tunable. */
      v.impulse
        .copy(v.vel)
        .multiplyScalar((-DRAG / tune.current.topSpeed) * speed * FIXED_DT);
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

      <CarBody clock={clock} vehicle={vehicle} input={input} />
      <Cockpit vehicle={vehicle} input={input} handle={handle} clock={clock} />

      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(node) => {
            wheelRefs.current[i] = node;
          }}
        >
          <Wheel rim={vehicle.rim} />
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
 * The shell.
 *
 * Built from primitives and driven entirely by a `Vehicle` record, so adding a
 * body style is a data change rather than a component. Nothing in here reaches
 * the suspension: the collider, the wheel mounts and the spring rates are the
 * same whichever body is on top, which is why the picker can promise they all
 * drive identically and mean it.
 *
 * The hull is deliberately larger than the physics chassis and extends below
 * it. The suspension holds the collider about half a metre clear of the road at
 * rest, so a body that stopped at the collider's own underside left the car
 * visibly hovering with daylight under the sills.
 */
function CarBody({
  clock,
  vehicle,
  input,
}: {
  clock?: React.RefObject<DayNight>;
  vehicle: Vehicle;
  input: DriveInputRef;
}) {
  const { halfLength: l } = CHASSIS;
  const beams = useRef<THREE.SpotLight[]>([]);
  const lenses = useRef<THREE.MeshStandardMaterial[]>([]);
  const aims = useRef<THREE.Object3D[]>([]);
  const brakeLamps = useRef<THREE.MeshStandardMaterial[]>([]);
  const reverseLamps = useRef<THREE.MeshStandardMaterial[]>([]);

  /*
    A SpotLight aims at its `target`, which is a separate object three.js expects
    to find in the scene — and `target-position` sets that object's position in
    WORLD space. Left like that the beam pointed at a fixed patch of ground and
    stayed there while the car drove away from it. Parenting each target inside
    the car group and assigning it here means the beam turns with the car.
  */
  useEffect(() => {
    beams.current.forEach((beam, i) => {
      const aim = aims.current[i];
      if (beam && aim) beam.target = aim;
    });
  }, []);

  /*
    Mutating lights in the frame loop, which the React Compiler reads as
    render-phase mutation. It is not: this is the render loop, and routing a
    headlight's intensity through state would re-render the car sixty times a
    second.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    /*
      Headlights follow the same daylight curve as the street lamps rather than a
      separate switch, so they come up through dusk instead of snapping on. Two
      spot lights are cheap; two shadow-casting spot lights are not, so they do
      not cast.
    */
    const dark = clock?.current ? 1 - clock.current.daylight : 0;
    for (const beam of beams.current) {
      if (!beam) continue;
      beam.intensity = dark * 90;
      beam.visible = dark > 0.08;
    }
    for (const lens of lenses.current) {
      if (lens) lens.emissiveIntensity = 0.4 + dark * 3.2;
    }

    /* Tail lamps carry information rather than being a constant red rectangle:
       bright under braking, and a white lamp when the throttle is in reverse. */
    const control = input.current;
    const braking = control.brake || control.throttle < -0.05;
    for (const lamp of brakeLamps.current) {
      if (lamp) lamp.emissiveIntensity = braking ? 5.2 : 0.7 + dark * 1.4;
    }
    for (const lamp of reverseLamps.current) {
      if (lamp) lamp.emissiveIntensity = control.throttle < -0.05 ? 4 : 0.04;
    }
  });
  /* eslint-enable react-hooks/immutability */

  const { hull, cabin, bed } = vehicle;
  /* Lamps sit at the hull's own corners, so they move with the body style. */
  const lampX = hull.w * 0.58;

  return (
    <group>
      {/* Hull */}
      <mesh position={[0, hull.y, hull.z]} castShadow receiveShadow>
        <boxGeometry args={[hull.w * 2, hull.h * 2, hull.l * 2]} />
        <meshPhysicalMaterial
          color={vehicle.paint}
          metalness={0.35}
          roughness={0.32}
          /* Car paint is a pigment coat under a clear lacquer, and that second
             specular lobe is most of why a car reads as a car rather than as a
             painted box. Confirmed present on MeshPhysicalMaterial at 0.185. */
          clearcoat={0.85}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Wheel arches, so the tyres do not appear to pass through the sills. */}
      {[
        [WHEEL.halfTrack, WHEEL.front],
        [-WHEEL.halfTrack, WHEEL.front],
        [WHEEL.halfTrack, WHEEL.back],
        [-WHEEL.halfTrack, WHEEL.back],
      ].map(([x, z]) => (
        <mesh key={`arch-${x}-${z}`} position={[x * 0.86, hull.y - 0.02, z]} castShadow>
          <boxGeometry args={[0.34, hull.h * 1.5, 0.98]} />
          <meshPhysicalMaterial
            color={vehicle.paint}
            metalness={0.3}
            roughness={0.38}
            clearcoat={0.7}
          />
        </mesh>
      ))}

      {/* Greenhouse, or a low screen on an open car. */}
      {cabin ? (
        <>
          <mesh position={[0, cabin.y, cabin.z]} castShadow receiveShadow>
            <boxGeometry args={[cabin.w * 2, cabin.h * 2, cabin.l * 2]} />
            <meshStandardMaterial color={vehicle.glass} metalness={0.4} roughness={0.18} />
          </mesh>
          {vehicle.roofBars
            ? [-cabin.w * 0.6, cabin.w * 0.6].map((x) => (
                <mesh
                  key={`bar-${x}`}
                  position={[x, cabin.y + cabin.h + 0.05, cabin.z]}
                  castShadow
                >
                  <boxGeometry args={[0.07, 0.07, cabin.l * 1.7]} />
                  <meshStandardMaterial color={vehicle.trim} metalness={0.7} roughness={0.35} />
                </mesh>
              ))
            : null}
        </>
      ) : (
        <mesh position={[0, hull.y + hull.h + 0.18, 0.35]} castShadow>
          <boxGeometry args={[hull.w * 1.3, 0.36, 0.05]} />
          <meshPhysicalMaterial
            color={vehicle.glass}
            metalness={0.1}
            roughness={0.05}
            transparent
            opacity={0.55}
          />
        </mesh>
      )}

      {/* Load bed. */}
      {bed ? (
        <>
          <mesh position={[0, bed.y - bed.h, bed.z]} castShadow receiveShadow>
            <boxGeometry args={[bed.w * 2, 0.08, bed.l * 2]} />
            <meshStandardMaterial color={vehicle.trim} roughness={0.75} />
          </mesh>
          {[
            [bed.w, 0, 0.1, bed.l * 2],
            [-bed.w, 0, 0.1, bed.l * 2],
            [0, -bed.l, bed.w * 2, 0.1],
          ].map((wall, i) => (
            <mesh key={`bedwall-${i}`} position={[wall[0], bed.y, bed.z + wall[1]]} castShadow>
              <boxGeometry args={[wall[2] || 0.1, bed.h * 2, wall[3] || 0.1]} />
              <meshPhysicalMaterial color={vehicle.paint} metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
        </>
      ) : null}

      {/* Trim strip across the nose. */}
      <mesh position={[0, hull.y + hull.h * 0.45, hull.l - 0.02]}>
        <boxGeometry args={[hull.w * 1.5, 0.12, 0.06]} />
        <meshStandardMaterial
          color={vehicle.trim}
          emissive={vehicle.trim}
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.12}
        />
      </mesh>

      {/* Headlights */}
      {[-lampX, lampX].map((x) => (
        <group key={`head-${x}`}>
          <mesh position={[x, hull.y + hull.h * 0.35, l]}>
            <boxGeometry args={[0.3, 0.16, 0.08]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) lenses.current.push(material);
              }}
              color="#ffffff"
              emissive="#eaffd0"
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>
          <object3D
            ref={(node) => {
              if (node) aims.current.push(node);
            }}
            position={[x * 0.4, -1.1, l + 16]}
          />
          <spotLight
            ref={(light) => {
              if (light) beams.current.push(light);
            }}
            position={[x, hull.y + hull.h * 0.35, l]}
            angle={0.5}
            penumbra={0.6}
            distance={34}
            decay={1.4}
            intensity={0}
            color="#eaffd0"
          />
        </group>
      ))}

      {/* Tail lamps: brake outboard, reverse inboard. */}
      {[-lampX, lampX].map((x) => (
        <group key={`tail-${x}`}>
          <mesh position={[x, hull.y + hull.h * 0.4, -l]}>
            <boxGeometry args={[0.22, 0.14, 0.07]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) brakeLamps.current.push(material);
              }}
              color="#ff3b3b"
              emissive="#ff2a2a"
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[x * 0.52, hull.y + hull.h * 0.4, -l]}>
            <boxGeometry args={[0.12, 0.1, 0.07]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) reverseLamps.current.push(material);
              }}
              color="#f4f8ff"
              emissive="#ffffff"
              emissiveIntensity={0.04}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Tyre plus rim.
 *
 * The rim is not decoration. A plain cylinder is rotationally symmetric, so a
 * wheel spinning at 40kph looks exactly like a wheel standing still — the spin
 * animation was always correct and simply had nothing to show. Spokes are the
 * honest way to break that symmetry.
 */
function Wheel({ rim }: { rim: string }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[WHEEL.radius, WHEEL.radius, 0.3, 18]} />
        <meshStandardMaterial color="#15181e" roughness={0.85} />
      </mesh>
      {[-0.151, 0.151].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[WHEEL.radius * 0.62, WHEEL.radius * 0.62, 0.02, 14]} />
          <meshStandardMaterial color={rim} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`spoke-${i}`} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
          <boxGeometry args={[WHEEL.radius * 1.1, 0.07, 0.312]} />
          <meshStandardMaterial color={rim} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

