'use client';

import { useEffect, useRef, useState } from 'react';
import type { CarHandle } from './Car';
import { cn } from '@/lib/utils';

/**
 * Speed readout and the controls card.
 *
 * The number is written straight into the DOM node on each frame rather than
 * held in React state. At 60Hz, state would re-render this subtree sixty times a
 * second to change two digits — the most expensive thing on the page, spent on
 * the least important part of it.
 */
export function Hud({ handle }: { handle: React.RefObject<CarHandle> }) {
  const speedRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [showKeys, setShowKeys] = useState(true);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const kph = handle.current?.speedKph ?? 0;
      if (speedRef.current) speedRef.current.textContent = String(Math.round(kph));
      if (barRef.current) {
        // 90kph is well past anything reachable, so the bar never pins.
        barRef.current.style.transform = `scaleX(${Math.min(kph / 90, 1)})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [handle]);

  /* The card is for the first few seconds; after that it is clutter. */
  useEffect(() => {
    const timer = setTimeout(() => setShowKeys(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute bottom-6 right-6 z-20 text-right">
        <div className="flex items-baseline justify-end gap-1.5">
          <span
            ref={speedRef}
            className="font-heading text-5xl font-black leading-none tabular-nums tracking-tight text-white"
          >
            0
          </span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/50">
            kph
          </span>
        </div>
        <div className="mt-2 h-0.5 w-32 overflow-hidden rounded-full bg-white/15">
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full bg-lime"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute bottom-6 left-6 z-20 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur transition-opacity duration-700',
          showKeys ? 'opacity-100' : 'opacity-0',
        )}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-white/60">
          {[
            ['W A S D', 'Drive'],
            ['Space', 'Handbrake'],
            ['R', 'Reset'],
          ].map(([key, action]) => (
            <div key={key} className="contents">
              <dt className="text-white/85">{key}</dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
