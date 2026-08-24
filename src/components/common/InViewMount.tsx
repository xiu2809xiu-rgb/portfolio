'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InViewMountProps {
  children: ReactNode;
  /** How far outside the viewport to start mounting. */
  rootMargin?: string;
  /** Keep the subtree mounted after it first appears. */
  once?: boolean;
  className?: string;
}

/**
 * Mounts its children only while they are near the viewport.
 *
 * Used to gate WebGL backgrounds. Browsers cap the number of simultaneous WebGL
 * contexts — and mobile GPUs cap it low — so a page with several canvases can
 * silently lose one, leaving a blank rectangle where a background should be.
 * Unmounting off-screen canvases keeps the live count down and stops their
 * render loops burning battery on content nobody is looking at.
 */
export function InViewMount({
  children,
  rootMargin = '150px',
  once = false,
  className,
}: InViewMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        setInView(visible);
        if (visible && once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return (
    <div ref={ref} className={cn('size-full', className)}>
      {inView ? children : null}
    </div>
  );
}
