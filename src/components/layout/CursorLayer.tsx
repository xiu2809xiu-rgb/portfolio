'use client';

import { useEffect, useState } from 'react';
import SmoothCursor from '@/components/react-bits/smooth-cursor';

/**
 * React Bits smooth cursor, mounted only where it makes sense.
 *
 * Gated on a fine pointer *and* no reduced-motion preference: on touch devices
 * the trail is meaningless, and for anyone who asked for less motion a springy
 * cursor is exactly the kind of thing they asked to be spared. Rendering nothing
 * — rather than hiding with CSS — also keeps its rAF loop off their main thread.
 */
export function CursorLayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => setEnabled(pointer.matches && !motion.matches);
    sync();

    pointer.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    return () => {
      pointer.removeEventListener('change', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  if (!enabled) return null;

  return (
    <SmoothCursor
      color="#b4ff39"
      pointsCount={16}
      lineWidth={1}
      springStrength={0.28}
      dampening={0.76}
      trailOpacity={0.38}
      blur={0}
      // velocityScale thickens the trail with speed, which turns a fast flick
      // across the page into a band wide enough to obscure what is under it.
      velocityScale={false}
    />
  );
}
