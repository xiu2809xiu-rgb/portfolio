'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ParticleText = dynamic(() => import('@/components/react-bits/particle-text'), {
  ssr: false,
  loading: () => null,
});

interface BrandParticleTextProps {
  text: string;
  /** Fallback rendered for touch, reduced motion, or before hydration. */
  fallback: React.ReactNode;
  className?: string;
  particleSize?: number;
  particleGap?: number;
  /** Cursor repulsion radius in CSS pixels. */
  radius?: number;
  strength?: number;
}

/**
 * Brand-styled wrapper around React Bits' ParticleText.
 *
 * Exists because using that component correctly takes three non-obvious fixes,
 * and they should live in one place rather than being rediscovered per instance:
 *
 *   1. Canvas `ctx.font` cannot resolve CSS custom properties, so passing
 *      `var(--font-outfit)` produces an invalid font string and the text
 *      silently fails to rasterise. The real family name is read off the
 *      document at runtime.
 *   2. The component's own wrapper carries `min-h-[300px]`, which pushes the
 *      canvas past its container and draws the word off-screen.
 *   3. Its `ease`/`friction` are a damped spring — stiffening one without
 *      damping the other makes particles orbit their origins forever.
 *
 * Skipped for coarse pointers and reduced motion: the whole point is that the
 * letters scatter away from the cursor, and a canvas repainting every frame is
 * wasted on visitors who will never see that.
 */
export function BrandParticleText({
  text,
  fallback,
  className,
  particleSize = 2,
  particleGap = 2,
  radius = 110,
  strength = 3.2,
}: BrandParticleTextProps) {
  const [enabled, setEnabled] = useState(false);
  const [fontFamily, setFontFamily] = useState('ui-sans-serif, system-ui, sans-serif');

  useEffect(() => {
    const pointer = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => setEnabled(pointer.matches && !motion.matches);
    sync();

    for (const query of [pointer, motion]) query.addEventListener('change', sync);
    return () => {
      for (const query of [pointer, motion]) query.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    // Deferred a frame: next/font swaps the variable in once its stylesheet
    // applies, so an inline read can catch the pre-swap value.
    const frame = requestAnimationFrame(() => {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-outfit')
        .trim();
      if (resolved) setFontFamily(`${resolved}, ui-sans-serif, sans-serif`);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!enabled) return <>{fallback}</>;

  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      <ParticleText
        text={text}
        // Weighted toward lime so the word reads as one colour, not confetti.
        colors={['#b4ff39', '#b4ff39', '#b4ff39', '#39ffd8', '#e9ecef']}
        particleSize={particleSize}
        particleGap={particleGap}
        fontFamily={fontFamily}
        fontWeight={800}
        backgroundColor="transparent"
        mouseControls={{ enabled: true, radius, strength }}
        /*
          Damped spring: `v = (v + ease * distanceToOrigin) * friction`.

          While underdamped the per-frame decay is sqrt(friction), so `friction`
          alone sets how fast the word resolves — raising `ease` only makes it
          orbit harder. The component's 0.75 needs roughly six seconds to read as
          type; 0.55 gets there in well under one, which matters because the
          reboot sequence it appears in runs for about three.
        */
        friction={0.55}
        ease={0.13}
        autoFit
        className="size-full min-h-0!"
      />
    </div>
  );
}
