'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  hardSellLines,
  lineText,
  shoutingPoints,
  stageFor,
  type SellLine,
} from '@/content/hard-sell';
import { profile } from '@/content/profile';
import {
  BigArrow,
  Confetti,
  FlyingWork,
  PlaneBanner,
  Pulse,
  Stamp,
} from '@/components/pitch/PitchArt';
import { useStillness } from '@/lib/use-stillness';
import { cn } from '@/lib/utils';

const MAX = hardSellLines.length;

/**
 * One dial, fifty positions, from "what of it?" to a page actively shouting.
 *
 * The escalation is layered rather than switched: each element has a level it
 * appears at, so dragging adds rings, then an arrow, marquees, real project
 * reels, a stamp, a plane and confetti one at a time instead of cutting between
 * five fixed designs. Where it tips from confident into desperate is left for
 * the visitor to find.
 */
export function PitchClient() {
  const still = useStillness();
  const [level, setLevel] = useState(1);
  /* Reaching for a link stops the shaking, so it can actually be clicked. */
  const [steadying, setSteadying] = useState(false);

  const stage = stageFor(level);
  const line = hardSellLines[level - 1];
  const heat = (level - 1) / (MAX - 1);
  const light = stage === 'infomercial';

  const shown = useMemo(
    () => ({
      pulse: level >= 12,
      badge: level >= 20,
      ghost: level >= 24,
      arrow: level >= 32,
      marquee: level >= 34,
      counterMarquee: level >= 36,
      work: level >= 38,
      stamp: level >= 40,
      shake: level >= 41 && !still,
      plane: level >= 43,
      cta: level >= 45,
      confetti: level >= 46 && !still,
      tilt: level >= 48,
      overheat: level >= 49 && !still,
    }),
    [level, still],
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] overflow-hidden transition-colors duration-500',
        light ? 'bg-white text-black' : 'bg-[#05070a] text-white',
        shown.overheat && 'animate-[pitch-overheat_1100ms_ease-in-out_infinite]',
      )}
    >
      {/* Everything except the dial tips over near the end. */}
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={shown.tilt ? { transform: 'rotate(-2.5deg) scale(1.06)' } : undefined}
      >
        {shown.pulse ? <Pulse light={light} /> : null}

        {shown.ghost ? (
          <p
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center font-heading text-[26vw] font-black leading-none tracking-tighter"
            style={{ color: light ? 'rgba(0,0,0,0.05)' : 'rgba(180,255,57,0.07)' }}
          >
            HIRE
          </p>
        ) : null}

        {shown.work ? <FlyingWork still={still} /> : null}
        {shown.marquee ? <Marquee points={shoutingPoints} light={light} still={still} /> : null}
        {shown.counterMarquee ? (
          <Marquee points={shoutingPoints} light={light} still={still} reverse />
        ) : null}
        {shown.arrow ? <BigArrow light={light} still={still} /> : null}
        {shown.stamp ? <Stamp light={light} still={still} /> : null}
        {shown.plane && !still ? <PlaneBanner text={profile.email} light={light} /> : null}
        {shown.confetti ? <Confetti light={light} /> : null}

        {shown.badge ? (
          <p
            className={cn(
              'absolute left-1/2 top-[20%] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border px-4 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]',
              light ? 'border-black/20 bg-white/80 text-black/70' : 'border-lime/40 bg-black/60 text-lime',
            )}
          >
            1st place · NYP × AWS Hackathon 2026
          </p>
        ) : null}

        {/* ── The line ── */}
        <div
          className={cn(
            'absolute inset-0 z-20 grid place-items-center px-6 text-center',
            shown.shake && !steadying && 'animate-[pitch-shake_140ms_linear_infinite]',
          )}
          onPointerEnter={() => setSteadying(true)}
          onPointerLeave={() => setSteadying(false)}
          onFocusCapture={() => setSteadying(true)}
          onBlurCapture={() => setSteadying(false)}
        >
          <p
            data-pitch-line
            className={cn(
              'mx-auto max-w-4xl text-balance transition-all duration-300',
              stage === 'deadpan' && 'font-sans text-base font-semibold sm:text-lg',
              stage === 'warming' && 'font-sans text-lg font-bold sm:text-2xl',
              stage === 'keen' && 'font-heading text-2xl font-extrabold tracking-tight sm:text-4xl',
              stage === 'infomercial' &&
                'font-heading text-2xl font-black uppercase leading-tight tracking-tight text-[#e8000d] sm:text-4xl',
              stage === 'unhinged' &&
                'font-heading text-3xl font-black uppercase leading-[0.95] tracking-tighter sm:text-6xl',
            )}
            style={
              stage === 'unhinged'
                ? { textShadow: `0 0 ${18 + heat * 40}px rgba(180,255,57,0.55)` }
                : undefined
            }
          >
            <Line line={line} light={light} />
          </p>
        </div>

        {shown.cta ? (
          <div className="absolute inset-x-0 top-[62%] z-30 flex flex-wrap items-center justify-center gap-3 px-6">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-lime px-7 py-3.5 font-heading text-base font-black uppercase tracking-tight text-black transition-transform hover:-translate-y-0.5 sm:text-xl"
            >
              Email me
            </a>
            <Link
              href="/book"
              className={cn(
                'rounded-full px-7 py-3.5 font-heading text-base font-black uppercase tracking-tight transition-transform hover:-translate-y-0.5 sm:text-xl',
                light ? 'bg-black text-white' : 'bg-white text-black',
              )}
            >
              Book a session
            </Link>
          </div>
        ) : null}
      </div>

      {/* ── Chrome, outside the tilt so it stays usable ── */}
      <Link
        href="/"
        className={cn(
          'absolute left-5 top-5 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] backdrop-blur transition-colors',
          light
            ? 'border-black/15 bg-white/70 text-black/70 hover:border-black/40 hover:text-black'
            : 'border-white/12 bg-black/45 text-white/70 hover:border-lime/50 hover:text-white',
        )}
      >
        <ArrowLeft className="size-3.5" />
        Back to the site
      </Link>

      {/* ── The dial ── */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-40 px-6 pb-7 pt-6 sm:px-12',
          light ? 'bg-gradient-to-t from-white via-white/85 to-transparent' : 'bg-gradient-to-t from-[#05070a] via-[#05070a]/85 to-transparent',
        )}
      >
        <label htmlFor="hard-sell" className="sr-only">
          How hard should Richie sell himself? 1 is least, {MAX} is most.
        </label>
        <input
          id="hard-sell"
          type="range"
          min={1}
          max={MAX}
          step={1}
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
          aria-valuetext={`${level} of ${MAX}: ${lineText(line)}`}
          className={cn('pitch-range w-full', light && 'pitch-range-light')}
        />
        <div
          className={cn(
            'mt-3 flex items-baseline justify-between font-serif text-sm italic',
            light ? 'text-black/70' : 'text-white/70',
          )}
        >
          <span>Less Hard Sell</span>
          <span
            className={cn(
              'font-mono text-[0.62rem] not-italic tracking-[0.2em]',
              light ? 'text-black/40' : 'text-white/40',
            )}
          >
            {level} / {MAX}
          </span>
          <span>More Hard Sell</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders one line, turning its linked segments into anchors.
 *
 * Links stay underlined and in the accent colour at every stage, including the
 * loud ones. A link that is only discoverable by hovering is not a link on a
 * page that shakes.
 */
