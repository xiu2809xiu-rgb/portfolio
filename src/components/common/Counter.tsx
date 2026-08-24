'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface CounterProps {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

/**
 * Counts up to `value` the first time it scrolls into view.
 *
 * Eases out rather than running linearly, so the number decelerates into its
 * final state instead of stopping dead. Renders the final value immediately for
 * reduced-motion visitors and for anything that reads the DOM without scrolling
 * (crawlers, "find in page").
 */
export function Counter({ value, suffix = '', durationMs = 1600, className }: CounterProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [counted, setCounted] = useState(0);

  // Derived, not stored: reduced-motion visitors always see the final number, so
  // there is nothing to synchronise and no effect needed to keep it in step.
  const display = reduced ? value : counted;

  useEffect(() => {
    if (reduced) return;

    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started) return;
        started = true;
        observer.disconnect();

        const startedAt = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCounted(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, durationMs, reduced]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-SG')}
      {suffix}
    </span>
  );
}
