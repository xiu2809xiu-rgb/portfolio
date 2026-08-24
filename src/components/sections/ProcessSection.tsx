'use client';

import dynamic from 'next/dynamic';
import { SectionHeading } from '@/components/common/SectionHeading';
import { processSteps } from '@/content/resume';

const ScrollStack = dynamic(
  () => import('@/components/react-bits/scroll-stack').then((mod) => mod.ScrollStack),
  {
    ssr: false,
    // Reserve roughly the collapsed height so the page does not jump on load.
    loading: () => <div className="h-[70vh]" />,
  },
);

/**
 * Design Thinking, as a sticky card stack you scroll through.
 *
 * The five steps are inherently sequential, which is what ScrollStack is good at —
 * each card pins, then gives way to the next. Custom children rather than the
 * component's `items` prop: its built-in card face bottom-aligns short copy and
 * leaves most of the card empty, which read as a bug rather than a layout.
 */
export function ProcessSection() {
  return (
    <section id="process" className="scroll-mt-24 pt-20 md:pt-28">
      <div className="wrap">
        <SectionHeading
          index="05"
          title="How I work"
          description="Every project follows a structured Design Thinking loop — so what gets built is what people actually needed, not just what was easy to specify."
        />
      </div>

      <ScrollStack
        variant="stack"
        scrollLength={0.75}
        peek={26}
        scaleStep={0.045}
        blur={2}
        dim={0.25}
        cardWidth={860}
        cardHeight={0.52}
        borderRadius={24}
        perspective={1600}
        showProgress
        showCounter
      >
        {processSteps.map((step) => (
          <article
            key={step.index}
            className="flex size-full flex-col justify-between overflow-hidden rounded-3xl border border-hairline bg-[#0b0e13] p-8 sm:p-12"
          >
            <header className="flex items-start justify-between gap-6">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-lime">
                Step {step.index}
              </span>
              <span className="text-4xl sm:text-5xl" aria-hidden>
                {step.icon}
              </span>
            </header>

            <div>
              <h3 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
                {step.title}
              </h3>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {step.body}
              </p>
            </div>

            {/* Progress rail: fills as the steps advance. */}
            <div className="flex items-center gap-1.5" aria-hidden>
              {processSteps.map((other) => (
                <span
                  key={other.index}
                  className={
                    other.index <= step.index
                      ? 'h-0.5 w-8 rounded-full bg-lime'
                      : 'h-0.5 w-8 rounded-full bg-white/12'
                  }
                />
              ))}
            </div>
          </article>
        ))}
      </ScrollStack>
    </section>
  );
}
