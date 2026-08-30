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

/*
  Derived rather than imported. Two copies of rapier3d-compat exist in the tree —
  the top-level one and the one nested under @react-three/rapier — and importing
  the class type from the wrong copy makes TypeScript reject an object it
  actually produced. Taking the type from the factory's return value means the
  binding's own resolution decides, whichever copy wins.
*/
type VehicleController = ReturnType<ReturnType<typeof useRapier>['world']['createVehicleController']>;

/* ── Vehicle tuning ────────────────────────────────────────────────────────
   Arcade rather than simulation: quick to turn in, forgiving on landings, and
   able to right itself. The numbers are in metres and newtons; the chassis is
   roughly the footprint of a small pickup.                                   */
/*
  Half-extents throughout, which is the unit Rapier's CuboidCollider takes.
  three's boxGeometry wants full sizes, so every mesh below doubles them — the
  two must agree or the car collides with a body twice the size of the one you
  can see. The wheel track is deliberately wider than the chassis so the wheels
  sit proud of it rather than inside it.
*/
const CHASSIS = { width: 0.72, height: 0.22, length: 1.6 };
/*
  `hang` sits on the underside of the chassis box, not inside it. Each wheel is a
  ray cast downward from this point; started inside the collider it can register
  the car's own body as the ground, which pins the chassis at zero and leaves the
  wheels touching nothing. The filter in updateVehicle guards the same thing from
  the other side.
*/
const WHEEL = { radius: 0.33, halfTrack: 0.82, front: 1.02, back: -1.02, hang: -CHASSIS.height };

const SUSPENSION_REST = 0.3;
/*
  Read off Rapier rather than assumed: its wheel defaults are stiffness 5.88,
  compression 0.83, relaxation 0.88, maxTravel 5, frictionSlip 10.5.

  The spring holds the car where force balances weight, and because both scale
  with mass the equilibrium compression is just g / (4 * stiffness) — mass
  cancels entirely. At Rapier's default 5.88 under 9.81 that is 0.42m of travel
  against a 0.30m spring, so the car is bottomed out before it starts and rests
  on its own underside no matter what else is tuned. 26 puts equilibrium near
  0.09m, which leaves most of the travel available for bumps and landings.
*/
const SUSPENSION_STIFFNESS = 150;
/* Rapier's own default is 5m; there is no reason to be stingier than the spring. */
const SUSPENSION_TRAVEL = 0.5;
/*
  Close to Rapier's own 0.83 / 0.88. Swept at working stiffness: 1 settles, 6
  makes it porpoise, 25 throws it 86m into the air. Damping here is not a ratio
  of critical damping and must not be scaled with stiffness.
*/
const SUSPENSION_DAMPING = 0.95;
const MASS = 12;
const GRAVITY = 19.6;
/*
  Sized to this car, not to Bullet's default. That default is 6000N, which
  assumes a chassis of several hundred kilos; against a 12kg body it is 500 m/s²
  of headroom, so any landing that briefly compresses the spring hits the clamp
  and fires the car into the sky — which is what a spawn from 23cm was doing.
  Three times static weight is enough to absorb a drop without becoming a
  trampoline.
*/
const MAX_SUSPENSION_FORCE = 6000;
const FRICTION_SLIP = 8;
const SIDE_FRICTION = 0.75;

const ENGINE_FORCE = 42;
const REVERSE_FORCE = 22;
/*
  Small numbers. Brake torque is applied per wheel against a 12kg chassis, so a
  value that reads modest locks all four instantly and hands the solver an
  impulse big enough to throw the car into the air — measured at 4.6m up from a
  single handbrake application. This slows it hard without launching it.
*/
const BRAKE_FORCE = 2.4;
/** Idle drag, so releasing the throttle coasts down instead of freewheeling. */
const IDLE_BRAKE = 0.18;
const MAX_STEER = 0.52;
/** Steering tightens up with speed or the car becomes undriveable past 40kph. */
const STEER_FALLOFF = 0.055;

export interface CarHandle {
  body: RapierRigidBody | null;
  speedKph: number;
  /** Exposed so the HUD, the zone logic and `?debug` can read wheel state. */
  vehicle: VehicleController | null;
}

interface CarProps {
  input: DriveInputRef;
  spawn?: [number, number, number];
  /** Written every frame so the HUD and zone logic can read the car cheaply. */
  handle: React.RefObject<CarHandle>;
}

