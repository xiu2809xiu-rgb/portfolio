'use client';

import { useSyncExternalStore } from 'react';
import * as THREE from 'three';

/**
 * Graphics tiers.
 *
 * This exists because a WebGL context can be lost, and when it is, the canvas
 * goes blank and does not come back — the browser only attempts a restore if the
 * driver has resources to give, and a driver that just ran out generally does
 * not. There is no clever way to render your way out of that. The only honest
 * answers are to ask for less, and to notice it happened.
 *
 * So: three tiers, a conservative default, and an automatic step down when a
 * context is lost. A visitor never has to know what a shadow map is; they either
 * never hit the problem, or they are dropped a tier and told in one sentence.
 *
 * Note what "safe" does NOT give up. The post chain is dropped, so bloom goes —
 * but the tone curve moves back onto the renderer, so the colour is unchanged.
 * Losing bloom costs a little glow at night. Losing Neutral tone mapping would
 * wash the whole palette out, which is a far worse trade.
 */

export type QualityId = 'high' | 'balanced' | 'safe';

export interface Quality {
  readonly id: QualityId;
  readonly name: string;
  readonly blurb: string;
  /** Upper bound on device pixel ratio. */
  readonly dpr: number;
  /** Post-processing chain. When false the renderer tone maps instead. */
  readonly post: boolean;
  readonly shadows: boolean;
  readonly shadowMapSize: number;
  /** VSM is the only type in three 0.185 that gives soft edges; it costs more. */
  readonly shadowType: THREE.ShadowMapType;
  readonly shadowBlurSamples: number;
  readonly shadowRadius: number;
  readonly trees: number;
  /** Street lamps that carry a real point light; the rest stay emissive only. */
  readonly lampLights: number;
  /**
   * Only the top tier asks for the discrete GPU.
   *
   * On a laptop with switchable graphics, 'high-performance' makes the browser
   * request the discrete chip — and switching GPUs mid-session is a documented
   * way to lose a WebGL context outright. Asking for it is worth the risk when
   * someone has deliberately chosen the highest setting; it is not worth it by
   * default, which is what this page was doing.
   */
  readonly power: WebGLPowerPreference;
}

export const QUALITIES: readonly Quality[] = [
  {
    id: 'high',
    name: 'High',
    blurb: 'Soft shadows, bloom, full resolution. Wants a discrete GPU.',
    dpr: 1.75,
    post: true,
    shadows: true,
    shadowMapSize: 2048,
    shadowType: THREE.VSMShadowMap,
    shadowBlurSamples: 12,
    shadowRadius: 4,
    trees: 620,
    lampLights: 18,
    power: 'high-performance',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    blurb: 'Soft shadows at half the resolution. The default.',
    dpr: 1.35,
    post: true,
    shadows: true,
    shadowMapSize: 1024,
    shadowType: THREE.VSMShadowMap,
    shadowBlurSamples: 6,
    shadowRadius: 3,
    trees: 480,
    lampLights: 8,
    power: 'default',
  },
  {
    id: 'safe',
    name: 'Safe',
    blurb: 'No post-processing, hard shadows. For laptops and older GPUs.',
    dpr: 1,
    post: false,
    shadows: true,
    shadowMapSize: 1024,
    shadowType: THREE.PCFShadowMap,
    shadowBlurSamples: 1,
    shadowRadius: 0,
    trees: 320,
    lampLights: 4,
    power: 'low-power',
  },
];

export const DEFAULT_QUALITY: QualityId = 'balanced';

export function qualityById(id: QualityId | null | undefined): Quality {
  return QUALITIES.find((q) => q.id === id) ?? QUALITIES[1];
}

/** The next tier down, or null if already at the bottom. */
export function stepDown(id: QualityId): QualityId | null {
  const index = QUALITIES.findIndex((q) => q.id === id);
  const next = QUALITIES[index + 1];
  return next ? next.id : null;
}

const STORAGE_KEY = 'drive:quality';

/**
 * Remembers a tier across visits.
 *
 * Worth persisting specifically because of the failure this guards against:
 * someone whose GPU cannot hold the high tier should not have to rediscover
 * that every time they open the page. Wrapped because storage throws outright in
 * some privacy modes rather than merely returning nothing.
 */
export function loadQuality(): QualityId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && QUALITIES.some((q) => q.id === stored)) return stored as QualityId;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_QUALITY;
}

function saveQuality(id: QualityId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

/* ── The store ───────────────────────────────────────────────────────────
   A tiny external store rather than state seeded from localStorage in an
   effect. Reading storage during render would disagree with what the server
   rendered and throw hydration away; reading it in an effect and calling
   setState is the pattern the React Compiler rejects outright. This is the same
   shape `useStillness` already uses elsewhere in the site for the same reason:
   `getServerSnapshot` and the hydrating render agree, and the real value
   arrives in the same commit. */

let current: QualityId | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): QualityId {
  /* Cached, because useSyncExternalStore requires the same value for the same
     state — re-reading storage on every call would be a new string each time. */
  if (current === null) current = loadQuality();
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setQuality(id: QualityId): void {
  current = id;
  saveQuality(id);
  for (const listener of listeners) listener();
}

export function useQuality(): QualityId {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_QUALITY);
}
