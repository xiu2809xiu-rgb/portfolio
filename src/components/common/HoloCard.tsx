'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useStillness } from '@/lib/use-stillness';
import { cn } from '@/lib/utils';

/**
 * A holographic trading card: layered parallax, a foil that tracks the pointer,
 * and a back face.
 *
 * The technique is the one in LerSent001/holo-card (MIT) — stacked 2D layers at
 * different depths, tilted under perspective, with a diffraction gradient and a
 * specular highlight over the top. What is different here is where the layers
 * come from. That project generates them with an image model, inpainting the art
 * hidden behind the lettering, and exports a self-contained HTML file. These
 * layers are authored markup, which costs nothing to download, stays sharp at
 * any size, and inherits the site's type and palette rather than arriving with
 * its own.
 *
 * Depth is real `translateZ` rather than hand-computed offsets. Perspective then
 * produces the parallax for free and, more usefully, produces the *correct*
 * parallax — layers separate by an amount that actually follows from how far
 * apart they are, so the card holds together at any angle instead of only at the
 * ones that were tuned by eye.
 */

/** Must match `.holo-viewport { perspective }` in globals.css. */
export const HOLO_PERSPECTIVE = 900;

/** Degrees of tilt at the very edge of the card. */
const MAX_TILT = 13;

/** Per-frame approach towards the target. Roughly a 100ms settle at 60Hz. */
const EASE = 0.14;

/** Below this, the card has arrived and the loop can stop. */
const SETTLED = 0.0015;

/*
  Stronger than it would need to be over the type. The foil sits under the
  lettering now, so it can bite without costing a word of legibility.
*/
const REST_FOIL = 0.22;
const ACTIVE_FOIL = 0.55;

interface Motion {
  px: number;
  py: number;
  targetPx: number;
  targetPy: number;
  rx: number;
  ry: number;
  targetRx: number;
  targetRy: number;
  glare: number;
  targetGlare: number;
}

const rest = (): Motion => ({
  px: 0.5,
  py: 0.5,
  targetPx: 0.5,
  targetPy: 0.5,
  rx: 0,
  ry: 0,
  targetRx: 0,
  targetRy: 0,
  glare: 0,
  targetGlare: 0,
});

