'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import BlurHighlight from '@/components/react-bits/blur-highlight';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { profile } from '@/content/profile';

const PixelReveal = dynamic(() => import('@/components/react-bits/pixel-reveal'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/5] w-full animate-pulse rounded-2xl border border-hairline bg-white/[0.03]" />
  ),
});

/**
 * Phrases BlurHighlight brings into focus as the copy scrolls in.
 *
 * These must match strings that exist verbatim in `profile.bio` — a phrase that
 * is not present simply never highlights, so they are updated together.
 */
const HIGHLIGHTS = [
  'the interface, the API behind it, and the research',
  'Full-Stack Development and Digital UX Design',
  'Five of them were blocked by a map popup',
  'first place at the NYP × AWS Hackathon 2026',
  '2027 software engineering internship',
];

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading index="01" title="About" />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          <Reveal>
            <div className="relative">
              <PixelReveal
                imageSrc={profile.photo}
                width="100%"
                height="auto"
                gridSize={26}
                transitionColor="#b4ff39"
                duration={1.1}
                direction="up"
                autoTrigger
                triggerOnce
                borderRadius={16}
                className="w-full"
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-black/60 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest backdrop-blur">
                <MapPin className="size-3 text-lime" />
                {profile.location}
              </span>
            </div>
          </Reveal>

          <div>
            <Reveal delay={0.1}>
              <BlurHighlight
                highlightedBits={HIGHLIGHTS}
                highlightColor="rgba(180,255,57,0.22)"
                blurAmount={3}
                inactiveOpacity={0.45}
                className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {profile.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </BlurHighlight>
            </Reveal>

            <Reveal delay={0.25}>
              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-hairline pt-7 sm:grid-cols-4">
                {profile.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="eyebrow">{fact.label}</dt>
                    <dd className="mt-1.5 text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-8">
                <p className="eyebrow mb-3">Currently exploring</p>
                <ul className="flex flex-wrap gap-2">
                  {profile.exploring.map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full border border-aqua/25 bg-aqua/[0.06] px-3 py-1.5 font-mono text-[0.68rem] text-aqua"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
