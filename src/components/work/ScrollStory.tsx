'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Screenshot } from '@/content/types';

export interface StoryBeat {
  /** Index into `screenshots` that this beat talks about. */
  readonly shot: number;
  readonly label: string;
  readonly heading: string;
  readonly body: string;
}

interface ScrollStoryProps {
  screenshots: readonly Screenshot[];
  beats: readonly StoryBeat[];
}

/**
 * Scroll-driven walkthrough: the screenshot pins while the narrative advances.
 *
 * This is the pattern award juries consistently reward — motion that paces a
 * story rather than decorating one. The mechanic is deliberately simple: each
 * text beat is a tall block with an IntersectionObserver, and whichever beat
 * owns the middle of the viewport decides which screenshot the sticky panel
 * shows. No scroll listener, no scroll-jacking, no library.
 *
 * On small screens and for reduced-motion visitors it degrades to a plain
 * stacked list of screenshot-then-text, which reads perfectly well — the
 * "weak static frame" failure mode is a real one, so the un-animated version is
 * the version this was designed around.
 */
export function ScrollStory({ screenshots, beats }: ScrollStoryProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduced) return;

    const nodes = beatRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the middle of the viewport, so a beat only
        // takes over once it genuinely owns the reader's attention.
        const middle = window.innerHeight / 2;
        let best: { index: number; distance: number } | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = nodes.indexOf(entry.target as HTMLDivElement);
          if (index < 0) continue;
          const rect = entry.boundingClientRect;
          const distance = Math.abs(rect.top + rect.height / 2 - middle);
          if (!best || distance < best.distance) best = { index, distance };
        }

        if (best) setActive(best.index);
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0, 0.5, 1] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const activeShot = screenshots[beats[active]?.shot ?? 0] ?? screenshots[0];

  // ── Reduced motion / no-JS friendly fallback ────────────────────────────
  if (reduced) {
    return (
      <div className="space-y-14">
        {beats.map((beat) => {
          const shot = screenshots[beat.shot] ?? screenshots[0];
          return (
            <div key={beat.heading} className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
              <BrowserFrame shot={shot} />
              <div>
                <p className="eyebrow">{beat.label}</p>
                <h3 className="mt-3 font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  {beat.heading}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{beat.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      {/* Narrative column — each beat is a tall block that claims the panel. */}
      <div className="order-2 lg:order-1">
        {beats.map((beat, index) => (
          <div
            key={beat.heading}
            ref={(node) => {
              beatRefs.current[index] = node;
            }}
            className="flex min-h-[60svh] flex-col justify-center py-10 lg:min-h-[70svh]"
          >
            <motion.div
              animate={{
                opacity: active === index ? 1 : 0.32,
                filter: active === index ? 'blur(0px)' : 'blur(1.5px)',
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-px w-8 transition-colors duration-500',
                    active === index ? 'bg-lime' : 'bg-hairline',
                  )}
                />
                <p className="eyebrow">{beat.label}</p>
              </div>

              <h3 className="mt-4 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                {beat.heading}
              </h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                {beat.body}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Sticky visual — swaps as the narrative advances. */}
      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-28">
          <BrowserFrame shot={activeShot} animated />

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex gap-1.5" aria-hidden>
              {beats.map((beat, index) => (
                <span
                  key={beat.heading}
                  className={cn(
                    'h-0.5 rounded-full transition-all duration-500',
                    active === index ? 'w-8 bg-lime' : 'w-4 bg-white/15',
                  )}
                />
              ))}
            </div>
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
              {String(active + 1).padStart(2, '0')} / {String(beats.length).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({ shot, animated = false }: { shot: Screenshot; animated?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-hairline bg-[#0b0e13]">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f56]" />
        <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="size-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-3 truncate rounded-md bg-white/[0.05] px-3 py-1 font-mono text-[0.65rem] text-muted-foreground">
          {shot.url}
        </span>
      </div>

      {/* The source screenshots are 1909x915 (~2.09:1). Matching that exactly
          means the whole UI is visible — a 16:10 frame with object-cover was
          silently cropping about a quarter of the width off the sides, which on
          a walkthrough hides the very thing being described. */}
      <div className="relative aspect-[1909/915] bg-black">
        {animated ? (
          <motion.div
            key={shot.src}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={shot.src}
              alt={shot.title}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain"
            />
          </motion.div>
        ) : (
          <Image
            src={shot.src}
            alt={shot.title}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain"
          />
        )}
      </div>

      <figcaption className="border-t border-hairline px-4 py-2.5 font-mono text-[0.65rem] text-muted-foreground">
        {shot.title}
      </figcaption>
    </figure>
  );
}
