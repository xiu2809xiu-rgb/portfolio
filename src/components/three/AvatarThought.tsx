'use client';

import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import { AnimatePresence, motion } from 'motion/react';
import type * as THREE from 'three';
import { avatarThoughts } from '@/content/profile';

interface AvatarThoughtProps {
  /** The rig's head bone. The bubble is parented to it. */
  head: THREE.Object3D | null;
  intervalMs?: number;
}

/**
 * Speech bubble anchored to the avatar's head.
 *
 * Parented into the head bone with R3F's `createPortal` rather than tracked by
 * copying world positions each frame. The bone already carries the animated
 * transform, so the bubble inherits it for free — it stays glued through a wave
 * or a dance instead of lagging a frame behind, and there is no per-frame
 * matrix maths.
 *
 * The tail is a rotated square on the bubble's bottom edge, so it reads as
 * pointing down at the head rather than floating beside it. `distanceFactor`
 * keeps the whole thing scaling with the model, so it never balloons when the
 * canvas is small.
 */
export function AvatarThought({ head, intervalMs = 4200 }: AvatarThoughtProps) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  // Let the model settle before the first bubble appears.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % avatarThoughts.length),
      intervalMs,
    );
    return () => clearInterval(timer);
  }, [ready, intervalMs]);

  if (!head) return null;

  return createPortal(
    <Html
      /*
        Anchored exactly on the head bone, then lifted in screen space by the
        wrapper below. Offsetting in the bone's local space instead put the
        bubble wherever that joint's axes happened to point — which on this rig
        was off to the side and outside the canvas.
      */
      position={[0, 0, 0]}
      center
      distanceFactor={2.4}
      // Never intercept clicks — the avatar and the clip chips sit underneath.
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[20, 0]}
    >
      {/*
        The lift lives on this static wrapper, not on the motion element:
        motion writes its own `transform` for the enter/exit animation and would
        overwrite an inline one, dropping the bubble straight onto the face.
      */}
      <div style={{ transform: 'translateY(-104px)' }}>
      <AnimatePresence mode="wait">
        {ready ? (
          <motion.div
            key={avatarThoughts[index]}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div
              className="whitespace-nowrap rounded-2xl border border-lime/35 bg-[#0b0e13]/95 px-4 py-2.5 text-center shadow-[0_8px_30px_-8px_rgba(0,0,0,0.9)] backdrop-blur-sm"
              style={{
                // Explicit rather than a Tailwind step: this is rendered inside a
                // scaled 3D overlay, so it needs a size that survives the scale.
                fontSize: '15px',
                lineHeight: 1.35,
                fontFamily: 'var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#e9ecef',
              }}
            >
              {avatarThoughts[index]}

              {/* Tail: a rotated square straddling the bottom edge, with only its
                  outer two borders visible so it reads as a continuous point. */}
              <span
                aria-hidden
                className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-lime/35 bg-[#0b0e13]"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </div>
    </Html>,
    head,
  );
}
