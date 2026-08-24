'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Rapier ships a WebAssembly physics engine, so this is the heaviest component on
 * the site by a wide margin. It loads only on the client, and only once the
 * badge is actually near the viewport.
 */
const Lanyard = dynamic(() => import('@/components/react-bits/lanyard'), { ssr: false });

const FRONT = '/img/lanyard/badge-front.png';
const BACK = '/img/lanyard/badge-back.png';

/**
 * Draggable ID badge on a lanyard.
 *
 * Only rendered for fine-pointer devices that have not asked for reduced motion.
 * On touch, dragging a physics object competes with scrolling — and the WASM
 * download is a real cost on mobile data — so those visitors get the same badge
 * as a still image instead. Same content either way, no dead space.
 */
export function LanyardBadge({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [interactive, setInteractive] = useState(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 768px)');

    const sync = () => setInteractive(pointer.matches && wide.matches && !motion.matches);
    sync();

    for (const query of [pointer, motion, wide]) query.addEventListener('change', sync);
    return () => {
      for (const query of [pointer, motion, wide]) query.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => setNear(entries[0]?.isIntersecting ?? false),
      { rootMargin: '300px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn('relative h-[30rem] w-full sm:h-[34rem] lg:h-[38rem]', className)}
    >
      {interactive ? (
        near ? (
          <>
            <Lanyard
              position={[0, 0, 13]}
              gravity={[0, -40, 0]}
              fov={20}
              transparent
              frontImage={FRONT}
              backImage={BACK}
              imageFit="cover"
            />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted-foreground">
              Drag the badge
            </p>
          </>
        ) : (
          <div className="grid size-full place-items-center">
            <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-lime" />
          </div>
        )
      ) : (
        <div className="grid size-full place-items-center">
          <Image
            src={FRONT}
            alt="Richie Koh — Software Developer, Nanyang Polytechnic"
            width={660}
            height={1000}
            className="h-full w-auto rounded-2xl border border-hairline object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
