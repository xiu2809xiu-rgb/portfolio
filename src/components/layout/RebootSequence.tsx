'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { BrandParticleText } from '@/components/common/BrandParticleText';
import { profile } from '@/content/profile';
import { rebootSteps } from '@/content/reboot';
import { soundEngine } from '@/lib/audio/SoundEngine';

interface RebootSequenceProps {
  open: boolean;
  onClose: () => void;
  /** Interface sounds are on, so the sequence may play its own tones. */
  soundEnabled: boolean;
}

/**
 * Full-screen "reboot", triggered by clicking the wordmark.
 *
 * Deliberately not a loading screen — the page is already loaded, and pretending
 * otherwise is the thing that makes fake progress bars insulting. It is a toy
 * you opt into, so it earns its time by being honest and interactive:
 *
 *  · every figure that streams past is a real measurement from this build
 *  · the wordmark is live particles that scatter under the cursor
 *  · clicking anywhere, or pressing Escape, ends it immediately
 *
 * Reduced-motion visitors get a plain fade with the same content, no particles
 * and no per-step delay.
 *
 * The caller remounts this with a changing `key` on each run, so step state
 * starts fresh without needing to be reset on close.
 */
export function RebootSequence({ open, onClose, soundEnabled }: RebootSequenceProps) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /*
    Held in a ref so the scheduling effect does not depend on its identity.
    `onClose` is an inline arrow in the parent, so it is a new function on every
    parent render — and the header re-renders on scroll and on scrollspy
    changes. With it in the dependency array the whole sequence was being torn
    down and rescheduled mid-run, which ended it early.
  */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }

    // Reduced motion: the finished state is derived below, so this only has to
    // hold it on screen briefly before leaving.
    if (reduced) {
      timers.current.push(setTimeout(() => onCloseRef.current(), 900));
      return clearTimers;
    }

    let elapsed = 220;
    rebootSteps.forEach((entry, index) => {
      const timer = setTimeout(() => {
        setStep(index);
        if (soundEnabled) {
          soundEngine.play(index === rebootSteps.length - 1 ? 'success' : 'hover');
        }
      }, elapsed);
      timers.current.push(timer);
      elapsed += entry.ms;
    });

    // A beat on the final line before the curtain lifts.
    const exit = setTimeout(() => onCloseRef.current(), elapsed + 620);
    timers.current.push(exit);

    return clearTimers;
  }, [open, reduced, soundEnabled, clearTimers]);

  // Escape always exits.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Hold the page still behind the overlay.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Derived rather than assigned in the effect: with reduced motion every line
  // is simply already complete, which is a property of the render, not state.
  const effectiveStep = reduced ? rebootSteps.length - 1 : step;
  const progress = effectiveStep < 0 ? 0 : (effectiveStep + 1) / rebootSteps.length;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="reboot"
          role="dialog"
          aria-modal="true"
          aria-label="Rebuilding the site"
          onClick={onClose}
          className="fixed inset-0 z-[400] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#05070a]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.28 } }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
        >
          {/* Ambient wash so the black is not flat. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(180,255,57,0.10),transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(57,255,216,0.07),transparent_55%)]"
          />

          {/* Scanline sweep — one pass, top to bottom, as the steps run. */}
          {!reduced ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2.6, ease: 'linear', repeat: Infinity }}
            />
          ) : null}

          <div className="relative flex w-full max-w-2xl flex-col items-center px-6">
            <p className="eyebrow mb-6">~/{profile.shortName.toLowerCase()} · rebuild</p>

            {/* Live particle wordmark — drag through it. */}
            <div className="h-[110px] w-full sm:h-[150px]">
              <BrandParticleText
                text="richie koh"
                /*
                  Denser than the avatar's wordmark: autoFit gives this instance a
                  much larger glyph, and the same sampling stride leaves the
                  strokes too sparse to read at that size.
                */
                particleSize={2}
                particleGap={1}
                radius={150}
                strength={4}
                className="h-full"
                fallback={
                  <p className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
                    Richie Koh<span className="text-lime">.</span>
                  </p>
                }
              />
            </div>

            {/* Progress rail */}
            <div className="mt-6 h-px w-full max-w-md overflow-hidden bg-white/10">
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-lime to-aqua"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Streaming log */}
            <ul className="mt-7 w-full max-w-md space-y-1.5 font-mono text-[0.7rem] sm:text-xs">
              {rebootSteps.map((entry, index) => {
                const done = index <= effectiveStep;
                return (
                  <motion.li
                    key={entry.label}
                    className="flex items-baseline gap-2"
                    animate={{ opacity: done ? 1 : 0.18 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className="w-3 shrink-0 text-lime">
                      {done ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                      {entry.label}
                    </span>
                    <span className="mx-1 min-w-0 flex-1 self-center border-b border-dashed border-white/10" />
                    <span className="shrink-0 text-muted-foreground">{entry.detail}</span>
                  </motion.li>
                );
              })}
            </ul>

            <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              Click anywhere to skip
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
