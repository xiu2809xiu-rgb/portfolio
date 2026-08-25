'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import { Pause, Play } from 'lucide-react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { AVATAR_CLIPS, DEFAULT_CLIP } from './avatarClips';
import { AvatarModel } from './AvatarModel';

interface AvatarStageProps {
  className?: string;
  /** Show the clip switcher chips under the canvas. */
  controls?: boolean;
}

/**
 * Canvas wrapper for the 3D avatar.
 *
 * Everything expensive is deferred: the canvas only mounts once it scrolls into
 * view (via IntersectionObserver) and the frameloop parks on `demand` whenever it
 * leaves, so an off-screen avatar costs nothing. WebGL failures and reduced-motion
 * both fall back to a still photograph rather than an empty box.
 */
export function AvatarStage({ className, controls = true }: AvatarStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [clip, setClip] = useState(DEFAULT_CLIP.track);
  const [failed, setFailed] = useState(false);
  /** Cycles through the clips until someone picks one by hand. */
  const [autoplay, setAutoplay] = useState(true);

  /**
   * Cheap WebGL probe — cheaper than mounting a Canvas and catching its throw.
   *
   * Runs in a lazy initialiser rather than an effect: the stage is imported with
   * `ssr: false`, so `document` exists on the very first render and the answer
   * never changes for the life of the page.
   */
  const [supported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(
        canvas.getContext('webgl2') ??
          canvas.getContext('webgl') ??
          canvas.getContext('experimental-webgl'),
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * Advance to the next clip when the current one has had time to play through.
   *
   * Each clip gets its own duration from `avatarClips.ts` rather than a fixed
   * interval, so a 3-second wave is not held on screen as long as a 12-second
   * dance. Paused while off-screen so a backgrounded tab is not cycling a rig
   * nobody is watching.
   */
  useEffect(() => {
    if (!autoplay || !visible || failed) return;

    const current = AVATAR_CLIPS.find((item) => item.track === clip) ?? DEFAULT_CLIP;
    // A beat on top of the clip length so it lands before cutting away.
    const holdMs = (current.seconds + 0.6) * 1000;

    const timer = setTimeout(() => {
      const index = AVATAR_CLIPS.findIndex((item) => item.track === clip);
      const next = AVATAR_CLIPS[(index + 1) % AVATAR_CLIPS.length];
      setClip(next.track);
    }, holdMs);

    return () => clearTimeout(timer);
  }, [autoplay, visible, failed, clip]);

  /** A manual pick takes over — nobody wants the demo reel fighting their choice. */
  const selectClip = (track: string) => {
    setAutoplay(false);
    setClip(track);
  };

  const usable = supported && !failed;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        ref={hostRef}
        className="relative aspect-[3/4] w-full max-w-[22rem] overflow-hidden rounded-3xl border border-hairline bg-gradient-to-b from-white/[0.04] to-transparent sm:max-w-sm"
      >
        {/* Lime floor glow behind the model. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(180,255,57,0.16),transparent_70%)]"
        />

        {usable && visible ? (
          <Canvas
            /*
              Full retina. The avatar is the centrepiece and sits in a ~350px
              box, so the extra pixels cost little and are the difference between
              crisp and soft on a high-DPI screen.
            */
            dpr={[1, 2]}
            shadows="soft"
            frameloop={visible ? 'always' : 'demand'}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              // ACES filmic keeps the lime rim light from clipping to white where
              // it hits the shoulders, and holds detail in the dark trousers.
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
            onCreated={({ gl }) => gl.setClearAlpha(0)}
            onError={() => setFailed(true)}
            className="!absolute inset-0"
          >
            <PerspectiveCamera makeDefault position={[0, 0.15, 3.1]} fov={38} />

            <ambientLight intensity={0.55} />
            <directionalLight
              position={[3, 4, 3]}
              intensity={2.1}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0005}
            />
            {/* Rim lights, kept low and placed behind the shoulders rather than
                above: aimed higher they wash the top of the hair green instead of
                just catching the silhouette edge. */}
            <directionalLight position={[-3, 0.4, -2.5]} intensity={0.75} color="#b4ff39" />
            <directionalLight position={[2.5, 0.2, -3]} intensity={0.4} color="#39ffd8" />
            {/* Soft fill under the chin so the face is not lost in shadow. */}
            <directionalLight position={[0, -1.5, 2]} intensity={0.35} color="#ffffff" />

            <Suspense fallback={null}>
              <AvatarModel clip={clip} />
              {/* `studio` has broader, softer sources than `city`, which reads
                  better on skin than city's hard window reflections. */}
              <Environment preset="studio" environmentIntensity={0.55} />
              <ContactShadows
                position={[0, -1.35, 0]}
                opacity={0.5}
                scale={7}
                blur={2.4}
                far={2}
                resolution={1024}
                color="#000000"
              />
            </Suspense>
          </Canvas>
        ) : null}

        {!usable ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              3D preview needs WebGL.
              <br />
              Your browser or GPU has it switched off.
            </p>
          </div>
        ) : null}

        {usable && !visible ? (
          <div className="absolute inset-0 grid place-items-center">
            <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-lime" />
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-hairline bg-black/40 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground backdrop-blur">
          avatar.glb
        </div>
      </div>

      {controls && usable ? (
        <div
          className="flex max-w-[22rem] flex-wrap items-center justify-center gap-1.5 sm:max-w-sm"
          role="group"
          aria-label="Avatar animation"
        >
          <button
            type="button"
            onClick={() => setAutoplay((value) => !value)}
            aria-pressed={autoplay}
            title={autoplay ? 'Stop cycling through animations' : 'Cycle through animations'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-all',
              autoplay
                ? 'border-lime/50 bg-lime/12 text-lime'
                : 'border-hairline text-muted-foreground hover:border-lime/30 hover:text-foreground',
            )}
          >
            {autoplay ? <Pause className="size-3" /> : <Play className="size-3" />}
            Auto
          </button>

          {AVATAR_CLIPS.map((item) => (
            <button
              key={item.track}
              type="button"
              onClick={() => selectClip(item.track)}
              aria-pressed={clip === item.track}
              className={cn(
                'rounded-full border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-all',
                clip === item.track
                  ? 'border-lime/50 bg-lime/12 text-lime'
                  : 'border-hairline text-muted-foreground hover:border-lime/30 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
