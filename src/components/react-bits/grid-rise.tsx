"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { cn } from "@/lib/utils";

export interface GridRiseProps {
  color?: string;
  accent?: string;
  background?: string;
  relief?: number;
  accentStrength?: number;
  cellSize?: number;
  gap?: number;
  rounding?: number;
  amplitude?: number;
  lift?: number;
  liftRadius?: number;
  speed?: number;
  zoom?: number;
  orbit?: number;
  distance?: number;
  altitude?: number;
  haze?: number;
  samples?: number;
  dpr?: number;
  maxFps?: number;
  drift?: number;
  ease?: number;
  interactive?: boolean;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const toLinear = (hex: string): [number, number, number] => {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const packed = Number.parseInt(full, 16);
  const safe = Number.isFinite(packed) ? packed : 0;
  const lift = (byte: number) => {
    const unit = byte / 255;
    return unit <= 0.04045
      ? unit / 12.92
      : Math.pow((unit + 0.055) / 1.055, 2.4);
  };
  return [lift((safe >> 16) & 255), lift((safe >> 8) & 255), lift(safe & 255)];
};

const surfaceVertex = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

const buildFragment = (aa: number, soft: boolean) => `
precision highp float;

#define AA ${aa}
${soft ? "#define ROUND" : ""}
#define STEPS 96

uniform vec2 uSize;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform float uZoom;
uniform float uTime;
uniform vec2 uFocus;
uniform float uCell;
uniform float uGap;
uniform float uAmp;
uniform float uLift;
uniform float uReach;
uniform float uRound;
uniform float uRest;
uniform vec3 uSun;
uniform float uCeil;
uniform float uNear;
uniform float uFar;
uniform float uReveal;
uniform vec3 uTop;
uniform vec3 uSide;
uniform vec3 uFace;
uniform vec3 uAccent;
uniform float uAccentMix;
uniform vec3 uBack;

varying vec2 vUv;

const float TAU = 6.2831853;

float hash21(vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

float grip(vec2 mid) {
  float span = smoothstep(0.0, uReach, length(mid - uFocus));
  return 1.0 - mix(span, sqrt(span), 0.2);
}

float lidY(vec2 cell) {
  vec2 mid = cell * uCell + uCell * 0.5;
  float far = length(mid - uFocus);
  if (far >= uReach) return uRest;
  float span = smoothstep(0.0, uReach, far);
  float hold = 1.0 - mix(span, sqrt(span), 0.2);
  float wob = sin(hash21(cell * 0.001) * TAU + uTime * (2.0 + far * 0.015));
  return uRest + (uLift + wob * uAmp) * hold;
}

vec3 paint(vec3 n, vec2 mid, float hit) {
  float lambert = dot(uSun, n) * 0.5 + 0.5;
  vec3 flank = mix(uSide, uFace, smoothstep(0.35, 0.65, abs(n.z)));
  vec3 tone = mix(flank * lambert, uTop, smoothstep(0.35, 0.65, n.y));
  tone = mix(tone, uAccent * (0.28 + lambert * 0.82), grip(mid) * uAccentMix);
  return mix(tone, uBack, smoothstep(uNear, uFar, hit));
}

bool ledge(vec3 rd, vec3 inv, vec2 dir, float lo, float hi, out vec3 hue) {
  if (rd.y > -1e-4) return false;
  float tp = (uRest - uEye.y) * inv.y;
  if (tp <= lo || tp >= hi) return false;

  vec3 p = uEye + rd * tp;
  vec2 off = mod(p.xz, uCell) - uCell * 0.5;
  vec2 loc = abs(off);
  float wall = uCell * 0.5 * (1.0 - uGap);
  vec2 mid = p.xz - off;

  if (max(loc.x, loc.y) <= wall) {
    hue = paint(vec3(0.0, 1.0, 0.0), mid, tp);
  } else {
    vec3 n = loc.x > loc.y
      ? vec3(-dir.x, 0.0, 0.0)
      : vec3(0.0, 0.0, -dir.y);
    hue = paint(n, mid, tp);
  }
  return true;
}

#ifdef ROUND
float tile(vec3 p, float wall, float top) {
  vec3 d;
  d.x = abs(p.x) - wall + uRound;
  d.z = abs(p.z) - wall + uRound;
  d.y = p.y - top + uRound;
  vec3 q = max(d, 0.0);
  float body =
    length(q) - uRound + min(max(d.x, max(d.y, d.z)), 0.0);
  return max(body, top - 0.7 - p.y);
}

vec3 tileNormal(vec3 p, float wall, float top) {
  vec2 e = vec2(1.0, -1.0) * 0.0005;
  return normalize(
    e.xyy * tile(p + e.xyy, wall, top) +
    e.yyx * tile(p + e.yyx, wall, top) +
    e.yxy * tile(p + e.yxy, wall, top) +
    e.xxx * tile(p + e.xxx, wall, top)
  );
}
#endif

vec3 trace(vec2 uv) {
  vec3 rd = normalize(uRight * uv.x + uUp * uv.y + uFwd * uZoom);
  vec3 inv = 1.0 / (max(abs(rd), vec3(1e-5)) * (step(0.0, rd) * 2.0 - 1.0));
  vec2 dir = step(0.0, rd.xz) * 2.0 - 1.0;

  float t = 0.0;
  if (uEye.y > uCeil) {
    if (rd.y > -1e-4) return uBack;
    t = (uEye.y - uCeil) * -inv.y;
  }
  if (t >= uFar) return uBack;

  vec2 oc = uEye.xz - uFocus;
  float ax = dot(rd.xz, rd.xz);
  float bx = dot(oc, rd.xz);
  float cx = dot(oc, oc) - uReach * uReach;
  float root = bx * bx - ax * cx;

  float lit = uFar;
  float dim = uFar;
  if (root > 0.0 && ax > 1e-9) {
    float sq = sqrt(root);
    lit = max(t, (-bx - sq) / ax);
    dim = min(uFar, (-bx + sq) / ax);
  }

  vec3 hue;
  float root0 = t;
  if (lit > t && ledge(rd, inv, dir, t, min(lit, uFar), hue)) return hue;
  if (dim <= lit) {
    if (ledge(rd, inv, dir, root0, uFar, hue)) return hue;
    return uBack;
  }

  t = lit;
  vec2 cell = floor((uEye.xz + rd.xz * t) / uCell);
  vec2 gate = ((cell + step(0.0, rd.xz)) * uCell - uEye.xz) * inv.xz;
  vec2 pace = uCell * abs(inv.xz);
  float wall = uCell * 0.5 * (1.0 - uGap);

  for (int i = 0; i < STEPS; i++) {
    float leave = min(gate.x, gate.y);
    vec2 mid = cell * uCell + uCell * 0.5;
    float top = lidY(cell);

    vec3 lo = vec3(mid.x - wall, top - 0.7, mid.y - wall);
    vec3 hi = vec3(mid.x + wall, top, mid.y + wall);
    vec3 a = (lo - uEye) * inv;
    vec3 b = (hi - uEye) * inv;
    vec3 lip = min(a, b);
    vec3 out1 = max(a, b);
    float tin = max(max(lip.x, lip.y), lip.z);
    float tout = min(min(out1.x, out1.y), out1.z);

    if (tout >= tin && tout > t && tin < leave && tin < uFar) {
#ifdef ROUND
      float edge = min(min(tout, leave), uFar);
      float walk = max(tin, t);
      vec3 seat = vec3(mid.x, 0.0, mid.y);
      for (int k = 0; k < 24; k++) {
        if (walk > edge) break;
        float gapTo = tile(uEye + rd * walk - seat, wall, top);
        if (gapTo < 0.0003) {
          vec3 n = tileNormal(uEye + rd * walk - seat, wall, top);
          return paint(n, mid, walk);
        }
        walk += max(gapTo, 0.0002);
      }
#else
      float peak = max(max(lip.x, lip.y), lip.z);
      vec3 axis = vec3(0.0, 1.0, 0.0);
      if (peak > lip.y + uCell * 0.03) {
        axis = lip.x >= lip.z ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
      }
      vec3 n = -vec3(dir.x, rd.y >= 0.0 ? 1.0 : -1.0, dir.y) * axis;
      return paint(n, mid, max(tin, t));
#endif
    }

    t = leave;
    if (t >= dim) break;
    float pick = step(gate.x, gate.y);
    cell += dir * vec2(pick, 1.0 - pick);
    gate += pace * vec2(pick, 1.0 - pick);
  }

  if (ledge(rd, inv, dir, root0, uFar, hue)) return hue;
  return uBack;
}

void main() {
  vec2 base = (vUv * uSize * 2.0 - uSize) / min(uSize.x, uSize.y);
  float pix = 2.0 / min(uSize.x, uSize.y);

  vec3 sum = vec3(0.0);
  for (int j = 0; j < AA; j++) {
    for (int i = 0; i < AA; i++) {
      vec2 jitter = (vec2(float(i), float(j)) + 0.5) / float(AA) - 0.5;
      sum += trace(base + jitter * pix);
    }
  }
  sum /= float(AA * AA);

  vec3 shown = max(mix(uBack, sum, uReveal), 0.0);
  vec3 curve = mix(
    shown * 12.92,
    1.055 * pow(shown, vec3(0.4166667)) - 0.055,
    step(vec3(0.0031308), shown)
  );
  gl_FragColor = vec4(clamp(curve, 0.0, 1.0), 1.0);
}
`;

const Field = ({
  samples,
  size,
  eye,
  basis,
  zoom,
  cell,
  gap,
  round,
  amplitude,
  lift,
  liftRadius,
  ceiling,
  near,
  far,
  tones,
  accentMix,
  speed,
  maxFps,
  advance,
}: {
  samples: number;
  size: { w: number; h: number };
  eye: [number, number, number];
  basis: {
    right: [number, number, number];
    up: [number, number, number];
    fwd: [number, number, number];
  };
  zoom: number;
  cell: number;
  gap: number;
  round: number;
  amplitude: number;
  lift: number;
  liftRadius: number;
  ceiling: number;
  near: number;
  far: number;
  tones: {
    top: [number, number, number];
    side: [number, number, number];
    face: [number, number, number];
    accent: [number, number, number];
    back: [number, number, number];
  };
  accentMix: number;
  speed: number;
  maxFps: number;
  advance: (beat: number) => [number, number, number];
}) => {
  const { invalidate } = useThree();
  const skin = useRef<THREE.ShaderMaterial | null>(null);
  const reveal = useRef(0);

  const banks = useMemo(
    () => [
      {
        uSize: { value: new THREE.Vector2(1, 1) },
        uEye: { value: new THREE.Vector3() },
        uRight: { value: new THREE.Vector3() },
        uUp: { value: new THREE.Vector3() },
        uFwd: { value: new THREE.Vector3() },
        uZoom: { value: 3.5 },
        uTime: { value: 0 },
        uFocus: { value: new THREE.Vector2() },
        uCell: { value: 0.04 },
        uGap: { value: 0 },
        uAmp: { value: 0 },
        uLift: { value: 0 },
        uReach: { value: 1 },
        uRound: { value: 0 },
        uRest: { value: 0.12 },
        uSun: { value: new THREE.Vector3(0.57, 0.71, -0.43) },
        uCeil: { value: 1 },
        uNear: { value: 1 },
        uFar: { value: 4 },
        uReveal: { value: 0 },
        uTop: { value: new THREE.Vector3() },
        uSide: { value: new THREE.Vector3() },
        uFace: { value: new THREE.Vector3() },
        uAccent: { value: new THREE.Vector3() },
        uAccentMix: { value: 0 },
        uBack: { value: new THREE.Vector3() },
      },
    ],
    [],
  );

  const shader = useMemo(
    () => buildFragment(clamp(samples, 1, 3), round > 0),
    [samples, round],
  );

  useFrame((_, delta) => {
    const beat = Math.min(delta, 0.05);
    const [clock, fx, fz] = advance(beat);

    reveal.current += (1 - reveal.current) * Math.min(beat * 2.6, 1);

    const bank = skin.current?.uniforms;
    if (!bank) return;
    bank.uSize.value.set(Math.max(size.w, 1), Math.max(size.h, 1));
    bank.uEye.value.set(eye[0], eye[1], eye[2]);
    bank.uRight.value.set(basis.right[0], basis.right[1], basis.right[2]);
    bank.uUp.value.set(basis.up[0], basis.up[1], basis.up[2]);
    bank.uFwd.value.set(basis.fwd[0], basis.fwd[1], basis.fwd[2]);
    bank.uZoom.value = zoom;
    bank.uTime.value = clock * speed;
    bank.uFocus.value.set(fx, fz);
    bank.uCell.value = cell;
    bank.uGap.value = gap;
    bank.uRound.value = round;
    bank.uAmp.value = amplitude;
    bank.uLift.value = lift;
    bank.uReach.value = liftRadius;
    bank.uCeil.value = ceiling;
    bank.uNear.value = near;
    bank.uFar.value = far;
    bank.uReveal.value = reveal.current;
    bank.uTop.value.set(tones.top[0], tones.top[1], tones.top[2]);
    bank.uSide.value.set(tones.side[0], tones.side[1], tones.side[2]);
    bank.uFace.value.set(tones.face[0], tones.face[1], tones.face[2]);
    bank.uAccent.value.set(tones.accent[0], tones.accent[1], tones.accent[2]);
    bank.uAccentMix.value = accentMix;
    bank.uBack.value.set(tones.back[0], tones.back[1], tones.back[2]);
  });

  useEffect(() => {
    const gap2 = 1000 / Math.max(1, maxFps);
    const slack = Math.min(4, gap2 * 0.5);
    let frame = 0;
    let prev = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - prev < gap2 - slack) return;
      prev = now;
      invalidate();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, maxFps]);

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        key={shader}
        ref={skin}
        vertexShader={surfaceVertex}
        fragmentShader={shader}
        uniforms={banks[0]}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export const GridRise = ({
  color = "#0a0a0a",
  accent = "#de7dfa",
  background = "#0a0a0a",
  relief = 0,
  accentStrength = 0.85,
  cellSize = 0.06,
  gap = 0,
  rounding = 0.1,
  amplitude = 0.05,
  lift = 0.06,
  liftRadius = 0.6,
  speed = 0.6,
  zoom = 4,
  orbit = 45,
  distance = 1.5,
  altitude = 1,
  haze = 1,
  samples = 2,
  dpr = 1,
  maxFps = 60,
  drift = 0.28,
  ease = 0.1,
  interactive = true,
  paused = false,
  className,
  style,
  children,
}: GridRiseProps) => {
  const shell = useRef<HTMLDivElement | null>(null);
  const clock = useRef(0);
  const aim = useRef({ x: 0, z: 0, live: false });
  const spot = useRef({ x: 0, z: 0 });
  const frame = useRef({ left: 0, top: 0, width: 1, height: 1 });
  const calm = useRef(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [awake, setAwake] = useState(false);

  const eye = useMemo<[number, number, number]>(() => {
    const swing = (orbit * Math.PI) / 180;
    const reachOut = Math.max(0.2, distance);
    return [
      Math.sin(swing) * reachOut,
      Math.max(0.15, altitude),
      Math.cos(swing) * reachOut,
    ];
  }, [orbit, distance, altitude]);

  const basis = useMemo(() => {
    const fx = 0 - eye[0];
    const fy = 0.2 - eye[1];
    const fz = 0 - eye[2];
    const flen = Math.hypot(fx, fy, fz) || 1;
    const fwd: [number, number, number] = [fx / flen, fy / flen, fz / flen];

    const rlen = Math.hypot(-fwd[2], 0, fwd[0]) || 1;
    const right: [number, number, number] = [-fwd[2] / rlen, 0, fwd[0] / rlen];

    const ux = right[1] * fwd[2] - right[2] * fwd[1];
    const uy = right[2] * fwd[0] - right[0] * fwd[2];
    const uz = right[0] * fwd[1] - right[1] * fwd[0];
    const ulen = Math.hypot(ux, uy, uz) || 1;
    const up: [number, number, number] = [ux / ulen, uy / ulen, uz / ulen];

    return { right, up, fwd };
  }, [eye]);

  const tones = useMemo(() => {
    const top = toLinear(color);
    const back = toLinear(background);
    const accentLin = toLinear(accent);
    const grade = clamp(relief, 0, 1);
    const glow = 0.2126 * back[0] + 0.7152 * back[1] + 0.0722 * back[2] < 0.16;
    const shade = (k: number): [number, number, number] =>
      [0, 1, 2].map((i) =>
        glow
          ? top[i] + (1 - top[i]) * grade * k * 0.075
          : Math.max(0, top[i] * (1 - grade * k * 0.64)),
      ) as [number, number, number];
    return {
      top,
      side: shade(1),
      face: shade(glow ? 0.52 : 1.56),
      accent: accentLin,
      back,
    };
  }, [color, accent, background, relief]);

  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    if (typeof ResizeObserver !== "undefined") {
      const watcher = new ResizeObserver(([entry]) => {
        frame.current = node.getBoundingClientRect();
        setBox({
          w: Math.round(entry.contentRect.width),
          h: Math.round(entry.contentRect.height),
        });
      });
      watcher.observe(node);
      return () => watcher.disconnect();
    }
    setBox({ w: node.clientWidth, h: node.clientHeight });
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setAwake(true));
      return () => cancelAnimationFrame(id);
    }
    const spy = new IntersectionObserver(
      ([entry]) => setAwake(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    spy.observe(node);
    return () => spy.disconnect();
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    const remeasure = () => {
      frame.current = node.getBoundingClientRect();
    };
    remeasure();
    window.addEventListener("scroll", remeasure, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", remeasure, { passive: true });
    return () => {
      window.removeEventListener("scroll", remeasure, { capture: true });
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      calm.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const ground = useCallback(
    (nx: number, ny: number): [number, number] => {
      const rx = basis.right[0] * nx + basis.up[0] * ny + basis.fwd[0] * zoom;
      const ry = basis.right[1] * nx + basis.up[1] * ny + basis.fwd[1] * zoom;
      const rz = basis.right[2] * nx + basis.up[2] * ny + basis.fwd[2] * zoom;
      const len = Math.hypot(rx, ry, rz) || 1;
      const dy = Math.min(ry / len, -1e-3);
      const hit = (0.14 - eye[1]) / dy;
      const reachOut = clamp(hit, 0, 40);
      return [eye[0] + (rx / len) * reachOut, eye[2] + (rz / len) * reachOut];
    },
    [basis, zoom, eye],
  );

  useEffect(() => {
    const node = shell.current;
    if (!node || !interactive) return;

    const track = (event: PointerEvent) => {
      const rect = frame.current;
      const short = Math.max(Math.min(rect.width, rect.height), 1);
      const nx = ((event.clientX - rect.left) * 2 - rect.width) / short;
      const ny = (rect.height - (event.clientY - rect.top) * 2) / short;
      const [gx, gz] = ground(nx, ny);
      aim.current.x = gx;
      aim.current.z = gz;
      aim.current.live = true;
    };

    const drop = () => {
      aim.current.live = false;
    };

    node.addEventListener("pointermove", track);
    node.addEventListener("pointerleave", drop);
    node.addEventListener("pointercancel", drop);
    return () => {
      node.removeEventListener("pointermove", track);
      node.removeEventListener("pointerleave", drop);
      node.removeEventListener("pointercancel", drop);
    };
  }, [interactive, ground]);

  const advance = useCallback(
    (beat: number): [number, number, number] => {
      const still = paused || calm.current;
      if (!still) clock.current += beat;

      const target = aim.current;
      const now = spot.current;
      if (!target.live) {
        const spin = clock.current * 0.55;
        target.x = Math.sin(spin * 1.3) * drift;
        target.z = Math.cos(spin * 1.7) * drift;
      }

      const grip = 1 - Math.pow(1 - clamp(ease, 0.01, 1), beat * 60);
      now.x += (target.x - now.x) * grip;
      now.z += (target.z - now.z) * grip;

      return [clock.current, now.x, now.z];
    },
    [paused, drift, ease],
  );

  const grain = useMemo(() => {
    const cell = Math.max(0.008, cellSize);
    const wall = cell * 0.5 * (1 - clamp(gap, 0, 0.6));
    return clamp(rounding, 0, 1) * Math.min(wall, 0.34) * 0.98;
  }, [cellSize, gap, rounding]);

  const depth = useMemo(() => {
    const eyeSpan = Math.hypot(eye[0], eye[1], eye[2]);
    const far = eyeSpan * 3.4;
    const open = eyeSpan * 0.5;
    const start = open + (far - open) * (1 - clamp(haze, 0, 1));
    return {
      far,
      near: Math.min(start, far * 0.8),
      ceiling: 0.13 + Math.max(0, lift) + Math.max(0, amplitude),
    };
  }, [eye, haze, lift, amplitude]);

  return (
    <div
      ref={shell}
      className={cn("relative overflow-hidden", className)}
      style={style}
    >
      <div className="absolute inset-0">
        {awake && box.w > 0 ? (
          <Canvas
            orthographic
            camera={{ position: [0, 0, 1], zoom: 1 }}
            dpr={clamp(dpr, 0.75, 2)}
            gl={{
              antialias: false,
              alpha: false,
              depth: false,
              stencil: false,
              powerPreference: "high-performance",
            }}
            frameloop="demand"
          >
            <Field
              samples={Math.round(clamp(samples, 1, 3))}
              size={box}
              eye={eye}
              basis={basis}
              zoom={Math.max(0.5, zoom)}
              cell={Math.max(0.008, cellSize)}
              gap={clamp(gap, 0, 0.6)}
              round={grain}
              amplitude={amplitude}
              lift={lift}
              liftRadius={Math.max(0.02, liftRadius)}
              ceiling={depth.ceiling}
              near={depth.near}
              far={depth.far}
              tones={tones}
              accentMix={clamp(accentStrength, 0, 1)}
              speed={speed}
              maxFps={maxFps}
              advance={advance}
            />
          </Canvas>
        ) : null}
      </div>
      {children ? (
        <div className="pointer-events-none relative z-10 h-full w-full">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default GridRise;
