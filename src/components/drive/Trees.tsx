'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import {
  districtGate,
  districts,
  HALF,
  inDistrict,
  onRoad,
  PLAZA_RADIUS,
} from '@/content/drive-world';

/**
 * Instanced procedural woodland.
 *
 * The trees stay asset-free, but they are no longer low-poly symbols. Rounded,
 * irregular crown volumes, visible branching, tapered trunks, layered conifer
 * boughs, vertex-level colour variation, and wind produce a natural silhouette
 * while retaining three draw calls for the whole forest.
 */

const BARK = new THREE.Color('#493425');
const BARK_DARK = new THREE.Color('#30231b');
const LEAF_TONES = ['#315f2b', '#3f7433', '#275438', '#557d36'].map(
  (colour) => new THREE.Color(colour),
);
const NEEDLE_TONES = ['#173e30', '#20513a', '#2a5e3d', '#18392d'].map(
  (colour) => new THREE.Color(colour),
);

function tagged(
  source: THREE.BufferGeometry,
  colour: THREE.Color,
  swayAt: (y: number) => number,
): THREE.BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source;
  const count = geometry.attributes.position.count;
  const colours = new Float32Array(count * 3);
  const sway = new Float32Array(count);
  const position = geometry.attributes.position;

  for (let i = 0; i < count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const variation = 0.94 + Math.sin(x * 7.7 + y * 4.3 + z * 6.1) * 0.045;
    colours[i * 3] = colour.r * variation;
    colours[i * 3 + 1] = colour.g * variation;
    colours[i * 3 + 2] = colour.b * variation;
    sway[i] = swayAt(y);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geometry.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  return geometry;
}

function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = mergeGeometries(parts, false);
  if (!result) throw new Error('drive: tree geometry failed to merge (attribute mismatch)');
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

function trunk(height: number, radius: number, sides = 12): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius * 0.56, radius, height, sides, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i) + height / 2;
    const bend = Math.sin(y * 1.35) * radius * 0.07;
    position.setX(i, position.getX(i) + bend * (y / height));
  }
  geometry.computeVertexNormals();
  geometry.translate(0, height / 2, 0);
  return tagged(geometry, BARK, (y) => Math.max(0, (y / height) * 0.2));
}

function branch(
  start: THREE.Vector3,
  end: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  colour = BARK_DARK,
): THREE.BufferGeometry {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(endRadius, startRadius, length, 6, 1);
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    ),
  );
  geometry.translate(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    (start.z + end.z) / 2,
  );
  return tagged(geometry, colour, (y) => THREE.MathUtils.clamp((y - 1.1) / 3.8, 0, 0.7));
}

function crown(
  centre: [number, number, number],
  size: [number, number, number],
  seed: number,
  colour: THREE.Color,
  swayBase = 1.35,
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, 8, 6);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const ripple =
      1 +
      Math.sin(x * 5.1 + y * 3.7 + seed) * 0.065 +
      Math.cos(z * 6.3 - y * 2.9 + seed * 1.7) * 0.045;
    position.setXYZ(
      i,
      centre[0] + x * size[0] * ripple,
      centre[1] + y * size[1] * (1 + Math.sin(x * 4 + seed) * 0.035),
      centre[2] + z * size[2] * ripple,
    );
  }

  geometry.computeVertexNormals();
  return tagged(geometry, colour, (y) =>
    THREE.MathUtils.clamp((y - swayBase) / Math.max(centre[1] + size[1] - swayBase, 0.2), 0, 1),
  );
}