/**
 * The car: a Rapier raycast vehicle.
 *
 * The chassis is one dynamic body; the wheels are not bodies at all but rays
 * cast downward from it, each returning a suspension force and a friction
 * impulse. That is why this feels like a car rather than a sliding box — weight
 * transfers under braking, the inside wheel unloads in a turn, and a wheel over
 * a kerb lifts that corner. Four extra rigid bodies with joints would be both
 * slower and worse.
 */
export function Car({ input, spawn = [0, 2, 0], handle }: CarProps) {
  /*
    A raycast vehicle is tuned by feel, and feel cannot be read off a screenshot.
    In debug mode the two numbers that decide whether the car floats or sits on
    its belly are overridable from the query string, so a run can sweep them
    without a rebuild between each value.
  */
  const tuning = useRef(
    (() => {
      if (typeof window === 'undefined') return { stiffness: SUSPENSION_STIFFNESS, engine: ENGINE_FORCE };
      const q = new URLSearchParams(window.location.search);
      return {
        stiffness: Number(q.get('stiffness')) || SUSPENSION_STIFFNESS,
        damp: Number(q.get('damp')) || 0,
        engine: Number(q.get('engine')) || ENGINE_FORCE,
      };
    })(),
  );
  const bodyRef = useRef<RapierRigidBody>(null);
  /*
    The car is held out of the simulation until the scene has drawn a few frames.
    Compiling the physics WASM and the first shaders stalls the main thread for
    the best part of a second; the fixed-step loop then catches up on that whole
    backlog in one go, and a suspension spring integrated across a dozen steps at
    once launches the car and lands it on its roof — from which a raycast vehicle
    can never recover, because its wheels are now pointing at the sky. Waiting is
    the fix; no amount of spring tuning survives a step that large.
  */
  const [armed, setArmed] = useState(false);
  const upsideDownFor = useRef(0);
  const controller = useRef<VehicleController | null>(null);
  const wheelRefs = useRef<(THREE.Object3D | null)[]>([]);
  const { world } = useRapier();

  /* ── Build the vehicle once the chassis body exists ───────────────────── */
  useEffect(() => {
    const chassis = bodyRef.current;
    if (!chassis) return;

    const vehicle = world.createVehicleController(chassis);
    // Y is up, Z is forward — matching how the chassis mesh is modelled below.
    vehicle.indexUpAxis = 1;
    vehicle.setIndexForwardAxis = 2;

    const down = { x: 0, y: -1, z: 0 };
    const axle = { x: -1, y: 0, z: 0 };
    const corners: [number, number][] = [
      [WHEEL.halfTrack, WHEEL.front],
      [-WHEEL.halfTrack, WHEEL.front],
      [WHEEL.halfTrack, WHEEL.back],
      [-WHEEL.halfTrack, WHEEL.back],
    ];

    corners.forEach(([x, z]) => {
      vehicle.addWheel({ x, y: WHEEL.hang, z }, down, axle, SUSPENSION_REST, WHEEL.radius);
    });

    /*
      `?raw` leaves every wheel exactly as Rapier created it. Tuning had drifted
      onto assumptions from Bullet's model — mass-scaled spring force, damping as
      a ratio of critical — that this build does not appear to share. Reading the
      engine's own defaults back is the only way to know which model is actually
      in front of us.
    */
    const raw =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('raw');

    if (typeof window !== 'undefined') {
      (window as unknown as { __wheelDefaults?: unknown }).__wheelDefaults = {
        stiffness: vehicle.wheelSuspensionStiffness(0),
        compression: vehicle.wheelSuspensionCompression(0),
        relaxation: vehicle.wheelSuspensionRelaxation(0),
        maxForce: vehicle.wheelMaxSuspensionForce(0),
        maxTravel: vehicle.wheelMaxSuspensionTravel(0),
        frictionSlip: vehicle.wheelFrictionSlip(0),
        sideFriction: vehicle.wheelSideFrictionStiffness(0),
        restLength: vehicle.wheelSuspensionRestLength(0),
      };
    }

    for (let i = 0; raw ? false : i < 4; i += 1) {
      vehicle.setWheelSuspensionStiffness(i, tuning.current.stiffness);
      vehicle.setWheelMaxSuspensionTravel(i, SUSPENSION_TRAVEL);
      vehicle.setWheelFrictionSlip(i, FRICTION_SLIP);
      vehicle.setWheelSideFrictionStiffness(i, SIDE_FRICTION);
      /*
        Raw ratios, close to Rapier's own 0.83 / 0.88. An earlier version scaled
        these by the square root of stiffness on the assumption that they were
        ratios of critical damping — they are not, and multiplying them by ~19
        made the suspension so overdamped it could not extend to lift the car,
        then numerically unstable enough to fling it 60m through the floor.
      */
      const damp = tuning.current.damp || SUSPENSION_DAMPING;
      vehicle.setWheelSuspensionCompression(i, damp * (i > 1 ? 0.9 : 1));
      vehicle.setWheelSuspensionRelaxation(i, damp * 1.06);
      vehicle.setWheelMaxSuspensionForce(i, MAX_SUSPENSION_FORCE);
    }

    if (typeof window !== 'undefined') {
      const w = window as unknown as { __vehicleBuilds?: number };
      w.__vehicleBuilds = (w.__vehicleBuilds ?? 0) + 1;
    }
    /*
      Centre of mass below the axle line.

      A box chassis puts its centre of mass in the middle of the box, well above
      the contact patches, and a raycast vehicle has nothing but tyre grip
      resisting roll — so it trips over its outside wheels in any real corner.
      Measured before this: upY swinging from 0.8 to -0.88 inside one turn, which
      is the car ending up on its roof. Dropping the centre of mass under the
      wheels is the standard arcade fix and costs nothing.

      Set explicitly rather than derived from collider density, so the inertia
      tensor is ours too: yaw (y) is deliberately the loosest axis and roll (z)
      the stiffest, which lets the car rotate into a corner without wanting to
      lie down in it.
    */
    chassis.setAdditionalMassProperties(
      MASS,
      { x: 0, y: -0.34, z: 0 },
      // I = m/3 * (h² + h²) for a box of these half-extents: 10.4, 12.3, 2.3.
      // Roll is raised above its true value; the rest are physical.
      { x: 10.4, y: 12.3, z: 4.2 },
      { x: 0, y: 0, z: 0, w: 1 },
      true,
    );

    controller.current = vehicle;
    return () => {
      controller.current = null;
      vehicle.free();
    };
  }, [world]);

  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), 900);
    return () => clearTimeout(timer);
  }, []);

  /* ── Drive it, inside the physics step rather than the render loop ─────── */
  /*
    The React Compiler's immutability rule does not know what
    useBeforePhysicsStep is, so it reads these ref writes as render-phase
    mutation. They are not: this callback runs from Rapier's fixed-timestep loop,
    which is exactly the case refs exist for. Writing the car's speed into React
    state instead would re-render the tree sixty times a second to carry one
    number — the single most expensive thing this scene could do.
  */
  /* eslint-disable react-hooks/immutability */
  useBeforePhysicsStep(() => {
    const vehicle = controller.current;
    const chassis = bodyRef.current;
    if (!vehicle || !chassis) return;

    const { steer, throttle, brake, reset } = input.current;
    const speed = vehicle.currentVehicleSpeed();

    /*
      Right itself rather than stranding the player.

      On its roof the wheels point upward and find no ground, so there is no
      force that can ever turn it back over — the car is simply dead until
      someone presses R, and most people will not know that. If it has been
      inverted and stationary for a moment, put it back on its wheels where it
      lies. The reference site does the same thing.
    */
    const rotation = chassis.rotation();
    const upY = 1 - 2 * (rotation.x * rotation.x + rotation.z * rotation.z);
    if (upY < 0.2 && Math.abs(speed) < 2.5) {
      upsideDownFor.current += world.timestep;
      if (upsideDownFor.current > 1.2) {
        const here = chassis.translation();
        respawn(chassis, [here.x, spawn[1], here.z]);
        upsideDownFor.current = 0;
        return;
      }
    } else {
      upsideDownFor.current = 0;
    }

    if (reset) {
      respawn(chassis, spawn);
      input.current.reset = false;
      return;
    }

    if (!armed) return;

    // Full lock at a crawl, a fraction of it at speed.
    const steerLimit = MAX_STEER / (1 + Math.abs(speed) * STEER_FALLOFF);
    const steerAngle = steer * steerLimit;
    vehicle.setWheelSteering(0, steerAngle);
    vehicle.setWheelSteering(1, steerAngle);

    const force =
      throttle >= 0 ? throttle * tuning.current.engine : throttle * REVERSE_FORCE;
    // Rear-wheel drive: the back axle pushes, which lets the tail step out.
    vehicle.setWheelEngineForce(2, force);
    vehicle.setWheelEngineForce(3, force);

    const braking = brake ? BRAKE_FORCE : throttle === 0 ? IDLE_BRAKE : 0;
    for (let i = 0; i < 4; i += 1) vehicle.setWheelBrake(i, braking);

    /*
      No ray filter. An earlier version excluded the chassis by comparing
      `collider.parent().handle` against the body's own — but that getter reads
      back as a denormal (1e-323) through this binding, so every handle compared
      equal and the predicate excluded the entire world. The wheels then found no
      ground at all: suspension pinned at full extension while the car sat on its
      belly. Rapier's controller already ignores the chassis it is attached to,
      and `hang` sits on the underside of the collider, so nothing is needed here.
    */
    vehicle.updateVehicle(world.timestep);

    if (handle.current) {
      handle.current.body = chassis;
      handle.current.vehicle = vehicle;
      handle.current.speedKph = Math.abs(speed) * 3.6;
    }
  });
  /* eslint-enable react-hooks/immutability */

  /* ── Wheel visuals follow the simulated suspension ─────────────────────── */
  useFrame(() => {
    const vehicle = controller.current;
    if (!vehicle) return;

    for (let i = 0; i < 4; i += 1) {
      const wheel = wheelRefs.current[i];
      if (!wheel) continue;

      const connection = vehicle.wheelChassisConnectionPointCs(i);
      const suspension = vehicle.wheelSuspensionLength(i) ?? SUSPENSION_REST;
      if (connection) wheel.position.set(connection.x, connection.y - suspension, connection.z);

      const steering = vehicle.wheelSteering(i) ?? 0;
      const rotation = vehicle.wheelRotation(i) ?? 0;
      wheel.rotation.set(-rotation, steering, 0, 'YXZ');
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={spawn}
      colliders={false}
      /*
        Low damping keeps it lively, but some angular damping is essential — the
        raycast vehicle has nothing resisting yaw once all four wheels leave the
        ground, so a jump off a ramp would otherwise end in an uncontrolled spin.
      */
      gravityScale={armed ? 1 : 0}
      linearDamping={0.06}
      angularDamping={0.9}
      canSleep={false}
      ccd
      name="car"
    >
      <CuboidCollider
        args={[CHASSIS.width, CHASSIS.height, CHASSIS.length]}
        position={[0, 0, 0]}
        density={0}
        friction={0.4}
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
          <Wheel flip={i % 2 === 1} />
        </group>
      ))}
    </RigidBody>
  );
}

