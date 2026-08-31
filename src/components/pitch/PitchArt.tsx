'use client';

import Link from 'next/link';
import { flyingWork } from '@/content/hard-sell';
import { cn } from '@/lib/utils';

/**
 * The escalation's furniture.
 *
 * Authored rather than borrowed. The reference cuts out stock photographs — a
 * hand, a cat, a plane — which is charming on someone else's site and would be
 * someone else's licensing on this one. These are flat geometric shapes in the
 * site's own palette, which reads as designed rather than as clip art, weighs a
 * few hundred bytes, and stays crisp at any size.
 */

/** A slab arrow that hammers down at the line. Replaces the pointing-hand emoji. */
export function BigArrow({ light, still }: { light: boolean; still: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 96"
      className={cn(
        'pointer-events-none absolute left-1/2 top-[26%] w-14 -translate-x-1/2 sm:w-20',
        !still && 'animate-[pitch-hammer_800ms_cubic-bezier(0.4,0,0.2,1)_infinite]',
      )}
    >
      <path
        d="M24 0h16v56h18L32 96 6 56h18z"
        fill={light ? '#e8000d' : '#b4ff39'}
      />
    </svg>
  );
}

/** A jet towing a banner. The banner carries whatever text it is given. */
export function PlaneBanner({ text, light }: { text: string; light: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[10%] flex items-center gap-2 whitespace-nowrap animate-[pitch-fly_11s_linear_infinite]"
    >
      <span
        className={cn(
          'rounded-[3px] border-2 px-5 py-2 font-heading text-base font-black tracking-tight sm:text-xl',
          light ? 'border-black bg-white text-black' : 'border-white bg-[#05070a] text-white',
        )}
      >
        {text}
      </span>
      <svg viewBox="0 0 64 40" className="w-12 sm:w-16">
        <path
          d="M2 22 L30 18 L38 4 L46 4 L44 17 L62 15 L62 23 L44 22 L46 36 L38 36 L30 22z"
          fill={light ? '#111' : '#e9ecef'}
        />
      </svg>
    </div>
  );
}

/** A rubber stamp that thumps down and stays. */
export function Stamp({ light, still }: { light: boolean; still: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute right-[6%] top-[30%] rotate-[-14deg]',
        !still && 'animate-[pitch-stamp_1400ms_cubic-bezier(0.2,1.4,0.4,1)_infinite]',
      )}
    >
      <span
        className={cn(
          'block rounded-md border-[5px] px-4 py-2 font-heading text-lg font-black uppercase leading-none tracking-tight sm:text-2xl',
          light ? 'border-[#e8000d] text-[#e8000d]' : 'border-lime text-lime',
        )}
        style={{ opacity: 0.85 }}
      >
        Available
        <br />
        2027
      </span>
    </div>
  );
}

/**
 * Real project reels, tumbling past.
 *
 * The same files the work carousel plays, so a visitor who has seen the home
 * page already has them cached and this costs nothing. Muted, looping and
 * `playsInline`; they are decoration, but they are decoration made of the actual
 * portfolio rather than of stock footage.
 */
export function FlyingWork({ still }: { still: boolean }) {
  const lanes = [
    { top: '14%', delay: '0s', duration: '17s', tilt: -7 },
    { top: '58%', delay: '5s', duration: '21s', tilt: 6 },
    { top: '38%', delay: '10s', duration: '19s', tilt: -3 },
  ];

  return (
    <>
      {flyingWork.map((item, index) => {
        const lane = lanes[index % lanes.length];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`${item.title} case study`}
            className="absolute z-10 block w-40 sm:w-56"
            style={{
              top: lane.top,
              transform: `rotate(${lane.tilt}deg)`,
              animation: still
                ? undefined
                : `pitch-drift ${lane.duration} linear ${lane.delay} infinite`,
            }}
          >
            <span className="block rounded-lg border-2 border-white/70 bg-black p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
              <video
                src={item.src}
                muted
                loop
                autoPlay
                playsInline
                preload="none"
                className="block aspect-[16/10] w-full rounded-sm object-cover"
              />
              <span className="block px-1 pb-0.5 pt-1 font-mono text-[0.55rem] uppercase tracking-widest text-white/80">
                {item.title}
              </span>
            </span>
          </Link>
        );
      })}
    </>
  );
}

/**
 * Falling chips of colour.
 *
 * Positions and delays are derived from the index rather than random, so the
 * layout is identical on the server and the client — `Math.random()` here would
 * be a hydration mismatch waiting to happen.
 */
export function Confetti({ light }: { light: boolean }) {
  const chips = Array.from({ length: 26 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 13) * 0.34}s`,
    duration: `${3.4 + ((i * 7) % 22) / 10}s`,
    size: 6 + (i % 4) * 3,
    colour: light ? '#e8000d' : i % 3 === 0 ? '#39ffd8' : '#b4ff39',
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="absolute top-[-8%] block"
          style={{
            left: chip.left,
            width: chip.size,
            height: chip.size * 1.8,
            background: chip.colour,
            animation: `pitch-fall ${chip.duration} linear ${chip.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Concentric rings that pulse outward from behind the line. */
export function Pulse({ light }: { light: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute block rounded-full border-2"
          style={{
            width: '38vmin',
            height: '38vmin',
            borderColor: light ? 'rgba(232,0,13,0.35)' : 'rgba(180,255,57,0.3)',
            animation: `pitch-pulse 2.6s ease-out ${i * 0.85}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
