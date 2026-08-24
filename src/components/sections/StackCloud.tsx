'use client';

import dynamic from 'next/dynamic';
import type { ParallaxPillItem } from '@/components/react-bits/parallax-pills';

const ParallaxPills = dynamic(() => import('@/components/react-bits/parallax-pills'), {
  ssr: false,
  loading: () => <div className="h-[22rem] sm:h-[26rem]" />,
});

const INK = '#05070a';
const LIME = '#b4ff39';
const AQUA = '#39ffd8';
const SURFACE = '#12161d';
const TEXT = '#e9ecef';

/**
 * Positions and widths are percentages of the container, so the arrangement
 * scales rather than reflowing.
 *
 * Widths are hand-fitted to each label: the component left-aligns text inside
 * the pill, so an over-wide pill leaves an obvious empty tail. Roughly
 * `chars × 0.9% + 4%` at the 15px label size.
 */
const PILLS: ParallaxPillItem[] = [
  { label: 'Python', background: LIME, color: INK, x: 24, y: 16, width: 10, rotate: -4, parallax: 1.2 },
  { label: 'Flask', background: SURFACE, color: TEXT, x: 55, y: 13, width: 9, rotate: 3, parallax: 0.8 },
  { label: 'TypeScript', background: SURFACE, color: TEXT, x: 82, y: 22, width: 14, rotate: -2, parallax: 1.4 },
  { label: 'React', background: AQUA, color: INK, x: 15, y: 42, width: 9, rotate: 2, parallax: 0.6 },
  { label: 'Next.js', background: SURFACE, color: TEXT, x: 44, y: 39, width: 11, rotate: -3, parallax: 1.1 },
  { label: 'PostgreSQL', background: SURFACE, color: TEXT, x: 76, y: 50, width: 15, rotate: 4, parallax: 0.9 },
  { label: 'SQLAlchemy', background: SURFACE, color: TEXT, x: 22, y: 68, width: 15, rotate: -2, parallax: 1.3 },
  { label: 'Tailwind', background: LIME, color: INK, x: 56, y: 65, width: 12, rotate: 3, parallax: 0.7 },
  { label: 'Three.js', background: SURFACE, color: TEXT, x: 85, y: 78, width: 12, rotate: -4, parallax: 1.5 },
  { label: 'Figma', background: SURFACE, color: TEXT, x: 38, y: 88, width: 9, rotate: 2, parallax: 1.0 },
];

/** Faint pills behind the real ones, for depth. */
const BACKGROUND_PILLS = [
  { background: 'rgba(180,255,57,0.06)', x: 6, y: 30, width: 20, rotate: 0 },
  { background: 'rgba(57,255,216,0.05)', x: 96, y: 38, width: 18, rotate: 0 },
  { background: 'rgba(255,255,255,0.035)', x: 10, y: 84, width: 22, rotate: 0 },
  { background: 'rgba(255,255,255,0.035)', x: 94, y: 12, width: 18, rotate: 0 },
];

/**
 * Drifting cloud of the tools in daily use.
 *
 * Decorative — the same list is announced semantically in the Skills section, so
 * this is hidden from assistive tech rather than read out as scattered nouns.
 */
export function StackCloud() {
  return (
    <section className="relative overflow-hidden py-8" aria-hidden="true">
      <ParallaxPills
        pills={PILLS}
        backgroundPills={BACKGROUND_PILLS}
        width="100%"
        height="26rem"
        pillRadius={999}
        pillHeight={46}
        fontSize={15}
        fontWeight={600}
        parallaxStrength={0.55}
        entryStagger={0.045}
        className="mx-auto max-w-5xl"
      />
    </section>
  );
}