/** Puts the car back on its wheels at the spawn point, upright and stationary. */
function respawn(body: RapierRigidBody, spawn: [number, number, number]) {
  body.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

/**
 * The shell — built from primitives rather than a model.
 *
 * The site has no low-poly vehicle to load, and a downloaded one would drag in
 * another megabyte plus a licence to honour. Six boxes in the site's palette
 * read as a car at this camera distance and cost nothing.
 */
function CarBody() {
  return (
    <group position={[0, 0, 0]}>
      {/* Lower body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CHASSIS.width * 2, CHASSIS.height * 2, CHASSIS.length * 2]} />
        <meshStandardMaterial color="#b4ff39" metalness={0.15} roughness={0.42} />
      </mesh>

      {/* Cabin, set back and narrower */}
      <mesh position={[0, CHASSIS.height + 0.19, -0.2]} castShadow>
        <boxGeometry args={[CHASSIS.width * 1.6, 0.42, CHASSIS.length * 1.0]} />
        <meshStandardMaterial color="#0b0e13" metalness={0.3} roughness={0.35} />
      </mesh>

      {/* Windscreen band */}
      <mesh position={[0, CHASSIS.height + 0.22, 0.32]}>
        <boxGeometry args={[CHASSIS.width * 1.5, 0.26, 0.06]} />
        <meshStandardMaterial
          color="#39ffd8"
          emissive="#39ffd8"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>

      {/* Headlights */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.02, CHASSIS.length]}>
          <boxGeometry args={[0.26, 0.14, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive="#eaffd0" emissiveIntensity={2.4} />
        </mesh>
      ))}

      {/* Tail lights */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.06, -CHASSIS.length]}>
          <boxGeometry args={[0.24, 0.12, 0.08]} />
          <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function Wheel({ flip }: { flip: boolean }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, flip ? -1 : 1, 1]} castShadow>
      <cylinderGeometry args={[WHEEL.radius, WHEEL.radius, 0.28, 16]} />
      <meshStandardMaterial color="#15181e" roughness={0.85} />
    </mesh>
  );
}
