'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ParticleText = dynamic(() => import('@/components/react-bits/particle-text'), {
  ssr: false,
  loading: () => <div className="h-[132px] w-full" />,
});

/**
 * Particle wordmark sitting under the avatar.
 *
 * Tuned to the site rather than left on the component's defaults: its stock
 * palette is a four-way pink/blue/purple gradient that fights everything else on
 * the page, so the colours are the brand ramp and the particles are small and
 * tight enough that the word reads as type first and an effect second.
 *
 * Skipped for coarse pointers and reduced motion — the whole point is that the
 * letters scatter away from the cursor, which touch cannot do, and the canvas
 * repaints every frame for an effect those visitors would never see.
 */
export function AvatarParticleName({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  /**
   * The resolved font family, read off the document.
   *
   * The component builds a `ctx.font` string for canvas, and canvas cannot
   * resolve CSS custom properties — passing `var(--font-outfit)` produced an
   * invalid font string and the text silently failed to rasterise. next/font
   * generates a hashed family name, so the only way to get it is to read the
   * variable's computed value at runtime.
   */
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
    /*
      Deferred a frame rather than read inline: next/font swaps the variable in
      once its stylesheet applies, so reading during the effect's own pass can
      catch the pre-swap value — and it keeps the state write out of the
      synchronous effect body.
    */
    const frame = requestAnimationFrame(() => {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-outfit')
        .trim();
      if (resolved) setFontFamily(`${resolved}, ui-sans-serif, sans-serif`);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!enabled) {
    return (
      <p
        className={cn(
          'text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl',
          className,
        )}
      >
        Koh Shan Shun<span className="text-lime">.</span>
      </p>
    );
  }

  return (
    <div
      // The canvas sizes itself from this container, so it needs a real height.
      className={cn('h-[132px] w-full', className)}
      // Decorative: the same name is already in the page heading and metadata.
      aria-hidden="true"
    >
      <ParticleText
        text="richie koh"
        // Brand ramp, weighted toward lime so it reads as one colour at a glance.
        /*
          Weighted toward lime so the word reads as one colour rather than
          confetti; a little aqua and white keep it from looking flat.
        */
        colors={['#b4ff39', '#b4ff39', '#b4ff39', '#39ffd8', '#e9ecef']}
        /*
          `particleGap` is the sampling stride over the rasterised glyphs — at 3
          the letters were too sparse to read. 2 roughly doubles the particle
          count, which is still trivial at this canvas size.
        */
        particleSize={2}
        particleGap={2}
        fontFamily={fontFamily}
        fontWeight={800}
        backgroundColor="transparent"
        mouseControls={{ enabled: true, radius: 110, strength: 3.2 }}
        /*
          These two are a damped spring: `v = (v + ease * distanceToOrigin) * friction`.
          Stiffening ease to 0.16 while loosening friction to 0.86 made it
          underdamped — the particles orbited their origins forever and the word
          never resolved. Staying near the component's own 0.05 / 0.75 keeps it
          critically damped, so the letters settle and hold.
        */
        friction={0.76}
        ease={0.06}
        autoFit
        /*
          The component's own wrapper carries `min-h-[300px]`, which would push
          the canvas well past this container and leave the word drawn off-screen
          in the middle of it. `min-h-0!` overrides that so the canvas matches the
          box it is given.
        */
        className="size-full min-h-0!"
      />
    </div>
  );
}
