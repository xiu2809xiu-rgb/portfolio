'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, RoundedBox } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import {
  districtCentre,
  districtGate,
  districts,
  HALF,
  PLAZA_RADIUS,
  RING_RADIUS,
  ROAD_WIDTH,
  SPUR_WIDTH,
  spurBearings,
  type District,
} from '@/content/drive-world';
import { grassMaps, tarmacMaps } from './textures';
import { PlazaLetters } from './PlazaLetters';
import { Trees } from './Trees';
import type { DayNight } from './useDayNight';
import type { Quality } from './quality';

function seeded(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function World({
  clock,
  quality,
}: {
  clock: React.RefObject<DayNight>;
  quality: Quality;
}) {
  return (
    <>
      <Terrain />
      <Roads />
      <PlazaLetters />
      <Districts clock={clock} />
      <Trees count={quality.trees} />
      <StreetLamps clock={clock} quality={quality} />
      <Crates />
      <Boundary />
    </>
  );
}

const NORMAL_SCALE = new THREE.Vector2(0.85, 0.85);

function Terrain() {
  const maps = useMemo(() => grassMaps(), []);
  return (
    <RigidBody type="fixed" friction={1.1} restitution={0.02} name="ground">
      <CuboidCollider args={[HALF, 0.5, HALF]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial
          map={maps.map}
          normalMap={maps.normalMap}
          roughnessMap={maps.roughnessMap}
          normalScale={NORMAL_SCALE}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}

function Roads() {
  const tarmac = useMemo(() => tarmacMaps(), []);
  const spurs = useMemo(
    () =>
      spurBearings.map((bearing) => {
        const angle = (bearing * Math.PI) / 180;
        const middle = (PLAZA_RADIUS + RING_RADIUS) / 2;
        return {
          x: Math.sin(angle) * middle,
          z: -Math.cos(angle) * middle,
          length: RING_RADIUS - PLAZA_RADIUS,
          rotation: -angle,
        };
      }),
    [],
  );

  const access = useMemo(
    () =>
      districts.map((district) => {
        const angle = (district.bearing * Math.PI) / 180;
        const middle = RING_RADIUS + district.radius * 0.4;
        return {
          x: Math.sin(angle) * middle,
          z: -Math.cos(angle) * middle,
          length: district.radius * 0.9,
          rotation: -angle,
        };
      }),
    [],
  );

  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 96]} />
        <Tarmac maps={tarmac} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[RING_RADIUS - ROAD_WIDTH / 2, RING_RADIUS + ROAD_WIDTH / 2, 160]} />
        <Tarmac maps={tarmac} />
      </mesh>
      <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RING_RADIUS - 0.1, RING_RADIUS + 0.1, 240]} />
        <meshStandardMaterial color="#e8edf2" opacity={0.62} transparent roughness={0.76} />
      </mesh>
      {[RING_RADIUS - ROAD_WIDTH / 2 + 0.46, RING_RADIUS + ROAD_WIDTH / 2 - 0.46].map(
        (radius) => (
          <mesh key={radius} position={[0, 0.033, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.055, radius + 0.055, 192]} />
            <meshStandardMaterial color="#c6ccd2" opacity={0.34} transparent roughness={0.8} />
          </mesh>
        ),
      )}

      {[...spurs, ...access].map((strip, index) => (
        <mesh
          key={index}
          position={[strip.x, 0.02, strip.z]}
          rotation={[-Math.PI / 2, 0, strip.rotation]}
          receiveShadow
        >
          <planeGeometry args={[SPUR_WIDTH, strip.length]} />
          <Tarmac maps={tarmac} />
        </mesh>
      ))}

      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAZA_RADIUS - 0.24, PLAZA_RADIUS, 96]} />
        <meshStandardMaterial
          color="#9dcf42"
          emissive="#b4ff39"
          emissiveIntensity={0.16}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

