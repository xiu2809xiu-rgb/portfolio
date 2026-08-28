'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { projects } from '@/content/projects';
import { cn } from '@/lib/utils';

/**
 * Scroll-driven work reveal, in three phases inside one pinned viewport.
 *
 *   0.00 → 0.30   a pill-shaped hole in a lime field opens until it fills the screen
 *   0.22 → 0.55   the word WORK, stacked vertically, multiplies sideways
 *   0.52 → 1.00   the letter field parallaxes left while the projects track through
 *
 * The phases deliberately overlap: the letters start spreading before the hole
 * has finished opening, so the transitions read as one continuous move rather
 * than three cuts.
 *
 * The mask is a `clip-path: inset(… round …)` on the dark layer rather than a
 * scaled element — scaling would blur the edge and drag the grid behind it,
 * whereas insetting redraws the aperture crisply at every frame and composites
 * on the GPU.
 */

const LETTERS = ['W', 'O', 'R', 'K'] as const;
/** Copies per letter, centred on zero, e.g. -6 … +6. */
const COPIES = 13;

export function WorkPortal() {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  /*
    Every reel runs at once, which is the point of the section — but only while
    the section is anywhere near the viewport. Three decoders left running at the
    bottom of the page is a battery cost with nothing on screen to justify it.
  */
  const inView = useInView(hostRef, { margin: '30% 0px 30% 0px' });

  const { scrollYProgress } = useScroll({
    target: hostRef,
    offset: ['start start', 'end end'],
  });

  // ── Phase A: the aperture ────────────────────────────────────────────────
  // Vertical inset shrinks faster than horizontal, so the pill grows into a
  // portrait slot before it becomes the full frame — the reference's shape.
  const insetY = useTransform(scrollYProgress, [0, 0.3, 1], ['8vh', '0vh', '0vh']);
  const insetX = useTransform(scrollYProgress, [0, 0.3, 1], ['42vw', '0vw', '0vw']);
  const radius = useTransform(scrollYProgress, [0, 0.3, 1], ['22vw', '0vw', '0vw']);
  const clipPath = useTransform(
    [insetY, insetX, radius] as MotionValue<string>[],
    ([y, x, r]: string[]) => `inset(${y} ${x} ${y} ${x} round ${r})`,
  );

  /*
    The lime field falls away once the hole has swallowed it.

    Every range below is written to span the full 0 → 1 of the scroll, holding
    its end value rather than stopping at the last interesting stop. That is not
    style. A transform that reads scroll progress directly gets handed to the
    compositor as a scroll-timeline animation, and WAAPI synthesises an implicit
    keyframe at any uncovered end — taking the value back to the element's
    underlying style. A fade written as [0.26, 0.34] → [1, 0] therefore drops to
    zero on cue and then climbs back to 1 across the rest of the section, which
    is exactly the lime field reappearing over the project cards. Stating the
    endpoints explicitly leaves nothing for the browser to infer.
  */
  const fieldOpacity = useTransform(scrollYProgress, [0, 0.26, 0.34, 1], [1, 1, 0, 0]);

  // ── Phase B: the letters ─────────────────────────────────────────────────
  const spread = useTransform(scrollYProgress, [0.22, 0.55, 1], [0, 1, 1]);
  const letterScale = useTransform(scrollYProgress, [0, 0.22, 0.55, 1], [0.42, 0.58, 1.18, 1.18]);
  const lettersX = useTransform(scrollYProgress, [0, 0.52, 1], ['0%', '0%', '-22%']);
  const lettersFade = useTransform(scrollYProgress, [0, 0.52, 0.66, 1], [1, 1, 0.08, 0.08]);

  // ── Phase C: the track ───────────────────────────────────────────────────
  /*
    The track is driven in pixels rather than percentages. A percentage on `x`
    resolves against the track's own width, so the distance the cards travel
    would change with the number of cards and with the breakpoint — the last
    card would either stop short or fly off past the left edge. Measuring gives
    the exact travel: start one viewport off to the right, end with the final
    card resting at the left.
  */
  const trackX = useMotionValue(0);
  const travel = useRef({ start: 0, end: 0 });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    travel.current = { start: vw, end: -Math.max(el.scrollWidth - vw, 0) };
  }, []);

  const apply = useCallback(
    (value: number) => {
      const p = Math.min(Math.max((value - 0.52) / 0.48, 0), 1);
      const { start, end } = travel.current;
      trackX.set(start + (end - start) * p);
    },
    [trackX],
  );

  useEffect(() => {
    if (reduced) return;
    measure();
    apply(scrollYProgress.get());

    const observer = new ResizeObserver(() => {
      measure();
      apply(scrollYProgress.get());
    });
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [apply, measure, reduced, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, 'change', apply);

  /*
    Reduced motion gets the same content as an ordinary grid. The whole point of
    the section is the movement, so there is nothing to preserve by animating it
    slowly — a static, readable list is the honest equivalent.
  */
  if (reduced) {
    return (
      <section id="work" ref={hostRef} className="scroll-mt-24 py-20 md:py-28">
        <div className="wrap">
          <p className="eyebrow">03 — Work</p>
          <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Work
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <li key={project.slug}>
                <ProjectCard project={project} index={index} playing={false} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      id="work"
      ref={hostRef}
      className="relative scroll-mt-24"
      // Four screens of scroll: roughly one per phase, plus one for the track.
      style={{ height: '420vh' }}
      aria-label="Work"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05070a]">
        {/* ── The lime field, with its grid ── */}
        <motion.div
          aria-hidden
          style={{ opacity: fieldOpacity }}
          className="absolute inset-0 bg-lime"
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(#05070a 1px, transparent 1px), linear-gradient(90deg, #05070a 1px, transparent 1px)',
              backgroundSize: '9.09% 11.11%',
            }}
          />
          <p className="absolute inset-x-0 bottom-8 text-center font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[#05070a]">
            Scroll to enter
          </p>
        </motion.div>

        {/* ── The aperture: everything below is seen through the hole ── */}
        <motion.div style={{ clipPath }} className="absolute inset-0 bg-[#05070a]">
          {/* Dotted texture, matching the reference's interior */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(#b4ff39 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />

          {/* Letters */}
          <motion.div
            aria-hidden
            style={{ x: lettersX, opacity: lettersFade }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div style={{ scale: letterScale }} className="flex flex-col items-center">
              {LETTERS.map((letter, row) => (
                <LetterRow key={letter} letter={letter} row={row} spread={spread} />
              ))}
            </motion.div>
          </motion.div>

          {/* Project track */}
          <motion.ul
            ref={trackRef}
            style={{ x: trackX }}
            className="absolute inset-y-0 left-0 flex w-max items-center gap-6 pl-[8vw] pr-[14vw]"
          >
            {projects.map((project, index) => (
              <li key={project.slug} className="w-[min(78vw,30rem)] shrink-0">
                <ProjectCard project={project} index={index} playing={inView} />
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Progress rail, so the pinned section reads as finite */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-lime to-aqua"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </section>
  );
}

/**
 * One letter, repeated across the width.
 *
 * Copies fan out from the centre as `spread` goes 0 → 1. The vertical stretch is
 * what turns four ordinary glyphs into the tall, condensed slab the reference
 * uses.
 */
function LetterRow({
  letter,
  row,
  spread,
}: {
  letter: string;
  row: number;
  spread: MotionValue<number>;
}) {
  const half = Math.floor(COPIES / 2);

  return (
    <div className="relative flex h-[15vh] items-center sm:h-[17vh]">
      {Array.from({ length: COPIES }, (_, i) => {
        const offset = i - half;
        return (
          <Copy
            key={i}
            letter={letter}
            offset={offset}
            row={row}
            spread={spread}
            isCentre={offset === 0}
          />
        );
      })}
    </div>
  );
}

function Copy({
  letter,
  offset,
  row,
  spread,
  isCentre,
}: {
  letter: string;
  offset: number;
  row: number;
  spread: MotionValue<number>;
  isCentre: boolean;
}) {
  // Each row fans at a slightly different rate, which keeps the field from
  // looking like a single rigid grid sliding apart.
  const rate = 8.4 + row * 0.6;
  const x = useTransform(spread, (value) => `${offset * value * rate}vw`);
  // Outer copies arrive late and stay dimmer, so the centre letter still reads.
  const opacity = useTransform(spread, [0, 0.35, 1], [isCentre ? 1 : 0, isCentre ? 1 : 0.55, 1]);

  return (
    <motion.span
      style={{ x, opacity }}
      className="absolute left-1/2 -translate-x-1/2 select-none font-heading font-black leading-none text-lime"
    >
      {/*
        Stretched vertically and squeezed horizontally. The reference's letters
        are a condensed slab; Outfit on its own is too wide to read that way, and
        a transform is cheaper than shipping a second display face.
      */}
      <span className="block origin-center scale-x-[0.8] scale-y-[1.3] text-[12vh] sm:text-[14vh]">
        {letter}
      </span>
    </motion.span>
  );
}

/**
 * The card's moving image.
 *
 * Reels are silent, looping, and all run together while the section is on
 * screen. The first screenshot is the poster, so the card is never blank while
 * the file loads and the fallback is a real frame rather than a grey box.
 */
function ProjectPreview({
  src,
  poster,
  alt,
  playing,
}: {
  src: string;
  poster?: string;
  alt: string;
  playing: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) {
      /*
        A rejected play() is normal — a browser can refuse before any user
        gesture, and a muted video is usually but not always exempt. The poster
        stays up, which is a reasonable still fallback.
      */
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

  if (failed && poster) {
    return (
      <Image
        src={poster}
        alt={alt}
        fill
        sizes="(max-width: 768px) 78vw, 30rem"
        className="object-cover object-top"
      />
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      onError={() => setFailed(true)}
      className="absolute inset-0 size-full object-cover object-top"
    />
  );
}

function ProjectCard({
  project,
  index,
  playing,
}: {
  project: (typeof projects)[number];
  index: number;
  playing: boolean;
}) {
  const shot = project.screenshots[0];

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block overflow-hidden rounded-2xl border border-lime/25 bg-[#0b0e13] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] transition-colors hover:border-lime/60"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black">
        {project.preview ? (
          <ProjectPreview
            src={project.preview}
            poster={shot?.src}
            alt={`${project.title} ${project.titleAccent} preview`}
            playing={playing}
          />
        ) : shot ? (
          <Image
            src={shot.src}
            alt={`${project.title} ${project.titleAccent}`}
            fill
            sizes="(max-width: 768px) 78vw, 30rem"
            className="object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          /*
            No imagery yet. The card footer already carries the title, so the
            frame shows what the footer cannot — the index as a numeral and the
            stack — rather than printing the same words twice.
          */
          <div className="flex size-full flex-col justify-between bg-[radial-gradient(ellipse_at_30%_20%,rgba(180,255,57,0.12),transparent_60%)] p-6">
            <span className="font-heading text-6xl font-black leading-none text-lime/20">
              {project.index}
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.slice(0, 5).map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-lime/20 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-muted-foreground"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.award ? (
          <span className="absolute left-3 top-3 rounded-full bg-lime px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-black">
            {project.award}
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            <span className="text-lime">
              {project.index ?? String(index + 1).padStart(2, '0')}
            </span>
            {project.role}
          </p>
          <h3 className="mt-1.5 truncate font-heading text-lg font-bold tracking-tight">
            {project.title} <span className="text-lime">{project.titleAccent}</span>
          </h3>
        </div>
        <ArrowUpRight
          className={cn(
            'mt-1 size-5 shrink-0 text-muted-foreground transition-all',
            'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime',
          )}
        />
      </div>
    </Link>
  );
}