function Line({ line, light }: { line: SellLine; light: boolean }) {
  return (
    <>
      {line.map((part, index) =>
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <Link
            key={index}
            href={part.href}
            className={cn(
              'underline decoration-2 underline-offset-[0.22em] transition-colors',
              light
                ? 'text-black decoration-black/40 hover:decoration-black'
                : 'text-lime decoration-lime/50 hover:decoration-lime',
            )}
          >
            {part.text}
          </Link>
        ),
      )}
    </>
  );
}

function Marquee({
  points,
  light,
  still,
  reverse,
}: {
  points: readonly string[];
  light: boolean;
  still: boolean;
  reverse?: boolean;
}) {
  const strip = [...points, ...points, ...points];
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 overflow-hidden border-y py-2',
        reverse ? 'bottom-[24%]' : 'top-[12%]',
        light ? 'border-black/10 bg-black/[0.03]' : 'border-white/10 bg-white/[0.03]',
      )}
    >
      <div
        className={cn(
          'flex w-max gap-8 whitespace-nowrap font-mono text-xs uppercase tracking-[0.25em]',
          light ? 'text-[#e8000d]' : 'text-lime',
          !still &&
            (reverse
              ? 'animate-[pitch-slide-back_22s_linear_infinite]'
              : 'animate-[pitch-slide_18s_linear_infinite]'),
        )}
      >
        {strip.map((point, index) => (
          <span key={`${point}-${index}`}>{point}</span>
        ))}
      </div>
    </div>
  );
}