function broadleaf(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [trunk(2.75, 0.24)];
  const branchEnds: [number, number, number][] = [
    [0.9, 3.15, 0.25],
    [-0.82, 3.0, -0.38],
    [0.22, 3.5, -0.78],
    [-0.25, 3.72, 0.62],
    [0.6, 3.85, 0.55],
  ];

  branchEnds.forEach(([x, y, z], index) => {
    const start = new THREE.Vector3(0, 1.62 + index * 0.12, 0);
    const end = new THREE.Vector3(x, y - 0.42, z);
    parts.push(branch(start, end, 0.085, 0.035));
  });

  const crowns: Array<{
    centre: [number, number, number];
    size: [number, number, number];
    tone: number;
  }> = [
    { centre: [0, 3.72, 0], size: [1.28, 1.05, 1.18], tone: 1 },
    { centre: [0.88, 3.35, 0.28], size: [0.88, 0.77, 0.82], tone: 0 },
    { centre: [-0.76, 3.34, -0.38], size: [0.86, 0.76, 0.82], tone: 2 },
    { centre: [0.18, 4.36, -0.34], size: [0.83, 0.71, 0.78], tone: 3 },
    { centre: [-0.32, 4.08, 0.66], size: [0.8, 0.7, 0.76], tone: 0 },
    { centre: [0.67, 4.06, 0.58], size: [0.72, 0.64, 0.7], tone: 2 },
    { centre: [-0.92, 3.82, 0.4], size: [0.64, 0.58, 0.68], tone: 1 },
  ];

  crowns.forEach((blob, index) => {
    parts.push(crown(blob.centre, blob.size, 17 + index * 11, LEAF_TONES[blob.tone]));
  });

  return merged(parts);
}

function coniferTier(y: number, radius: number, height: number, seed: number, tone: number) {
  const geometry = new THREE.ConeGeometry(radius, height, 10, 1, false);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const irregular = 1 + Math.sin(angle * 5 + seed) * 0.07 + Math.cos(angle * 9 - seed) * 0.035;
    position.setX(i, x * irregular);
    position.setZ(i, z * irregular);
  }
  geometry.computeVertexNormals();
  geometry.translate(0, y, 0);
  return tagged(geometry, NEEDLE_TONES[tone], (vy) =>
    THREE.MathUtils.clamp((vy - 0.8) / 4.2, 0, 1),
  );
}

function conifer(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [trunk(4.65, 0.2, 10)];
  const tiers = [
    { y: 1.42, r: 1.48, h: 1.38, tone: 0 },
    { y: 2.0, r: 1.34, h: 1.42, tone: 2 },
    { y: 2.58, r: 1.16, h: 1.36, tone: 1 },
    { y: 3.12, r: 0.98, h: 1.28, tone: 3 },
    { y: 3.64, r: 0.78, h: 1.18, tone: 1 },
    { y: 4.1, r: 0.56, h: 1.05, tone: 2 },
  ];

  tiers.forEach((tier, index) => {
    parts.push(coniferTier(tier.y, tier.r, tier.h, 29 + index * 7, tier.tone));
    if (index % 2 === 0) {
      for (let spoke = 0; spoke < 7; spoke += 1) {
        const angle = (spoke / 7) * Math.PI * 2 + index * 0.23;
        const reach = tier.r * 0.82;
        parts.push(
          branch(
            new THREE.Vector3(0, tier.y + 0.1, 0),
            new THREE.Vector3(Math.cos(angle) * reach, tier.y - 0.12, Math.sin(angle) * reach),
            0.042,
            0.014,
          ),
        );
      }
    }
  });

  return merged(parts);
}

function scrub(): THREE.BufferGeometry {
  const blobs: Array<{
    centre: [number, number, number];
    size: [number, number, number];
    tone: number;
  }> = [
    { centre: [0, 0.56, 0], size: [0.68, 0.54, 0.62], tone: 1 },
    { centre: [0.48, 0.43, 0.22], size: [0.48, 0.4, 0.46], tone: 0 },
    { centre: [-0.42, 0.42, -0.28], size: [0.5, 0.38, 0.45], tone: 2 },
    { centre: [-0.25, 0.5, 0.38], size: [0.43, 0.4, 0.42], tone: 3 },
    { centre: [0.3, 0.62, -0.3], size: [0.4, 0.42, 0.39], tone: 1 },
  ];
  return merged(
    blobs.map((blob, index) =>
      crown(blob.centre, blob.size, 73 + index * 9, LEAF_TONES[blob.tone], 0.05),
    ),
  );
}

const SPECIES = [
  { geometry: broadleaf(), share: 0.46, minScale: 0.82, maxScale: 1.38, collides: true },
  { geometry: conifer(), share: 0.34, minScale: 0.88, maxScale: 1.48, collides: true },
  { geometry: scrub(), share: 0.2, minScale: 0.8, maxScale: 1.55, collides: false },
];

