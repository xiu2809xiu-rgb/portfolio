'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HoloCard, HoloLayer } from '@/components/common/HoloCard';

/**
 * The 1st-place card.
 *
 * A holo is the rare pull — that is the entire meaning of the finish — so
 * exactly one thing on this page gets one, and it is the only thing here that
 * came first. Printing the whole achievement list as foil would say nothing;
 * one foil card among plain entries says which one mattered.
 *
 * Every figure on it comes from the same résumé data the list beside it renders,
 * so there is nothing here that is true only on the card.
 */

const ART = '/img/work/smartrecap/app.jpg';

/*
  3D depth of each plane, in pixels above the base.

  The order matters more than the numbers. The diffraction foil sits *under* the
  lettering, not over it — which is both how a real card is made and what the
  source project means by keeping text and frame above the foreground. Running
  the rainbow across the type was the first thing I tried and it cost most of
  the card's legibility. Only the specular gloss goes over everything, because a
  gloss lies on the surface and a card without one looks like paper.
*/
const DEPTH = { art: 16, foil: 22, type: 30, gloss: 38 } as const;

/*
  Card geometry, as percentages of the card's own box.

  The art window and the lettering live on different layers, so they cannot be
  laid out by one flow — and the first version had the type layer reserve space
  with a spacer of its own, which drifted about 36px out of step with the window
  and dropped the set line on top of the artwork. Both layers are positioned
  from this one table instead, so they cannot disagree.

  artBottom is not a free choice: at 86% width on a 5:7 card, a 16:9 window is
  34.5% of the height, which puts its lower edge at 56%.
*/
const BOX = {
  inset: 'inset-x-[7%]',
  headTop: 'top-[6.5%]',
  artTop: 'top-[21.5%]',
  artBottom: 'bottom-[44%]',
  bodyTop: 'top-[58.5%]',
  bodyBottom: 'bottom-[6%]',
} as const;

const ART_BOX = `absolute ${BOX.inset} ${BOX.artTop} ${BOX.artBottom}`;
const HEAD_BOX = `absolute ${BOX.inset} ${BOX.headTop}`;
const BODY_BOX = `absolute ${BOX.inset} ${BOX.bodyTop} ${BOX.bodyBottom}`;

export function AwardCard() {
  return (
    <HoloCard
      className="mx-auto w-full max-w-[22rem]"
      flipLabel="Turn it over"
      front={<Front />}
      back={<Back />}
    />
  );
}

/** Shared shell so both faces are the same object at the same size. */
function Face({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[5/7] w-full [transform-style:preserve-3d]">{children}</div>
  );
}

