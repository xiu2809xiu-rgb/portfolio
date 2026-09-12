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
 * The woodland.
 *
 * The previous version was 260 copies of one cone, which at any distance reads
 * as a field of traffic cones rather than as trees. Three things fix that and
 * none of them costs a byte of download: more than one species, per-instance
 * colour and non-uniform scale, and wind.
 *
 * Geometry is merged once at module scope and drawn with a raw InstancedMesh —
 * one draw call per species. drei's <Instances> is the wrong tool at this count:
 * it keeps a React array of child refs and rebuilds it on every mount, which is
 * fine for a dozen lamps and quadratic misery for a thousand trees.
 */

/* ── Species ──────────────────────────────────────────────────────────────
   Each is built from primitives, given a per-vertex colour, and tagged with a
   sway weight: 0 at the roots, 1 at the outermost foliage. That attribute is
   what lets one uniform move a whole forest believably — the trunks stay put
   and the canopies travel, which is what wind actually looks like. */

const BARK = new THREE.Color('#3b2c1f');

function tagged(
  source: THREE.BufferGeometry,
  colour: THREE.Color,
  swayAt: (y: number) => number,
): THREE.BufferGeometry {
  /*
    Everything is un-indexed before merging. `mergeGeometries` returns null —
    silently, as far as a render is concerned — if some inputs carry an index
    and others do not, and the primitives here are mixed: cylinders and cones
    are indexed, icosahedra are not. Flat shading wants un-indexed anyway, so
    this costs nothing and removes the whole class of failure.
  */
  const geometry = source.index ? source.toNonIndexed() : source;
  const count = geometry.attributes.position.count;
  const colours = new Float32Array(count * 3);
  const sway = new Float32Array(count);
  const position = geometry.attributes.position;

  for (let i = 0; i < count; i += 1) {
    colours[i * 3] = colour.r;
    colours[i * 3 + 1] = colour.g;
    colours[i * 3 + 2] = colour.b;
    sway[i] = swayAt(position.getY(i));
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geometry.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  return geometry;
}

/** Merge, loudly. A null here renders as nothing at all and is worth naming. */
function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = mergeGeometries(parts, false);
  if (!result) throw new Error('drive: tree geometry failed to merge (attribute mismatch)');
  return result;
}

/** A trunk, tapered, with almost no sway near the ground. */
function trunk(height: number, radius: number, sides = 6): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius * 0.62, radius, height, sides, 1);
  g.translate(0, height / 2, 0);
  return tagged(g, BARK, (y) => Math.max(0, (y / height) * 0.25));
}

/** Broadleaf: a cluster of irregular blobs. The irregularity is the whole job. */
function broadleaf(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [trunk(2.1, 0.2)];
  const leaf = new THREE.Color('#2f6b2a');

  const blobs: [number, number, number, number][] = [
    [0, 2.9, 0, 1.25],
    [0.75, 2.55, 0.35, 0.85],
    [-0.6, 2.7, -0.5, 0.78],
    [0.15, 3.55, -0.25, 0.72],
  ];

  for (const [x, y, z, r] of blobs) {
    const g = new THREE.IcosahedronGeometry(r, 0);
    /* Squash each blob and nudge its vertices so no two read as the same ball. */
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      pos.setXYZ(
        i,
        pos.getX(i) * (0.9 + ((i * 37) % 11) / 40),
        pos.getY(i) * 0.78,
        pos.getZ(i) * (0.9 + ((i * 53) % 13) / 44),
      );
    }
    g.computeVertexNormals();
    g.translate(x, y, z);
    const tone = leaf.clone().offsetHSL(0, 0, ((r * 100) % 7) / 90 - 0.03);
    parts.push(tagged(g, tone, (vy) => THREE.MathUtils.clamp((vy - 1.4) / 2.4, 0, 1)));
  }
  return merged(parts);
}

/** Conifer: stacked skirts rather than one cone, so it has a silhouette. */
function conifer(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [trunk(1.5, 0.17, 5)];
  const needle = new THREE.Color('#1f4f31');

  const skirts: [number, number, number][] = [
    [1.3, 1.45, 1.7],
    [2.4, 1.1, 1.5],
    [3.35, 0.72, 1.25],
  ];

  for (const [y, r, h] of skirts) {
    const g = new THREE.ConeGeometry(r, h, 7, 1);
    g.translate(0, y + h / 2, 0);
    const tone = needle.clone().offsetHSL(0, 0, (r % 0.3) / 12 - 0.012);
    parts.push(tagged(g, tone, (vy) => THREE.MathUtils.clamp((vy - 1.0) / 3.2, 0, 1)));
  }
  return merged(parts);
}

/** Scrub: knee-high, no trunk. Fills the ground between the trees. */
function scrub(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bush = new THREE.Color('#3d6b2f');

  const blobs: [number, number, number, number][] = [
    [0, 0.42, 0, 0.55],
    [0.42, 0.32, 0.2, 0.38],
    [-0.3, 0.3, -0.3, 0.34],
  ];

  for (const [x, y, z, r] of blobs) {
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.scale(1, 0.72, 1);
    g.translate(x, y, z);
    parts.push(tagged(g, bush, (vy) => THREE.MathUtils.clamp(vy / 0.9, 0, 1) * 0.6));
  }
  return merged(parts);
}

/* Built once, at module scope — these never change and every instance shares them. */
const SPECIES = [
  { geometry: broadleaf(), share: 0.42, minScale: 0.85, maxScale: 1.5, collides: true },
  { geometry: conifer(), share: 0.38, minScale: 0.9, maxScale: 1.7, collides: true },
  { geometry: scrub(), share: 0.2, minScale: 0.8, maxScale: 1.6, collides: false },
];

