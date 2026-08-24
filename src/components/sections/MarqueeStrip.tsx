'use client';

import dynamic from 'next/dynamic';
import { marqueeTerms } from '@/content/profile';

const BendingMarquee = dynamic(() => import('@/components/react-bits/bending-marquee'), {
  ssr: false,
  loading: () => <div className="h-24 border-y border-hairline" />,
});

/**
 * Curved tech marquee between the hero and the first section.
 *
 * Purely decorative — the same list is announced properly in the Skills section,
 * so this is hidden from assistive tech rather than read as a wall of nouns.
 */
export function MarqueeStrip() {
  return (
    <div
      className="relative border-y border-hairline bg-white/[0.015] py-2"
      aria-hidden="true"
    >
      <BendingMarquee
        items={[...marqueeTerms]}
        separator="✦"
        speed={0.55}
        bend={14}
        rows={1}
        fontSize={26}
        fontWeight={700}
        letterSpacing={2}
        color="#e9ecef"
        bandColor="transparent"
        panelHeight={92}
        pauseOnHover
        fit
      />
    </div>
  );
}
