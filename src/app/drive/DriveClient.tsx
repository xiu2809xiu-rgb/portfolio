'use client';

import { useEffect, useRef, useState } from 'react';
import type { CarHandle } from '@/components/drive/Car';
import type { ZoneState } from '@/components/drive/Zones';
import { makeClock, type DayNight } from '@/components/drive/useDayNight';
import { Hud } from '@/components/drive/Hud';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useStillness } from '@/lib/use-stillness';
import { cn } from '@/lib/utils';

/*
  ssr:false is not optional here. Rapier is a WebAssembly module and three needs a
  WebGL context; both explode on the server. The loading state is what a visitor
  looks at while roughly a megabyte of physics engine arrives.
*/
const DriveScene = dynamic(() => import('@/components/drive/DriveScene').then((m) => m.DriveScene), {
  ssr: false,
  loading: () => <SceneLoading />,
});

export function DriveClient() {
  const reduced = useStillness();
  const [started, setStarted] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<CarHandle>({ body: null, speedKph: 0, grounded: 0 });
  /*
    The clock and the current district live in refs shared with the scene. They
    change continuously, and putting either in React state would re-render this
    tree — and with it the canvas — many times a second.
  */
  const clockRef = useRef<DayNight>(makeClock());
  const zoneRef = useRef<ZoneState>({ active: null, version: 0 });

  /* Arrow keys and space drive the car; they must not also scroll the page. */
  useEffect(() => {
    if (!started) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [started]);

  if (reduced) return <ReducedMotionNotice />;

  return (
    <div
      ref={hostRef}
      /*
        Above the site header (z-50) and the footer, which follows <main> in the
        DOM and would otherwise paint over a canvas that has no stacking context
        of its own. A driving surface is a full-screen takeover — the page chrome
        has no business floating on top of it, and this route brings its own way
        back.
      */
      className="fixed inset-0 z-[60] bg-[#04060a]"
    >
      {started ? (
        <>
          <DriveScene handle={handle} clockRef={clockRef} zoneRef={zoneRef} />
          <Hud handle={handle} clockRef={clockRef} zoneRef={zoneRef} />
        </>
      ) : (
        <StartCard onStart={() => setStarted(true)} />
      )}

      {/* ── Chrome ── */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/70 backdrop-blur transition-colors hover:border-lime/50 hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back to the site
      </Link>

    </div>
  );
}

function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-lime">
          ~/richie/drive
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Take the <span className="text-gradient-lime">car</span> out
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          A plaza, real suspension, and my work parked around it. Nothing here is on the critical
          path of the portfolio — it loads only if you ask for it.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition-transform hover:-translate-y-0.5"
        >
          Start engine
        </button>

        <dl className="mx-auto mt-10 grid max-w-xs grid-cols-2 gap-x-6 gap-y-2 text-left font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
          {[
            ['W A S D', 'Drive'],
            ['Space', 'Handbrake'],
            ['R', 'Reset'],
            ['E', 'Open a project'],
          ].map(([key, action]) => (
            <div key={key} className="contents">
              <dt className="text-foreground/80">{key}</dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function SceneLoading() {
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-white/10 border-t-lime" />
        <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted-foreground">
          Warming the engine
        </p>
      </div>
    </div>
  );
}

/**
 * There is no honest reduced-motion version of a driving game.
 *
 * Everything it is depends on continuous movement under the player's control, so
 * rather than shipping something degraded it says what it is and offers the way
 * back. The visitor can still choose to go in.
 */
function ReducedMotionNotice() {
  return (
    <div className="wrap grid min-h-[70vh] place-items-center pb-24 pt-32">
      <div className="max-w-md text-center">
        <p className="eyebrow">~/richie/drive</p>
        <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          This one is all movement
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your system asks for reduced motion, and a driving game is continuous camera movement by
          definition — there is no calmer version of it worth shipping. Everything it links to lives
          on the ordinary pages.
        </p>
        <Link
          href="/work"
          className={cn(
            'mt-8 inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3',
            'font-mono text-xs uppercase tracking-widest text-muted-foreground',
            'transition-colors hover:border-lime/50 hover:text-foreground',
          )}
        >
          See the work instead
        </Link>
      </div>
    </div>
  );
}