function Tarmac({ maps }: { maps: ReturnType<typeof tarmacMaps> }) {
  return (
    <meshStandardMaterial
      map={maps.map}
      normalMap={maps.normalMap}
      roughnessMap={maps.roughnessMap}
      normalScale={NORMAL_SCALE}
      roughness={1}
      metalness={0}
    />
  );
}

function createFacadeTexture(accent: string, seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  const random = seeded(seed);
  const background = context.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, '#1d2933');
  background.addColorStop(1, '#0b1118');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const columns = 8;
  const rows = 5;
  const gutter = 13;
  const cellWidth = canvas.width / columns;
  const cellHeight = canvas.height / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth + gutter;
      const y = row * cellHeight + gutter;
      const lit = random() > 0.68;
      const glass = context.createLinearGradient(x, y, x, y + cellHeight - gutter * 2);
      glass.addColorStop(0, lit ? `${accent}b8` : '#365268');
      glass.addColorStop(0.5, lit ? `${accent}6e` : '#172936');
      glass.addColorStop(1, '#091018');
      context.fillStyle = glass;
      context.fillRect(x, y, cellWidth - gutter * 2, cellHeight - gutter * 2);
      context.strokeStyle = lit ? `${accent}a8` : '#40505c';
      context.lineWidth = 2;
      context.strokeRect(x, y, cellWidth - gutter * 2, cellHeight - gutter * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function createStationSignTexture(district: District, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  const background = context.createLinearGradient(0, 0, canvas.width, 0);
  background.addColorStop(0, '#080d12');
  background.addColorStop(0.52, '#16212a');
  background.addColorStop(1, '#080d12');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = accent;
  context.fillRect(0, 0, 18, canvas.height);
  context.fillRect(canvas.width - 18, 0, 18, canvas.height);

  context.fillStyle = '#f4f7f8';
  context.font = '800 64px ui-sans-serif, system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const title = district.name.length > 23 ? district.name.slice(0, 23) : district.name;
  context.fillText(title.toUpperCase(), canvas.width / 2, 104);

  context.fillStyle = accent;
  context.font = '700 25px ui-monospace, monospace';
  context.fillText(`0${districts.indexOf(district) + 1}  •  ${district.kicker.toUpperCase()}`, canvas.width / 2, 174);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createArchedCanopy(width: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(0, 0.72, width / 2, 0);
  shape.lineTo(width / 2, -0.2);
  shape.quadraticCurveTo(0, 0.42, -width / 2, -0.2);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 2.7,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.07,
    bevelThickness: 0.07,
  });
  geometry.translate(0, 0, -1.35);
  geometry.computeVertexNormals();
  return geometry;
}

interface BuildingBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rotation?: number;
}

function Districts({ clock }: { clock: React.RefObject<DayNight> }) {
  return (
    <>
      {districts.map((district) => (
        <DistrictBlock key={district.id} district={district} clock={clock} />
      ))}
    </>
  );
}