function Front() {
  return (
    <Face>
      {/* ── Base plate ── */}
      <HoloLayer className="absolute inset-0">
        <div className="holo-rim size-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0b1005]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(180,255,57,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_20%_100%,rgba(57,255,216,0.16),transparent_65%)]" />
          {/* Guilloche, of a sort: fine diagonal ruling is what makes a printed
              card read as printed rather than as a rectangle of CSS. */}
          <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(58deg,transparent_0_3px,rgba(255,255,255,0.5)_3px_4px)]" />
        </div>
      </HoloLayer>

      {/* ── Art ── */}
      <HoloLayer depth={DEPTH.art} className="absolute inset-0">
        <div className={`${ART_BOX} overflow-hidden rounded-lg border border-white/15 bg-black`}>
          <Image
            src={ART}
            alt="The SmartRecap application"
            fill
            sizes="352px"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
      </HoloLayer>

      {/* ── Foil ── Above the art, below the lettering. */}
      <HoloLayer depth={DEPTH.foil} className="absolute inset-0">
        <div className="holo-foil size-full rounded-[1.6rem]" />
      </HoloLayer>

      {/* ── Type and frame ── */}
      <HoloLayer depth={DEPTH.type} className="absolute inset-0">
        <div className={`${HEAD_BOX} flex items-start justify-between gap-2`}>
          <div>
            <p className="font-mono text-[0.52rem] font-bold uppercase tracking-[0.24em] text-lime">
              1st place
            </p>
            <h3 className="mt-1 font-heading text-[1.6rem] font-black leading-none tracking-tight text-white">
              SmartRecap
            </h3>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full border border-lime/40 bg-lime/10 px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-[0.14em] text-lime">
            Holo
          </span>
        </div>

        <div className={`${BODY_BOX} flex flex-col`}>
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-white/45">
            Nanyang Polytechnic × AWS · 2026
          </p>

          {/* flex-1 rather than a footer pushed down with mt-auto: the leftover
              height belongs between the rows, not below them. */}
          <dl className="flex flex-1 flex-col justify-center gap-[5%]">
            <Move
              name="Frontend, in full"
              cost="25 components"
              body="Every page component in the product, built in a single overnight sitting."
            />
            <Move
              name="Team Stay Grounded"
              cost="PS1"
              body="Problem Statement 1 — Automated Class Recap Generator."
            />
          </dl>

          <div className="flex items-end justify-between border-t border-white/10 pt-[4%] font-mono text-[0.47rem] uppercase tracking-[0.16em] text-white/35">
            <span>Holo · 001/001</span>
            <span>Illus. Richie Koh</span>
          </div>
        </div>
      </HoloLayer>

      {/* ── Gloss ── */}
      <HoloLayer depth={DEPTH.gloss} className="absolute inset-0">
        <div className="holo-gloss size-full rounded-[1.6rem]" />
      </HoloLayer>
    </Face>
  );
}

/** One row of the card's stat block. Named for what it is imitating. */
function Move({ name, cost, body }: { name: string; cost: string; body: string }) {
  return (
    <div className="border-t border-white/10 pt-[3%]">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="font-heading text-[0.82rem] font-bold tracking-tight text-white">{name}</dt>
        <span className="shrink-0 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-aqua">
          {cost}
        </span>
      </div>
      <dd className="mt-0.5 text-[0.66rem] leading-snug text-white/55">{body}</dd>
    </div>
  );
}

function Back() {
  return (
    <Face>
      <HoloLayer className="absolute inset-0">
        <div className="holo-rim size-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#05080d]">
          <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_50%,rgba(57,255,216,0.2),transparent_70%)]" />
          {/* The radiating ruling every card back has had since the 1990s. */}
          <div className="absolute inset-0 opacity-[0.09] bg-[repeating-conic-gradient(from_0deg_at_50%_45%,transparent_0deg_4deg,rgba(255,255,255,0.5)_4deg_8deg)]" />
        </div>
      </HoloLayer>

      <HoloLayer depth={DEPTH.foil} className="absolute inset-0">
        <div className="holo-foil size-full rounded-[1.6rem]" />
      </HoloLayer>

      <HoloLayer depth={DEPTH.type} className="absolute inset-0">
        <div className="relative flex size-full flex-col items-center justify-center p-[9%] text-center">
          <div className="grid size-20 rotate-45 place-items-center rounded-2xl border-2 border-lime/50 bg-black/40">
            <span className="-rotate-45 font-heading text-2xl font-black tracking-tight text-lime">
              RK
            </span>
          </div>

          <p className="mt-6 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/50">
            richiekoh.dev
          </p>
          <p className="mt-4 text-[0.72rem] leading-relaxed text-white/60">
            The full write-up — what the problem was, what I built, and what it cost.
          </p>

          <Link
            href="/work/smartrecap"
            className="mt-5 rounded-full bg-lime px-5 py-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5"
          >
            Read the case study
          </Link>

          <p className="absolute inset-x-0 bottom-[8%] font-mono text-[0.45rem] uppercase tracking-[0.16em] text-white/25">
            Not a real trading card
          </p>
        </div>
      </HoloLayer>

      <HoloLayer depth={DEPTH.gloss} className="absolute inset-0">
        <div className="holo-gloss size-full rounded-[1.6rem]" />
      </HoloLayer>
    </Face>
  );
}