/* ── Wind ─────────────────────────────────────────────────────────────────
   Injected into three's own shader rather than written as a custom material, so
   the trees keep shadows, fog and lighting for free.

   The displacement goes in at <begin_vertex> and normals are deliberately NOT
   recomputed: the normal chunks have already run by that point, and a canopy
   leaning a few centimetres does not change which way its leaves face by any
   amount a viewer could detect. */
const WIND_UNIFORMS = { uTime: { value: 0 }, uWind: { value: 0.16 } };

const WIND_PARS = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  attribute float aSway;
`;

const WIND_BODY = /* glsl */ `
  #include <begin_vertex>
  {
    /* Phase from the instance's own position, so the wood moves as a field of
       individuals rather than as one rigid object. */
    vec3 instancePos = instanceMatrix[3].xyz;
    float phase = instancePos.x * 0.14 + instancePos.z * 0.19;
    float t = uTime * 1.05 + phase;
    float gust = 0.7 + 0.3 * sin(uTime * 0.23 + instancePos.z * 0.03);
    transformed.x += sin(t) * aSway * uWind * gust;
    transformed.z += cos(t * 0.81) * aSway * uWind * 0.65 * gust;
    transformed.y -= abs(sin(t)) * aSway * uWind * 0.12;
  }
`;

function addWind(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = WIND_UNIFORMS.uTime;
    shader.uniforms.uWind = WIND_UNIFORMS.uWind;
    shader.vertexShader = WIND_PARS + shader.vertexShader.replace('#include <begin_vertex>', WIND_BODY);
  };
  /*
    A constant key, not one built from the shader text. The default cache key is
    the stringified onBeforeCompile, which is stable here — but being explicit
    means the program is shared between the visible material and the depth
    material below instead of being compiled twice.
  */
  material.customProgramCacheKey = () => 'drive-wind';
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

export function Trees() {
  const placed = useMemo(() => {
    const random = seeded(20260901);
    const out: Placed[] = [];
    let guard = 0;

    while (out.length < 620 && guard < 60000) {
      guard += 1;
      const x = (random() - 0.5) * 2 * (HALF - 2);
      const z = (random() - 0.5) * 2 * (HALF - 2);
      const fromCentre = Math.hypot(x, z);

      if (onRoad(x, z)) continue;
      if (inDistrict(x, z)) continue;
      /* Keep the gates and their approaches readable from the ring. */
      if (
        districts.some((d) => {
          const [gx, gz] = districtGate(d);
          return Math.hypot(x - gx, z - gz) < 12;
        })
      ) {
        continue;
      }

      /* Denser further out: parkland inside the ring, forest beyond it. */
      const density = THREE.MathUtils.clamp(
        (fromCentre - PLAZA_RADIUS) / (HALF - PLAZA_RADIUS),
        0,
        1,
      );
      if (random() > 0.3 + density * 0.7) continue;

      const roll = random();
      let species = 0;
      let acc = 0;
      for (let i = 0; i < SPECIES.length; i += 1) {
        acc += SPECIES[i].share;
        if (roll <= acc) {
          species = i;
          break;
        }
      }

      /* Scrub may crowd; trees may not. */
      const spacing = species === 2 ? 1.6 : 3.2;
      if (out.some((t) => Math.hypot(t.x - x, t.z - z) < spacing)) continue;

      const s = SPECIES[species];
      out.push({
        x,
        z,
        scale: s.minScale + random() * (s.maxScale - s.minScale),
        spin: random() * Math.PI * 2,
        species,
        tint: 0.82 + random() * 0.34,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    WIND_UNIFORMS.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      {SPECIES.map((species, index) => (
        <Grove
          key={index}
          geometry={species.geometry}
          items={placed.filter((p) => p.species === index)}
        />
      ))}

      {/* Colliders only for things tall enough to be worth hitting. Scrub is
          scenery; giving it a collider would mean 120 more broadphase entries
          so the car can be stopped by a bush. */}
      <RigidBody type="fixed" name="trees">
        {placed
          .filter((p) => SPECIES[p.species].collides)
          .map((tree, i) => (
            <CylinderCollider
              key={i}
              args={[1.6 * tree.scale, 0.34 * tree.scale]}
              position={[tree.x, 1.6 * tree.scale, tree.z]}
            />
          ))}
      </RigidBody>
    </>
  );
}

/** One species, one draw call. */
function Grove({ geometry, items }: { geometry: THREE.BufferGeometry; items: Placed[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0,
      /* Flat shading reads better than smooth on low-poly foliage: it gives
         each facet its own value, which is what makes a blob look like leaves
         rather than like a balloon. */
      flatShading: true,
    });
    addWind(m);
    return m;
  }, []);

  /*
    The depth material needs the same displacement or the shadows stay still
    while the trees move, which is more distracting than no wind at all.
  */
  const depthMaterial = useMemo(() => {
    const m = new THREE.MeshDepthMaterial();
    addWind(m);
    return m;
  }, []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const colour = new THREE.Color();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    items.forEach((item, i) => {
      position.set(item.x, 0, item.z);
      quaternion.setFromAxisAngle(up, item.spin);
      /* Non-uniform: a wood where every tree is the same proportion reads as
         one tree copied, which is exactly what it was. */
      scale.set(item.scale * (0.9 + (i % 5) * 0.045), item.scale, item.scale * (0.92 + (i % 3) * 0.05));
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
      colour.setScalar(item.tint);
      mesh.setColorAt(i, colour);
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
      /* The wood spans the whole map and the bounding sphere three computes for
         an InstancedMesh is the source geometry's, not the instances'. Culling
         against it would pop the entire species in and out at once. */
      frustumCulled={false}
    />
  );
}
