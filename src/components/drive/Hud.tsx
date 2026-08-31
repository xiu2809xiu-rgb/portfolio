'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { District } from '@/content/drive-world';
import type { CarHandle } from './Car';
import type { ZoneState } from './Zones';
import { clockLabel, DAY_LENGTH_SECONDS, START_AT, type DayNight } from './useDayNight';
import { cn } from '@/lib/utils';

/**
 * Speed, time of day, the controls card, and the panel that names whichever
 * chapter the car is standing in front of.
 *
 * Continuous values are written straight into DOM nodes on each frame rather
 * than held in React state — at 60Hz, state would re-render this subtree sixty
 * times a second to change two digits and a clock, which would be the most
 * expensive thing on the page and spent on the least important part of it.
 *
 * The district panel is the exception, and deliberately so: it changes a few
 * times a minute, carries real content, and is worth a render when it does.
 */
export function Hud({
  handle,
  clockRef,
  zoneRef,
}: {
  handle: React.RefObject<CarHandle>;
  clockRef: React.RefObject<DayNight>;
  zoneRef: React.RefObject<ZoneState>;
}) {
  const speedRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const clockTextRef = useRef<HTMLSpanElement>(null);
  const [showKeys, setShowKeys] = useState(true);
  const [zone, setZone] = useState<District | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const seenVersion = useRef(-1);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const kph = handle.current?.speedKph ?? 0;
      if (speedRef.current) speedRef.current.textContent = String(Math.round(kph));
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(kph / 90, 1)})`;
      if (clockTextRef.current && clockRef.current) {
        clockTextRef.current.textContent = clockLabel(clockRef.current.t);
      }

      /* Only re-render when the district actually changes. */
      const zoneState = zoneRef.current;
      if (zoneState && zoneState.version !== seenVersion.current) {
        seenVersion.current = zoneState.version;
        setZone(zoneState.active);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [handle, clockRef, zoneRef]);

  useEffect(() => {
    const timer = setTimeout(() => setShowKeys(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ── Speed ── */}
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

      {/* ── Time of day ── */}
      <div className="absolute right-6 top-5 z-30 w-52 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <span
            ref={clockTextRef}
            className="font-mono text-lg font-bold tabular-nums tracking-widest text-white"
          >
            00:00
          </span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/40">
            {Math.round(DAY_LENGTH_SECONDS / 60)} min day
          </span>
        </div>
        {/*
          A scrubber, not a toggle. Time runs on its own; dragging this holds it
          somewhere while you look, and letting go hands it back to the clock —
          which is the difference between choosing a moment and freezing one.
        */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          /* The constant, not the live ref — reading a ref during render is
             exactly the thing the compiler is right to complain about. */
          defaultValue={START_AT}
          aria-label="Time of day"
          onPointerDown={() => setScrubbing(true)}
          onChange={(event) => {
            if (clockRef.current) clockRef.current.scrub = Number(event.target.value);
          }}
          onPointerUp={() => {
            setScrubbing(false);
            if (clockRef.current) clockRef.current.scrub = null;
          }}
          onBlur={() => {
            if (clockRef.current) clockRef.current.scrub = null;
          }}
          className="pitch-range mt-2 w-full"
        />
        <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-white/35">
          {scrubbing ? 'Holding' : 'Running'}
        </p>
      </div>

      {/* ── The chapter you are standing in front of ── */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-28 z-20 mx-auto w-[min(92vw,32rem)] rounded-2xl border p-5 backdrop-blur transition-all duration-300',
          zone
            ? 'translate-y-0 border-lime/30 bg-black/65 opacity-100'
            : 'pointer-events-none translate-y-3 border-white/5 bg-black/0 opacity-0',
        )}
      >
        {zone ? (
          <>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] text-lime">
              {zone.kicker}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white">
              {zone.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{zone.blurb}</p>
            <Link
              href={zone.href}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-black"
            >
              Press E to open
            </Link>
          </>
        ) : null}
      </div>

      {/* ── Controls, for the first few seconds ── */}
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
            ['E', 'Open a chapter'],
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