function DistrictBlock({
  district,
  clock,
}: {
  district: District;
  clock: React.RefObject<DayNight>;
}) {
  const [centreX, centreZ] = districtCentre(district);
  const [gateX, gateZ] = districtGate(district);
  const accent = district.accent === 'lime' ? '#b4ff39' : '#39ffd8';
  const yaw = -(district.bearing * Math.PI) / 180;
  const blocks = useMemo(() => massing(district), [district]);

  const facadeTexture = useMemo(
    () => createFacadeTexture(accent, district.bearing * 43 + 19),
    [accent, district.bearing],
  );
  const facadeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: facadeTexture,
        emissiveMap: facadeTexture,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.18,
        roughness: 0.28,
        metalness: 0.18,
      }),
    [accent, facadeTexture],
  );
  const trimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accent).lerp(new THREE.Color('#cdd7de'), 0.34),
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.14,
        roughness: 0.4,
        metalness: 0.42,
      }),
    [accent],
  );

  useEffect(
    () => () => {
      facadeMaterial.dispose();
      trimMaterial.dispose();
      facadeTexture.dispose();
    },
    [facadeMaterial, trimMaterial, facadeTexture],
  );

  /*
    Materials mutated in the frame loop, which the React Compiler reads as
    render-phase mutation. It is not: this is the render loop, and ramping a
    building's lit windows through state would re-render the district sixty
    times a second.
  */
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const night = clock.current ? 1 - clock.current.daylight : 0;
    facadeMaterial.emissiveIntensity = 0.12 + night * 0.72;
    trimMaterial.emissiveIntensity = 0.1 + night * 1.15;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      <mesh position={[centreX, 0.016, centreZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[district.radius, 80]} />
        <meshStandardMaterial color="#777b80" roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[centreX, 0.026, centreZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[district.radius - 0.5, district.radius - 0.26, 80]} />
        <meshStandardMaterial color="#d0d3d4" roughness={0.75} />
      </mesh>

      <RigidBody type="fixed" name={`district-${district.id}`} colliders={false}>
        <group position={[centreX, 0, centreZ]} rotation={[0, yaw, 0]}>
          {blocks.map((block, index) => (
            <Building
              key={index}
              block={block}
              index={index}
              form={district.form}
              facadeMaterial={facadeMaterial}
              trimMaterial={trimMaterial}
            />
          ))}
          <DistrictArchitecture
            district={district}
            blocks={blocks}
            accent={accent}
            trimMaterial={trimMaterial}
          />
        </group>

        <StationPortal
          district={district}
          accent={accent}
          clock={clock}
          position={[gateX, 0, gateZ]}
          yaw={yaw}
        />
      </RigidBody>
    </group>
  );
}

function Building({
  block,
  index,
  form,
  facadeMaterial,
  trimMaterial,
}: {
  block: BuildingBlock;
  index: number;
  form: District['form'];
  facadeMaterial: THREE.MeshStandardMaterial;
  trimMaterial: THREE.MeshStandardMaterial;
}) {
  return (
    <group position={[block.x, 0, block.z]} rotation={[0, block.rotation ?? 0, 0]}>
      <CuboidCollider args={[block.w / 2, block.h / 2, block.d / 2]} position={[0, block.h / 2, 0]} />
      <RoundedBox
        args={[block.w, block.h, block.d]}
        radius={Math.min(0.22, block.w * 0.035)}
        smoothness={3}
        position={[0, block.h / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={index % 2 === 0 ? '#17222b' : '#202a32'}
          roughness={0.68}
          metalness={0.14}
        />
      </RoundedBox>

      <mesh position={[0, block.h * 0.53, block.d / 2 + 0.025]}>
        <planeGeometry args={[block.w * 0.82, block.h * 0.68]} />
        <primitive object={facadeMaterial} attach="material" />
      </mesh>
      <mesh
        position={[block.w / 2 + 0.026, block.h * 0.53, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[block.d * 0.72, block.h * 0.62]} />
        <primitive object={facadeMaterial} attach="material" />
      </mesh>

      <RoundedBox
        args={[block.w + 0.34, 0.28, block.d + 0.34]}
        radius={0.1}
        smoothness={3}
        position={[0, block.h + 0.13, 0]}
        castShadow
      >
        <meshStandardMaterial color="#303a42" roughness={0.5} metalness={0.34} />
      </RoundedBox>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * block.w * 0.39, block.h * 0.53, block.d / 2 + 0.047]}>
          <boxGeometry args={[0.09, block.h * 0.72, 0.08]} />
          <primitive object={trimMaterial} attach="material" />
        </mesh>
      ))}

      <RoofFeature block={block} index={index} form={form} />
    </group>
  );
}

