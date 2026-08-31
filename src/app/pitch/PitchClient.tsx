'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { hardSellLines, shoutingPoints, stageFor, type SellStage } from '@/content/hard-sell';
import { profile } from '@/content/profile';
import { useStillness } from '@/lib/use-stillness';
import { cn } from '@/lib/utils';

const MAX = hardSellLines.length;

/**
 * One dial, fifty positions, from "what of it?" to a page actively shouting.
 *
 * The escalation is layered rather than switched: each element has a level it
 * appears at, so dragging the slider adds pointing hands and marquees and a cat
 * one at a time instead of cutting between five fixed designs. That gradual
 * accumulation is the whole joke — the point where it tips from confident into
 * desperate should be somewhere the visitor finds for themselves.
 */
export function PitchClient() {
  const still = useStillness();
  const [level, setLevel] = useState(1);

  const stage = stageFor(level);
  const line = hardSellLines[level - 1];

  /* 0 → 1 across the whole slider, for anything that scales continuously. */
  const heat = (level - 1) / (MAX - 1);

  const shown = useMemo(
    () => ({
      badge: level >= 20,
      ghostWord: level >= 30,
      hand: level >= 33,
      marquee: level >= 35,
      counterMarquee: level >= 38,
      shake: level >= 41 && !still,
      plane: level >= 43 && !still,
      giantCta: level >= 45,
      cat: level >= 47,
      strobe: level >= 49 && !still,
    }),
    [level, still],
  );

  const light = stage === 'infomercial';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] overflow-hidden transition-colors duration-500',
        light ? 'bg-white text-black' : 'bg-[#05070a] text-white',
        shown.strobe && 'animate-[pitch-strobe_320ms_steps(2,end)_infinite]',
      )}
    >
      {/* ── The line itself ── */}
      <div
        className={cn(
          'absolute inset-0 grid place-items-center px-6 text-center',
          shown.shake && 'animate-[pitch-shake_140ms_linear_infinite]',
        )}
      >
        <p
          key={level}
          className={cn(
            'relative z-10 mx-auto max-w-4xl text-balance transition-all duration-300',
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
          {line}
        </p>
      </div>

      {/* ── Everything that piles on ── */}
      {shown.ghostWord ? (
        <p
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center font-heading text-[26vw] font-black leading-none tracking-tighter"
          style={{ color: light ? 'rgba(0,0,0,0.05)' : 'rgba(180,255,57,0.07)' }}
        >
          HIRE
        </p>
      ) : null}

      {shown.badge ? (
        <p
          className={cn(
            'absolute left-1/2 top-[24%] -translate-x-1/2 rounded-full border px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.2em]',
            light ? 'border-black/20 text-black/70' : 'border-lime/40 text-lime',
          )}
        >
          1st place · NYP × AWS Hackathon 2026
        </p>
      ) : null}

      {shown.hand ? (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 text-6xl sm:text-8xl',
            !still && 'animate-[pitch-point_900ms_ease-in-out_infinite]',
          )}
        >
          👉
        </div>
      ) : null}

      {shown.marquee ? (
        <Marquee points={shoutingPoints} light={light} still={still} />
      ) : null}
      {shown.counterMarquee ? (
        <Marquee points={shoutingPoints} light={light} still={still} reverse />
      ) : null}

      {shown.plane ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-[12%] flex items-center gap-3 whitespace-nowrap animate-[pitch-fly_9s_linear_infinite]"
        >
          <span className="rounded-sm bg-white px-5 py-2 font-heading text-lg font-black tracking-tight text-black sm:text-2xl">
            {profile.email}
          </span>
          <span className="text-4xl sm:text-5xl">✈️</span>
        </div>
      ) : null}

      {shown.cat ? (
        <div aria-hidden className="pointer-events-none absolute bottom-28 left-4 flex items-end gap-2 sm:left-12">
          <span className={cn('text-7xl sm:text-9xl', !still && 'animate-[pitch-wiggle_700ms_ease-in-out_infinite]')}>
            🐱
          </span>
          <span className="mb-6 rounded-2xl bg-white px-5 py-3 font-heading text-lg font-black uppercase leading-none tracking-tight text-black sm:text-2xl">
            Email
            <br />
            Richie
          </span>
        </div>
      ) : null}

      {shown.giantCta ? (
        <div className="absolute inset-x-0 top-[58%] z-20 flex flex-wrap items-center justify-center gap-3 px-6">
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

      {/* ── Chrome ── */}
      <Link
        href="/"
        className={cn(
          'absolute left-5 top-5 z-30 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] backdrop-blur transition-colors',
          light
            ? 'border-black/15 bg-white/70 text-black/70 hover:border-black/40 hover:text-black'
            : 'border-white/12 bg-black/45 text-white/70 hover:border-lime/50 hover:text-white',
        )}
      >
        <ArrowLeft className="size-3.5" />
        Back to the site
      </Link>

      {/* ── The dial ── */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-6 pb-7 pt-4 sm:px-12">
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
          aria-valuetext={`${level} of ${MAX}: ${line}`}
          className={cn('pitch-range w-full', light && 'pitch-range-light')}
        />
        <div
          className={cn(
            'mt-3 flex items-baseline justify-between font-serif text-sm italic',
            light ? 'text-black/70' : 'text-white/70',
          )}
        >
          <span>Less Hard Sell</span>
          <span className={cn('font-mono text-[0.62rem] not-italic tracking-[0.2em]', light ? 'text-black/40' : 'text-white/40')}>
            {level} / {MAX}
          </span>
          <span>More Hard Sell</span>
        </div>
      </div>
    </div>
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
        reverse ? 'bottom-[26%]' : 'top-[16%]',
        light ? 'border-black/10 bg-black/[0.03]' : 'border-white/10 bg-white/[0.03]',
      )}
    >
      <div
        className={cn(
          'flex w-max gap-8 whitespace-nowrap font-mono text-xs uppercase tracking-[0.25em]',
          light ? 'text-[#e8000d]' : 'text-lime',
          !still && (reverse ? 'animate-[pitch-slide-back_22s_linear_infinite]' : 'animate-[pitch-slide_18s_linear_infinite]'),
        )}
      >
        {strip.map((point, index) => (
          <span key={`${point}-${index}`}>{point}</span>
        ))}
      </div>
    </div>
  );
}
