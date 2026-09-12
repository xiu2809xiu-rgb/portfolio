'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CarHandle } from '@/components/drive/Car';
import { makeZoneState, type ZoneState } from '@/components/drive/Zones';
import { makeClock, type DayNight } from '@/components/drive/useDayNight';
import { EngineAudio } from '@/components/drive/engine-audio';
import { Hud } from '@/components/drive/Hud';
import { DEFAULT_VEHICLE, vehicles } from '@/content/drive-vehicles';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
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
  const [vehicleId, setVehicleId] = useState<string>(DEFAULT_VEHICLE);
  const [soundOn, setSoundOn] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<CarHandle>({ body: null, speedKph: 0, grounded: 0 });
  /*
    The clock and the current district live in refs shared with the scene. They
    change continuously, and putting either in React state would re-render this
    tree — and with it the canvas — many times a second.
  */
  const clockRef = useRef<DayNight>(makeClock());
  const zoneRef = useRef<ZoneState>(makeZoneState());
  const [audio, setAudio] = useState<EngineAudio | null>(null);
  /* Mirrors `audio` so teardown does not have to depend on it — see below. */
  const audioRef = useRef<EngineAudio | null>(null);

  /* Arrow keys and space drive the car; they must not also scroll the page. */
  useEffect(() => {
    if (!started) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [started]);

  /*
    An AudioContext created outside a user gesture starts suspended, so it is
    built here — in the handler for a button that says "Start engine", which is
    about as clear a piece of consent as this could ask for. Sound is on by
    default for exactly that reason, and can be turned off before starting or at
    any point afterwards.
  */
  const start = useCallback(() => {
    const engine = new EngineAudio();
    engine.start();
    engine.setMuted(!soundOn);
    audioRef.current = engine;
    setAudio(engine);
    setStarted(true);
  }, [soundOn]);

  /*
    Empty dependencies, reading through a ref. Keyed on `audio` instead, this
    would be a cleanup with no setup — and StrictMode's mount/unmount/mount in
    development runs that cleanup immediately after the context is created,
    tearing down the audio graph the moment it is built.
  */
  useEffect(
    () => () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    },
    [],
  );

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      audio?.setMuted(on);
      return !on;
    });
  }, [audio]);

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
          <DriveScene
            handle={handle}
            clockRef={clockRef}
            zoneRef={zoneRef}
            vehicleId={vehicleId}
            audio={audio}
          />
          <Hud handle={handle} clockRef={clockRef} zoneRef={zoneRef} />
        </>
      ) : (
        <StartCard
          onStart={start}
          vehicleId={vehicleId}
          onPickVehicle={setVehicleId}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((on) => !on)}
        />
      )}

      {/* ── Chrome ── */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/70 backdrop-blur transition-colors hover:border-lime/50 hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back to the site
      </Link>

      {started ? (
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          className="absolute left-5 top-[4.6rem] z-20 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/70 backdrop-blur transition-colors hover:border-lime/50 hover:text-white"
        >
          {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          {soundOn ? 'Sound on' : 'Muted'}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Pre-flight: pick a body, decide about sound, then start.
 *
 * The picker is honest about what it does and does not change. Someone choosing
 * the van might reasonably expect it to wallow, and it does not — so the card
 * says so, rather than letting them find out and conclude the physics is broken.
 */
function StartCard({
  onStart,
  vehicleId,
  onPickVehicle,
  soundOn,
  onToggleSound,
}: {
  onStart: () => void;
  vehicleId: string;
  onPickVehicle: (id: string) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const chosen = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];

  return (
    <div className="grid h-full place-items-center overflow-y-auto px-6 py-24">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-lime">
          ~/richie/drive
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Take the <span className="text-gradient-lime">car</span> out
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          A town with a ring road, a real day and night cycle, and my work behind six gates.
          Nothing here is on the critical path of the portfolio — it loads only if you ask.
        </p>

        {/* ── Body ── */}
        <fieldset className="mt-9 text-left">
          <legend className="mb-3 w-full text-center font-mono text-[0.58rem] uppercase tracking-[0.25em] text-muted-foreground">
            Pick a body
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {vehicles.map((vehicle) => {
              const active = vehicle.id === vehicleId;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => onPickVehicle(vehicle.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    active
                      ? 'border-lime/60 bg-lime/10'
                      : 'border-hairline hover:border-lime/30 hover:bg-white/[0.03]',
                  )}
                >
                  <span
                    className="block h-1.5 w-8 rounded-full"
                    style={{ backgroundColor: vehicle.paint }}
                  />
                  <span className="mt-2 block font-heading text-xs font-bold tracking-tight">
                    {vehicle.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {chosen.blurb}
          </p>
          <p className="mt-1 text-center font-mono text-[0.55rem] uppercase tracking-[0.16em] text-muted-foreground/70">
            Bodywork only · they all drive the same
          </p>
        </fieldset>

        {/* ── Sound ── */}
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          className={cn(
            'mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] transition-colors',
            soundOn
              ? 'border-lime/40 bg-lime/10 text-lime'
              : 'border-hairline text-muted-foreground hover:text-foreground',
          )}
        >
          {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          Engine sound {soundOn ? 'on' : 'off'}
        </button>

        <div>
          <button
            type="button"
            onClick={onStart}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition-transform hover:-translate-y-0.5"
          >
            Start engine
          </button>
        </div>

        <dl className="mx-auto mt-10 grid max-w-sm grid-cols-2 gap-x-6 gap-y-2 text-left font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
          {[
            ['W A S D', 'Drive'],
            ['Space', 'Handbrake'],
            ['H', 'Horn'],
            ['E', 'Open a project'],
            ['R', 'Reset'],
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