function RoofFeature({
  block,
  index,
  form,
}: {
  block: BuildingBlock;
  index: number;
  form: District['form'];
}) {
  if (form === 'arena' && index === 0) {
    return (
      <mesh position={[0, block.h + 0.2, 0]} scale={[block.w * 0.51, 2.2, block.d * 0.52]}>
        <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#3b4650" roughness={0.36} metalness={0.48} clearcoat={0.35} />
      </mesh>
    );
  }

  if (form === 'studio') {
    return (
      <mesh position={[0, block.h + 0.42, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[Math.min(block.w, block.d) * 0.17, Math.min(block.w, block.d) * 0.17, 0.8, 16]} />
        <meshPhysicalMaterial color="#355669" roughness={0.26} metalness={0.25} clearcoat={0.45} />
      </mesh>
    );
  }

  if (form === 'workshop' && index < 2) {
    return (
      <mesh position={[0, block.h + 0.46, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]} scale={[1, block.d * 0.72, block.w * 0.72]}>
        <cylinderGeometry args={[0.48, 0.48, 1, 4]} />
        <meshStandardMaterial color="#48525a" roughness={0.55} metalness={0.4} />
      </mesh>
    );
  }

  return (
    <group position={[0, block.h + 0.43, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * block.w * 0.3, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.15, 0.58, 14]} />
          <meshStandardMaterial color="#39434b" roughness={0.58} metalness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

function DistrictArchitecture({
  district,
  blocks,
  accent,
  trimMaterial,
}: {
  district: District;
  blocks: BuildingBlock[];
  accent: string;
  trimMaterial: THREE.MeshStandardMaterial;
}) {
  switch (district.form) {
    case 'campus':
      return (
        <group>
          <RoundedBox args={[9.4, 1.25, 2.1]} radius={0.22} smoothness={4} position={[0, 5.2, 0]} castShadow>
            <meshPhysicalMaterial
              color="#7eb6cc"
              roughness={0.18}
              metalness={0.08}
              transmission={0.22}
              transparent
              opacity={0.82}
            />
          </RoundedBox>
          {[-3.8, 3.8].map((x) => (
            <mesh key={x} position={[x, 2.6, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 5.2, 16]} />
              <meshStandardMaterial color="#b9c3c9" roughness={0.36} metalness={0.52} />
            </mesh>
          ))}
          <mesh position={[0, 0.12, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.1, 3.1, 0.18, 48]} />
            <meshPhysicalMaterial color="#4e8492" roughness={0.2} metalness={0.08} clearcoat={0.5} />
          </mesh>
        </group>
      );
    case 'arena':
      return (
        <group position={[0, 0, district.radius * 0.28]}>
          {Array.from({ length: 9 }, (_, index) => {
            const angle = (index / 9) * Math.PI;
            return (
              <mesh
                key={index}
                position={[(index - 4) * 1.35, 1.6 + Math.sin(angle) * 1.1, 0]}
                rotation={[0, 0, Math.cos(angle) * 0.18]}
              >
                <cylinderGeometry args={[0.08, 0.12, 3.3, 12]} />
                <primitive object={trimMaterial} attach="material" />
              </mesh>
            );
          })}
          <mesh position={[0, 3.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 8, 1]}>
            <torusGeometry args={[0.5, 0.08, 10, 32, Math.PI]} />
            <primitive object={trimMaterial} attach="material" />
          </mesh>
        </group>
      );
    case 'studio':
      return (
        <group position={[0, 0, 2.4]}>
          {[0, 1, 2].map((index) => (
            <mesh key={index} position={[(index - 1) * 2.1, 0.9 + index * 0.28, index * 0.34]} rotation={[0.2, 0, index * 0.28]}>
              <torusKnotGeometry args={[0.46, 0.12, 72, 10, 2, 3]} />
              <meshStandardMaterial color={accent} roughness={0.35} metalness={0.52} />
            </mesh>
          ))}
        </group>
      );
    case 'workshop':
      return (
        <group position={[blocks[2]?.x ?? 7, (blocks[2]?.h ?? 14) + 0.5, blocks[2]?.z ?? 5]}>
          <mesh>
            <cylinderGeometry args={[1.1, 1.18, 0.34, 24]} />
            <primitive object={trimMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.13, 0.19, 1.15, 14]} />
            <meshStandardMaterial color="#656e74" roughness={0.48} metalness={0.55} />
          </mesh>
        </group>
      );
    case 'court':
      return (
        <group position={[3.7, 0, 3.3]}>
          {[-1, 1].flatMap((x) =>
            [-1, 1].map((z) => (
              <mesh key={`${x}-${z}`} position={[x * 3.1, 2.25, z * 2.4]}>
                <cylinderGeometry args={[0.09, 0.13, 4.5, 14]} />
                <meshStandardMaterial color="#c1c8cc" roughness={0.4} metalness={0.48} />
              </mesh>
            )),
          )}
          <mesh position={[0, 4.5, 0]} scale={[3.5, 0.32, 2.8]}>
            <sphereGeometry args={[1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#6f8b96" roughness={0.3} metalness={0.26} clearcoat={0.3} />
          </mesh>
        </group>
      );
    case 'lookout':
    default:
      return (
        <group position={[0, 22.8, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.15, 0.13, 12, 48]} />
            <primitive object={trimMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.06, 0.14, 4.4, 12]} />
            <meshStandardMaterial color="#a5afb5" roughness={0.4} metalness={0.62} />
          </mesh>
          {[0.7, 1.3, 1.9].map((height) => (
            <mesh key={height} position={[0, height + 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.34, 0.035, 8, 24]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      );
  }
}

function StationPortal({
  district,
  accent,
  clock,
  position,
  yaw,
}: {
  district: District;
  accent: string;
  clock: React.RefObject<DayNight>;
  position: [number, number, number];
  yaw: number;
}) {
  const canopy = useMemo(() => createArchedCanopy(SPUR_WIDTH + 3.2), []);
  const sign = useMemo(() => createStationSignTexture(district, accent), [district, accent]);
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(
    () => () => {
      canopy.dispose();
      sign.dispose();
    },
    [canopy, sign],
  );

  useFrame(() => {
    if (!glow.current) return;
    const night = clock.current ? 1 - clock.current.daylight : 0;
    glow.current.emissiveIntensity = 0.18 + night * 1.8;
  });

  const columnX = SPUR_WIDTH / 2 + 0.7;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <capsuleGeometry args={[1.25, SPUR_WIDTH + 1.6, 8, 20]} />
        <meshStandardMaterial color="#363d43" roughness={0.76} metalness={0.18} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * columnX, 0, 0]}>
          <CylinderCollider args={[2.25, 0.22]} position={[0, 2.25, 0]} />
          <mesh position={[0, 2.25, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.29, 4.5, 18]} />
            <meshStandardMaterial color="#242e35" roughness={0.44} metalness={0.58} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.42, 0.5, 0.26, 20]} />
            <meshStandardMaterial color="#4b555c" roughness={0.58} metalness={0.5} />
          </mesh>
          <mesh position={[-side * 0.08, 2.18, 0.05]}>
            <boxGeometry args={[0.045, 3.2, 1.45]} />
            <meshPhysicalMaterial
              color="#77a7b8"
              roughness={0.08}
              metalness={0.05}
              transmission={0.45}
              transparent
              opacity={0.36}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      <mesh geometry={canopy} position={[0, 4.52, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#2d3942"
          roughness={0.33}
          metalness={0.56}
          clearcoat={0.28}
          clearcoatRoughness={0.36}
        />
      </mesh>

      <mesh position={[0, 4.55, 1.41]}>
        <planeGeometry args={[SPUR_WIDTH + 1.8, 1.3]} />
        <meshStandardMaterial
          ref={glow}
          map={sign}
          emissiveMap={sign}
          emissive={accent}
          emissiveIntensity={0.3}
          roughness={0.34}
          metalness={0.18}
        />
      </mesh>
      <RoundedBox args={[SPUR_WIDTH + 2.1, 1.58, 0.16]} radius={0.12} smoothness={3} position={[0, 4.55, 1.5]}>
        <meshStandardMaterial color="#111920" roughness={0.48} metalness={0.48} />
      </RoundedBox>
      {/* Re-render the sign just in front of its frame. */}
      <mesh position={[0, 4.55, 1.59]}>
        <planeGeometry args={[SPUR_WIDTH + 1.8, 1.3]} />
        <meshStandardMaterial
          map={sign}
          emissiveMap={sign}
          emissive={accent}
          emissiveIntensity={0.28}
          roughness={0.32}
        />
      </mesh>

      {[-3.3, -1.1, 1.1, 3.3].map((x) => (
        <group key={x} position={[x, 4.25, -0.65]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.11, 0.035, 20]} />
            <meshStandardMaterial color="#f1d5a0" emissive="#ffc66d" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={side} position={[side * (SPUR_WIDTH / 2 - 0.45), 0, 1.75]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.14, 0.84, 14]} />
            <meshStandardMaterial color="#68737a" roughness={0.4} metalness={0.58} />
          </mesh>
          <mesh position={[0, 0.87, 0]}>
            <sphereGeometry args={[0.13, 14, 10]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.42} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function massing(district: District): BuildingBlock[] {
  const random = seeded(district.bearing * 977 + 13);
  const radius = district.radius;

  switch (district.form) {
    case 'campus':
      return [
        { x: -radius * 0.45, z: 0, w: 5.6, d: 12.4, h: 5.4 },
        { x: radius * 0.45, z: 0, w: 5.6, d: 12.4, h: 5.4 },
        { x: 0, z: -radius * 0.5, w: 14.4, d: 5.5, h: 6.8 },
      ];
    case 'arena':
      return [
        { x: 0, z: -radius * 0.35, w: 16.4, d: 11.4, h: 8.6 },
        { x: -5.5, z: radius * 0.35, w: 2.8, d: 2.8, h: 2.6 },
        { x: 0, z: radius * 0.4, w: 3.2, d: 3.2, h: 3.6 },
        { x: 5.5, z: radius * 0.35, w: 2.8, d: 2.8, h: 2.1 },
      ];
    case 'studio':
      return Array.from({ length: 5 }, (_, index) => ({
        x: (random() - 0.5) * radius * 1.08,
        z: (random() - 0.5) * radius * 1.08,
        w: 3.8 + random() * 2.2,
        d: 3.8 + random() * 2.2,
        h: 4.2 + random() * 3.8,
        rotation: (random() - 0.5) * 0.48 + index * 0.04,
      }));
    case 'workshop':
      return [
        { x: -3, z: 0, w: 8.4, d: 16.2, h: 6.2 },
        { x: 6, z: -3, w: 6.4, d: 9.4, h: 5.2 },
        { x: 8, z: 6, w: 2.4, d: 2.4, h: 14.2 },
      ];
    case 'court':
      return [
        { x: -radius * 0.4, z: 0, w: 6.4, d: 10.4, h: 4.8 },
        { x: radius * 0.3, z: -radius * 0.4, w: 3.3, d: 3.3, h: 3.2 },
      ];
    case 'lookout':
    default:
      return [
        { x: 0, z: 0, w: 5.4, d: 5.4, h: 22.4 },
        { x: -6, z: 4, w: 4.4, d: 4.4, h: 4.3 },
      ];
  }
}

function StreetLamps({
  clock,
  quality,
}: {
  clock: React.RefObject<DayNight>;
  quality: Quality;
}) {
  const posts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius =
          RING_RADIUS + (index % 2 === 0 ? ROAD_WIDTH / 2 + 1.45 : -ROAD_WIDTH / 2 - 1.45);
        const x = Math.sin(angle) * radius;
        const z = -Math.cos(angle) * radius;
        const radialX = x / radius;
        const radialZ = z / radius;
        const direction = index % 2 === 0 ? -1 : 1;
        const directionX = radialX * direction;
        const directionZ = radialZ * direction;
        const yaw = Math.atan2(-directionZ, directionX);
        return { x, z, directionX, directionZ, yaw };
      }),
    [],
  );

  const bulbs = useRef<THREE.MeshStandardMaterial[]>([]);
  const lights = useRef<THREE.PointLight[]>([]);

  useFrame(() => {
    const night = clock.current ? 1 - clock.current.daylight : 0;
    for (const bulb of bulbs.current) if (bulb) bulb.emissiveIntensity = 0.12 + night * 3.2;
    for (const light of lights.current) {
      if (!light) continue;
      light.intensity = night * 17;
      light.visible = night > 0.08;
    }
  });

  return (
    <>
      <RigidBody type="fixed" name="lamps" colliders={false}>
        {posts.map((post, index) => (
          <CylinderCollider key={index} args={[2.55, 0.14]} position={[post.x, 2.55, post.z]} />
        ))}
      </RigidBody>

      <Instances limit={posts.length} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 5.1, 14, 2]} />
        <meshStandardMaterial color="#263039" roughness={0.48} metalness={0.58} />
        {posts.map((post, index) => (
          <Instance key={index} position={[post.x, 2.55, post.z]} />
        ))}
      </Instances>

      <Instances limit={posts.length} castShadow>
        <cylinderGeometry args={[0.21, 0.28, 0.26, 18]} />
        <meshStandardMaterial color="#4c565d" roughness={0.55} metalness={0.52} />
        {posts.map((post, index) => (
          <Instance key={index} position={[post.x, 0.13, post.z]} />
        ))}
      </Instances>

      <Instances limit={posts.length} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.92, 12]} />
        <meshStandardMaterial color="#2b353d" roughness={0.46} metalness={0.6} />
        {posts.map((post, index) => (
          <Instance
            key={index}
            position={[
              post.x + post.directionX * 0.42,
              5.02,
              post.z + post.directionZ * 0.42,
            ]}
            rotation={[0, post.yaw, Math.PI / 2]}
          />
        ))}
      </Instances>

      {posts.map((post, index) => (
        <group
          key={index}
          position={[
            post.x + post.directionX * 0.86,
            4.95,
            post.z + post.directionZ * 0.86,
          ]}
          rotation={[0, post.yaw, 0]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.13, 0.48, 6, 14]} />
            <meshStandardMaterial color="#303941" roughness={0.42} metalness={0.62} />
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <boxGeometry args={[0.58, 0.035, 0.17]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material && !bulbs.current.includes(material)) bulbs.current.push(material);
              }}
              color="#ffe8bd"
              emissive="#ffc875"
              emissiveIntensity={0.12}
              roughness={0.24}
            />
          </mesh>
          <mesh position={[-0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.095, 0.16, 12]} />
            <meshStandardMaterial color="#202930" roughness={0.46} metalness={0.64} />
          </mesh>
          {index < quality.lampLights ? (
            <pointLight
              ref={(light) => {
                if (light && !lights.current.includes(light)) lights.current.push(light);
              }}
              position={[0, -0.18, 0]}
              color="#ffd9a0"
              intensity={0}
              distance={15}
              decay={2}
            />
          ) : null}
        </group>
      ))}
    </>
  );
}

function Crates() {
  const crates = useMemo(() => {
    const random = seeded(515);
    const stacks: [number, number][] = [
      [-10, 4],
      [11, -3],
      [RING_RADIUS - 14, RING_RADIUS - 14],
    ];
    return stacks.flatMap((stack, stackIndex) =>
      Array.from({ length: 6 }, (_, index) => ({
        key: `${stackIndex}-${index}`,
        x: stack[0] + (random() - 0.5) * 1.7,
        y: 0.52 + Math.floor(index / 2) * 1.04,
        z: stack[1] + (random() - 0.5) * 1.7,
        spin: random() * Math.PI,
      })),
    );
  }, []);

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
        </RigidBody>
      ))}
    </>
  );
}

function Boundary() {
  const height = 6;
  return (
    <RigidBody type="fixed" name="boundary">
      <CuboidCollider args={[HALF, height, 0.5]} position={[0, height, HALF]} />
      <CuboidCollider args={[HALF, height, 0.5]} position={[0, height, -HALF]} />
      <CuboidCollider args={[0.5, height, HALF]} position={[HALF, height, 0]} />
      <CuboidCollider args={[0.5, height, HALF]} position={[-HALF, height, 0]} />
    </RigidBody>
  );
}
