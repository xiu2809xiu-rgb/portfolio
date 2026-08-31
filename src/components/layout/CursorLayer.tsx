'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The three-layer cursor from the original site, rebuilt for React.
 *
 * Ported verbatim in behaviour from the old `index.html`:
 *
 *   .cur    16px lime dot, mix-blend-mode: difference, follows at 0.2 lerp,
 *           grows to 60px at 0.6 opacity over anything interactive
 *   .cur-t  40px outlined ring trailing at 0.08, grows to 80px and fades its
 *           border on hover
 *   .cur-g  300px radial glow drifting behind the content at 0.04
 *
 * Two things differ from the original, both deliberate:
 *
 * 1. Hover state is detected by delegation on `document` rather than by binding
 *    listeners to every element once at load. The original bound them a single
 *    time, so anything rendered afterwards never triggered the grow — which on a
 *    React site would be most of the page.
 * 2. It renders nothing at all for coarse pointers or reduced-motion, instead of
 *    hiding with CSS, so their machines never run the animation loop.
 */

/** Anything that should make the dot grow. */
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, .hov';

/*
  Routes that take over the whole viewport and bring their own pointer language.
  The custom cursor is a decoration for reading pages; over a driving game or a
  page whose whole point is a slider you drag, it is a stray dot floating on top
  of the thing you are trying to use.
*/
const FULL_SCREEN_ROUTES = ['/drive', '/pitch'];

export function CursorLayer() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pointer = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 769px)');

    const sync = () => setEnabled(pointer.matches && wide.matches && !motion.matches);
    sync();

    for (const query of [pointer, motion, wide]) query.addEventListener('change', sync);
    return () => {
      for (const query of [pointer, motion, wide]) query.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    // Start centred so the layers do not fly in from the top-left on first move.
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;
    let glowX = mouseX;
    let glowY = mouseY;

    const onMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    // The original set left/top; transform keeps the work on the compositor.
    let frame = 0;
    const tick = () => {
      dotX += (mouseX - dotX) * 0.2;
      dotY += (mouseY - dotY) * 0.2;
      ringX += (mouseX - ringX) * 0.08;
      ringY += (mouseY - ringY) * 0.08;
      glowX += (mouseX - glowX) * 0.04;
      glowY += (mouseY - glowY) * 0.04;

      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const setHover = (active: boolean) => {
      dot.classList.toggle('is-hover', active);
      ring.classList.toggle('is-hover', active);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) setHover(true);
    };
    const onOut = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) setHover(false);
    };

    // Hide the layers when the pointer leaves the window entirely.
    const setVisible = (visible: boolean) => {
      for (const node of [dot, ring, glow]) node.style.opacity = visible ? '' : '0';
    };
    const onEnterDoc = () => setVisible(true);
    const onLeaveDoc = () => setVisible(false);

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('mouseenter', onEnterDoc);
    document.addEventListener('mouseleave', onLeaveDoc);

    // Only hide the native cursor while the custom one is actually running.
    document.documentElement.classList.add('has-custom-cursor');

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('mouseenter', onEnterDoc);
      document.removeEventListener('mouseleave', onLeaveDoc);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [enabled]);

  if (!enabled || FULL_SCREEN_ROUTES.some((route) => pathname?.startsWith(route))) return null;

  return (
    <>
      <div ref={dotRef} className="cur" aria-hidden="true" />
      <div ref={ringRef} className="cur-t" aria-hidden="true" />
      <div ref={glowRef} className="cur-g" aria-hidden="true" />
    </>
  );
}