const WIND_UNIFORMS = { uTime: { value: 0 }, uWind: { value: 0.12 } };
const WIND_PARS = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  attribute float aSway;
`;
const WIND_BODY = /* glsl */ `
  #include <begin_vertex>
  {
    vec3 instancePos = instanceMatrix[3].xyz;
    float phase = instancePos.x * 0.14 + instancePos.z * 0.19;
    float t = uTime * 0.92 + phase;
    float gust = 0.72 + 0.28 * sin(uTime * 0.21 + instancePos.z * 0.03);
    transformed.x += sin(t) * aSway * uWind * gust;
    transformed.z += cos(t * 0.81) * aSway * uWind * 0.62 * gust;
    transformed.y -= abs(sin(t)) * aSway * uWind * 0.08;
  }
`;

function addWind(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = WIND_UNIFORMS.uTime;
    shader.uniforms.uWind = WIND_UNIFORMS.uWind;
    shader.vertexShader = WIND_PARS + shader.vertexShader.replace('#include <begin_vertex>', WIND_BODY);
  };
  material.customProgramCacheKey = () => 'drive-natural-wind-v2';
}

interface Placed {
  x: number;
  z: number;
  scale: number;
  spin: number;
  species: number;
  tint: number;
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Trees({ count = 620 }: { count?: number }) {
  const placed = useMemo(() => {
    const random = seeded(20260901);
    const out: Placed[] = [];
    let guard = 0;

    while (out.length < count && guard < 60000) {
      guard += 1;
      const x = (random() - 0.5) * 2 * (HALF - 2);
      const z = (random() - 0.5) * 2 * (HALF - 2);
      const fromCentre = Math.hypot(x, z);

      if (onRoad(x, z) || inDistrict(x, z)) continue;
      if (
        districts.some((district) => {
          const [gx, gz] = districtGate(district);
          return Math.hypot(x - gx, z - gz) < 12;
        })
      ) {
        continue;
      }

      const density = THREE.MathUtils.clamp(
        (fromCentre - PLAZA_RADIUS) / (HALF - PLAZA_RADIUS),
        0,
        1,
      );
      if (random() > 0.3 + density * 0.7) continue;

      const roll = random();
      let species = 0;
      let accumulated = 0;
      for (let i = 0; i < SPECIES.length; i += 1) {
        accumulated += SPECIES[i].share;
        if (roll <= accumulated) {
          species = i;
          break;
        }
      }

      const spacing = species === 2 ? 1.6 : 3.35;
      if (out.some((tree) => Math.hypot(tree.x - x, tree.z - z) < spacing)) continue;

      const selected = SPECIES[species];
      out.push({
        x,
        z,
        scale: selected.minScale + random() * (selected.maxScale - selected.minScale),
        spin: random() * Math.PI * 2,
        species,
        tint: 0.88 + random() * 0.24,
      });
    }
    return out;
  }, [count]);

  useFrame((state) => {
    WIND_UNIFORMS.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      {SPECIES.map((species, index) => (
        <Grove
          key={index}
          geometry={species.geometry}
          items={placed.filter((tree) => tree.species === index)}
        />
      ))}

      <RigidBody type="fixed" name="trees">
        {placed
          .filter((tree) => SPECIES[tree.species].collides)
          .map((tree, index) => (
            <CylinderCollider
              key={index}
              args={[1.75 * tree.scale, 0.3 * tree.scale]}
              position={[tree.x, 1.75 * tree.scale, tree.z]}
            />
          ))}
      </RigidBody>
    </>
  );
}

function Grove({ geometry, items }: { geometry: THREE.BufferGeometry; items: Placed[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(() => {
    const next = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0,
      flatShading: false,
      dithering: true,
    });
    addWind(next);
    return next;
  }, []);

  const depthMaterial = useMemo(() => {
    const next = new THREE.MeshDepthMaterial();
    addWind(next);
    return next;
  }, []);

  useEffect(
    () => () => {
      material.dispose();
      depthMaterial.dispose();
    },
    [material, depthMaterial],
  );

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const colour = new THREE.Color();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    items.forEach((item, index) => {
      position.set(item.x, 0, item.z);
      quaternion.setFromAxisAngle(up, item.spin);
      scale.set(
        item.scale * (0.91 + (index % 5) * 0.035),
        item.scale,
        item.scale * (0.93 + (index % 4) * 0.028),
      );
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      colour.setScalar(item.tint);
      mesh.setColorAt(index, colour);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.customDepthMaterial = depthMaterial;
  }, [items, depthMaterial]);

  if (!items.length) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      frustumCulled={false}
      dispose={null}
    />
  );
}
