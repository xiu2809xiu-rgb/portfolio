'use client';

import { useEffect, useRef } from 'react';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, VignetteTechnique } from 'postprocessing';
import type { EffectComposer as EffectComposerImpl } from 'postprocessing';
import * as THREE from 'three';

/**
 * The post chain.
 *
 * Three passes, and the restraint is the point — each one earns its frame time
 * and none of them blurs anything the player is trying to read.
 *
 * Tone mapping has to live HERE rather than on the renderer. Once a composer is
 * mounted, three renders the scene into an offscreen target, and it deliberately
 * skips tone mapping when the destination is a render target — so `gl.toneMapping`
 * silently stops applying and everything comes out in raw linear values. The
 * composer's own pass is what puts the curve back, at the end, where it belongs.
 *
 * The curve is NEUTRAL, not ACES. That is the single most valuable line in this
 * file: ACES desaturates hard as it approaches white, and this site's two brand
 * colours are exactly the saturated near-primaries it punishes most. Measured
 * through three's own GLSL, ACES turns #39ffd8 into #9ee3d5 — and, on the lit
 * signage at four times emissive gain, into #e8faf6, which is white. Khronos PBR
 * Neutral leaves in-gamut mid-luminance colour alone and holds the same aqua at
 * #29f0cb. The world stops looking like a photograph of the world and starts
 * looking like the site.
 */
export function Post({ shot = false }: { shot?: boolean }) {
  const composerRef = useRef<EffectComposerImpl>(null);

  /*
    Once a composer is mounted it, not the renderer, owns the frame — so a
    screenshot harness calling gl.render() draws nothing. Publishing it under
    ?shot lets the harness drive the real chain instead of a parallel one that
    would not show bloom or the tone curve.
  */
  useEffect(() => {
    if (!shot) return;
    const w = window as unknown as { __three?: { composer?: EffectComposerImpl } };
    if (w.__three) w.__three.composer = composerRef.current ?? undefined;
  }, [shot]);

  return (
    <EffectComposer
      ref={composerRef}
      /*
        Zero, not the default 8. Eight samples on a half-float target at this
        canvas size asks the driver for a few hundred megabytes of VRAM for
        edge quality that bloom and the tone curve largely hide anyway. SMAA
        would be the principled alternative and it costs ~58KB gzipped, which is
        more than the entire rest of this chain — not worth it for a page that
        is already a detour.
      */
      multisampling={0}
      frameBufferType={THREE.HalfFloatType}
      enableNormalPass={false}
    >
      {/*
        One fixed threshold above 1.0. Only things that are genuinely brighter
        than white bloom: the sun disc, the lit signage after dark, the
        headlights. The day/night cycle already ramps emissive intensity, so the
        same threshold gives a faint sheen at noon and a real glow at midnight
        without anything being animated here.
      */}
      <Bloom
        luminanceThreshold={1.0}
        luminanceSmoothing={0.3}
        mipmapBlur
        levels={6}
        radius={0.7}
        intensity={0.9}
        /* The r3f wrapper defaults this to ADD, which clips; SCREEN is what
           BloomEffect itself uses and it keeps highlights from going chalky. */
        blendFunction={BlendFunction.SCREEN}
      />

      <ToneMapping mode={ToneMappingMode.NEUTRAL} />

      {/* Costs almost nothing and does most of the work of making a game frame
          feel photographed rather than rendered. */}
      <Vignette technique={VignetteTechnique.DEFAULT} offset={0.32} darkness={0.68} />
    </EffectComposer>
  );
}
