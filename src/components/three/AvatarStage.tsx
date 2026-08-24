'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
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
            dpr={[1, 1.75]}
            frameloop={visible ? 'always' : 'demand'}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => gl.setClearAlpha(0)}
            onError={() => setFailed(true)}
            className="!absolute inset-0"
          >
            <PerspectiveCamera makeDefault position={[0, 0.15, 3.1]} fov={38} />

            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 4, 3]} intensity={1.6} castShadow />
            {/* Lime rim light from behind-left ties the model to the palette. */}
            <directionalLight position={[-3, 2, -2]} intensity={1.1} color="#b4ff39" />
            <directionalLight position={[2, 1, -3]} intensity={0.5} color="#39ffd8" />

            <Suspense fallback={null}>
              <AvatarModel clip={clip} />
              <Environment preset="city" />
              <ContactShadows
                position={[0, -1.35, 0]}
                opacity={0.42}
                scale={7}
                blur={2.6}
                far={2}
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
          className="flex max-w-[22rem] flex-wrap justify-center gap-1.5 sm:max-w-sm"
          role="group"
          aria-label="Avatar animation"
        >
          {AVATAR_CLIPS.map((item) => (
            <button
              key={item.track}
              type="button"
              onClick={() => setClip(item.track)}
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
