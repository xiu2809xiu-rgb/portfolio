'use client';

import { useEffect, useRef } from 'react';
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
  Rapier inherits Bullet's raycast-vehicle model, where suspension stiffness is a
  coefficient scaled by chassis mass rather than a spring rate in newtons. Its
  default is around 5.9; this is a firm arcade setting. Two orders of magnitude
  above it turns the car into a catapult, which is exactly what 90 did.
*/
const SUSPENSION_STIFFNESS = 90;
const SUSPENSION_TRAVEL = 0.3;
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
const FRICTION_SLIP = 4.2;
const SIDE_FRICTION = 0.9;

const ENGINE_FORCE = 55;
const REVERSE_FORCE = 30;
const BRAKE_FORCE = 12;
/** Idle drag, so releasing the throttle coasts down instead of freewheeling. */
const IDLE_BRAKE = 0.5;
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
        engine: Number(q.get('engine')) || ENGINE_FORCE,
      };
    })(),
  );
  const bodyRef = useRef<RapierRigidBody>(null);
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

    for (let i = 0; i < 4; i += 1) {
      vehicle.setWheelSuspensionStiffness(i, tuning.current.stiffness);
      vehicle.setWheelMaxSuspensionTravel(i, SUSPENSION_TRAVEL);
      vehicle.setWheelFrictionSlip(i, FRICTION_SLIP);
      vehicle.setWheelSideFrictionStiffness(i, SIDE_FRICTION);
      /*
        Damping is not a free constant: in the Bullet model Rapier inherits, the
        compression and relaxation coefficients are ratios of critical damping,
        which scales with the square root of stiffness. Pinning them near 1 — as
        this did — leaves a stiff spring effectively undamped, and a sweep showed
        exactly that: the car oscillated harder as stiffness rose until it either
        launched to +28m or fell through the floor at -59m. Deriving them keeps
        the ride settled at any stiffness.
      */
      const critical = 2 * Math.sqrt(tuning.current.stiffness);
      // Rear a touch softer in compression, which keeps the nose from diving.
      vehicle.setWheelSuspensionCompression(i, (i > 1 ? 0.78 : 0.86) * critical);
      vehicle.setWheelSuspensionRelaxation(i, 0.88 * critical);
      vehicle.setWheelMaxSuspensionForce(i, MAX_SUSPENSION_FORCE);
    }

    controller.current = vehicle;
    return () => {
      controller.current = null;
      vehicle.free();
    };
  }, [world]);

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

    if (reset) {
      respawn(chassis, spawn);
      input.current.reset = false;
      return;
    }

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
      mass={MASS}
      /*
        Low damping keeps it lively, but some angular damping is essential — the
        raycast vehicle has nothing resisting yaw once all four wheels leave the
        ground, so a jump off a ramp would otherwise end in an uncontrolled spin.
      */
      linearDamping={0.06}
      angularDamping={0.9}
      canSleep={false}
      ccd
      name="car"
    >
      <CuboidCollider
        args={[CHASSIS.width, CHASSIS.height, CHASSIS.length]}
        position={[0, 0, 0]}
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
