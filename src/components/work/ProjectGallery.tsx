'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Screenshot } from '@/content/types';

interface ProjectGalleryProps {
  screenshots: readonly Screenshot[];
}

/**
 * Browser-chrome gallery with a keyboard-navigable lightbox.
 *
 * Written by hand rather than reaching for a carousel component: these are UI
 * screenshots that need to be read, so a fake address bar and a legible active
 * frame beat a 3D effect that distorts them.
 */
export function ProjectGallery({ screenshots }: ProjectGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const current = screenshots[active];

  const step = useCallback(
    (delta: number) => setActive((index) => (index + delta + screenshots.length) % screenshots.length),
    [screenshots.length],
  );

  useEffect(() => {
    if (!lightbox) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, step]);

  return (
    <>
      <figure className="overflow-hidden rounded-2xl border border-hairline bg-[#0b0e13]">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-3 truncate rounded-md bg-white/[0.05] px-3 py-1 font-mono text-[0.65rem] text-muted-foreground">
            {current.url}
          </span>
        </div>

      {/* The source screenshots are 1909x915 (~2.09:1). Matching that exactly
          means the whole UI is visible — a 16:10 frame with object-cover was
          silently cropping about a quarter of the width off the sides, which on
          a walkthrough hides the very thing being described. */}
        <div className="group relative aspect-[1909/915] bg-black">
          <Image
            key={current.src}
            src={current.src}
            alt={current.title}
            fill
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-contain"
            priority
          />
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-black/70 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-widest opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Expand className="size-3" />
            Expand
          </button>
        </div>

        <figcaption className="sr-only">{current.title}</figcaption>
      </figure>

      <div
        className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6"
        role="tablist"
        aria-label="Screenshots"
      >
        {screenshots.map((shot, index) => (
          <button
            key={shot.src}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={cn(
              'group overflow-hidden rounded-lg border transition-all',
              index === active
                ? 'border-lime/60 ring-1 ring-lime/30'
                : 'border-hairline opacity-60 hover:opacity-100',
            )}
          >
            <span className="relative block aspect-[16/10] bg-black">
              <Image
                src={shot.src}
                alt=""
                fill
                sizes="120px"
                className="object-cover object-top"
              />
            </span>
            <span className="block truncate px-1.5 py-1 text-[0.58rem] text-muted-foreground">
              {shot.title}
            </span>
          </button>
        ))}
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightbox(false);
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-hairline transition-colors hover:border-lime/40"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-3 grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-lime/40 sm:left-8"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="relative max-h-[80vh] w-full max-w-6xl">
            <Image
              src={current.src}
              alt={current.title}
              width={1920}
              height={1200}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-3 grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-lime/40 sm:right-8"
            aria-label="Next screenshot"
          >
            <ChevronRight className="size-5" />
          </button>

          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {current.title} · {active + 1}/{screenshots.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