export function HoloCard({
  front,
  back,
  className,
  flipLabel = 'Flip the card over',
}: {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipLabel?: string;
}) {
  const still = useStillness();
  const tiltRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Motion>(rest());
  const startRef = useRef<() => void>(() => {});
  const [flipped, setFlipped] = useState(false);

  /*
    The loop lives in an effect so it can call itself, and so its frame handle is
    a local the cleanup can close over. It runs only while the card is moving:
    once every value has arrived it stops scheduling, and the next pointer move
    starts it again. A card sitting idle on the page costs nothing.

    Pointer values are written straight onto the node as custom properties. They
    change every frame, and holding them in state would re-render the card and
    everything inside it sixty times a second to move a gradient.
  */
  useEffect(() => {
    const node = tiltRef.current;
    if (!node) return;

    let frame = 0;

    const step = () => {
      const m = motionRef.current;
      m.px += (m.targetPx - m.px) * EASE;
      m.py += (m.targetPy - m.py) * EASE;
      m.rx += (m.targetRx - m.rx) * EASE;
      m.ry += (m.targetRy - m.ry) * EASE;
      m.glare += (m.targetGlare - m.glare) * EASE;

      const style = node.style;
      style.setProperty('--holo-rx', `${m.rx.toFixed(3)}deg`);
      style.setProperty('--holo-ry', `${m.ry.toFixed(3)}deg`);
      style.setProperty('--holo-px', `${(m.px * 100).toFixed(2)}%`);
      style.setProperty('--holo-py', `${(m.py * 100).toFixed(2)}%`);
      /* Slides the diffraction bands across the card as the angle changes. */
      style.setProperty('--holo-shift', `${(m.px * 100).toFixed(2)}%`);
      style.setProperty('--holo-glare', m.glare.toFixed(3));
      style.setProperty(
        '--holo-foil',
        (REST_FOIL + m.glare * (ACTIVE_FOIL - REST_FOIL)).toFixed(3),
      );
      /* The rim light sits opposite the tilt, so the lit edge is the raised one. */
      style.setProperty('--holo-rim-x', `${((0.5 - m.px) * 40).toFixed(1)}px`);
      style.setProperty('--holo-rim-y', `${((0.5 - m.py) * 40).toFixed(1)}px`);

      const moving =
        Math.abs(m.targetRx - m.rx) +
          Math.abs(m.targetRy - m.ry) +
          Math.abs(m.targetGlare - m.glare) >
        SETTLED;

      frame = moving ? requestAnimationFrame(step) : 0;
    };

    startRef.current = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    /* One pass so the resting foil is painted before any pointer arrives. */
    step();

    return () => {
      cancelAnimationFrame(frame);
      startRef.current = () => {};
    };
  }, []);

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (still) return;
      const box = event.currentTarget.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width;
      const py = (event.clientY - box.top) / box.height;

      const m = motionRef.current;
      m.targetPx = px;
      m.targetPy = py;
      /*
        The card turns to face the pointer, so its surface normal points at the
        cursor — which is also what makes the specular highlight land correctly,
        since the brightest spot should be where the card is most square-on.

        The signs are derived from the CSS transform axes rather than guessed.
        +Y runs *down* the screen, so a positive rotateX carries the top edge
        away from the viewer and a positive rotateY carries the right edge away.
        Facing the pointer therefore needs the negative of each.
      */
      m.targetRx = (py - 0.5) * 2 * MAX_TILT;
      m.targetRy = (0.5 - px) * 2 * MAX_TILT;
      m.targetGlare = 1;

      startRef.current();
    },
    [still],
  );

  const handleLeave = useCallback(() => {
    const m = motionRef.current;
    m.targetRx = 0;
    m.targetRy = 0;
    m.targetPx = 0.5;
    m.targetPy = 0.5;
    m.targetGlare = 0;
    startRef.current();
  }, []);

  /*
    Clicking the card flips it, which is the affordance everyone already has for
    a card. That cannot be a <button> wrapper, though: the back face carries a
    real link, and a button may not contain one. So the surface handles the
    click, an explicit button carries it for the keyboard, and clicks that
    landed on something interactive are left alone.
  */
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('a,button')) return;
    setFlipped((value) => !value);
  }, []);

  return (
    <div className={cn('holo-viewport select-none', className)}>
      <div
        ref={tiltRef}
        className="holo-tilt"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onClick={handleClick}
      >
        <div
          className="holo-flip grid"
          style={{ '--holo-flip': flipped ? '180deg' : '0deg' } as React.CSSProperties}
        >
          <div className="holo-face">{front}</div>
          {/* aria-hidden while facing away, so a screen reader is not read two
              cards where a sighted visitor sees one. */}
          <div className="holo-face holo-face--back" aria-hidden={!flipped}>
            {back}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-pressed={flipped}
          className={cn(
            'rounded-full border border-hairline px-4 py-2',
            'font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground',
            'transition-colors hover:border-lime/50 hover:text-foreground',
          )}
        >
          {flipLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * One plane of the card, held `depth` pixels above the base.
 *
 * The counter-scale is the important part. Perspective magnifies anything
 * brought towards the viewer, so a raised layer would otherwise overhang the
 * card's own edges. Scaling by `(perspective - depth) / perspective` cancels
 * exactly that magnification while leaving the sideways separation intact — so
 * the layers still slide against each other as the card turns, but the card
 * keeps its edges.
 */
export function HoloLayer({
  depth = 0,
  className,
  children,
}: {
  depth?: number;
  className?: string;
  children: ReactNode;
}) {
  const scale = (HOLO_PERSPECTIVE - depth) / HOLO_PERSPECTIVE;
  return (
    <div className={className} style={{ transform: `translateZ(${depth}px) scale(${scale})` }}>
      {children}
    </div>
  );
}
