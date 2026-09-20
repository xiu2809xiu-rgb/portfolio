'use client';

import { useEffect, useRef } from 'react';
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, VignetteTechnique } from 'postprocessing';
import type { EffectComposer as EffectComposerImpl } from 'postprocessing';
import * as THREE from 'three';

/**
 * The post chain.
 *
 * SMAA is deliberately part of the final image rather than relying on browser
 * framebuffer MSAA. The composer renders into an off-screen target, so browser
 * antialiasing cannot touch the silhouettes produced here. A final SMAA pass
 * catches foliage, railings, roof lines, and other sub-pixel geometry without
 * multiplying the memory cost of the half-float render target.
 *
 * Tone mapping has to live here as well. Once a composer is mounted, three
 * renders the scene into that off-screen target and skips renderer tone mapping.
 * Neutral keeps the saturated brand colours intact while still rolling bright
 * highlights off naturally.
 */
export function Post({ shot = false }: { shot?: boolean }) {
  const composerRef = useRef<EffectComposerImpl>(null);

  /* The visual harness must render through the same chain visitors see. */
  useEffect(() => {
    if (!shot) return;
    const w = window as unknown as { __three?: { composer?: EffectComposerImpl } };
    if (w.__three) w.__three.composer = composerRef.current ?? undefined;
  }, [shot]);

  return (
    <EffectComposer
      ref={composerRef}
      multisampling={0}
      frameBufferType={THREE.HalfFloatType}
      enableNormalPass={false}
    >
      {/* Only authored HDR light sources should bloom. The higher threshold and
          restrained intensity prevent sunlit paint—especially the lime bonnet—
          from turning into a coloured veil over the frame. */}
      <Bloom
        luminanceThreshold={1.15}
        luminanceSmoothing={0.22}
        mipmapBlur
        levels={5}
        radius={0.58}
        intensity={0.58}
        blendFunction={BlendFunction.SCREEN}
      />

      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
      <Vignette technique={VignetteTechnique.DEFAULT} offset={0.38} darkness={0.48} />
    </EffectComposer>
  );
}
