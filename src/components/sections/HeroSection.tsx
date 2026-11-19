'use client';

import dynamic from 'next/dynamic';
import { Link } from '@/i18n/Link';
import { ArrowRight, ArrowUpRight, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { InViewMount } from '@/components/common/InViewMount';
import StaggeredText from '@/components/react-bits/staggered-text';
import { profileContent } from '@/content/localized/profile';
import type { Locale } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';
import { homeDict } from '@/i18n/dictionaries/home';
import { useLocale, useT } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import { RotatingWord } from './RotatingWord';

/* Both are WebGL-heavy and useless during SSR, so they load on the client only. */
const AuroraBeam = dynamic(() => import('@/components/react-bits/aurora-beam'), {
  ssr: false,
});

const AvatarStage = dynamic(
  () => import('@/components/three/AvatarStage').then((mod) => mod.AvatarStage),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[3/4] w-full max-w-[22rem] animate-pulse rounded-3xl border border-hairline bg-white/[0.03] sm:max-w-sm" />
    ),
  },
);

interface HeroSetting {
  /** Size, leading and tracking of the headline. */
  headline: string;
  /** How StaggeredText cuts each line into pieces for the entrance. */
  segmentBy: 'words' | 'chars';
  /** Added to each headline line. */
  line: string;
  /** The element that sets the hackathon apart in the sentence under the headline. */
  accent: string;
}

/*
  Where the two languages cannot share the hero's type.

  Chinese runs a size smaller with more leading. Every character fills its whole
  square, so at the English size a line overruns the column beside the avatar —
  and, cut a character at a time, the overflow can strand a comma on a line of
  its own — while at 0.95 the lines touch.

  It enters a character at a time, having no spaces to split on, and its lines
  are put back into ordinary text flow: StaggeredText lays a single line out as
  a flex row, which would make every character a block of its own, read aloud
  one at a time and copied one per line.

  Its accent is colour alone. Chinese has no italic, and a Song face dropped into
  a sans sentence reads as a font that failed to load rather than as emphasis.
*/
const SETTING: Record<Locale, HeroSetting> = {
  en: {
    headline: 'text-[clamp(2.5rem,9vw,5.5rem)] leading-[0.95] tracking-[-0.03em]',
    segmentBy: 'words',
    line: '',
    accent: 'font-serif text-foreground',
  },
  zh: {
    headline: 'text-[clamp(2.25rem,7.5vw,4.25rem)] leading-[1.15]',
    segmentBy: 'chars',
    line: 'block!',
    accent: 'not-italic text-foreground',
  },
};

/*
  StaggeredText's `delay` for each line, first to last. It reads the value as
  milliseconds between pieces, not as a start time — so these do not cascade the
  lines, and every piece of a line arrives together in either language.
*/
const LINE_DELAYS = [0.25, 0.4, 0.55];

/** The treatment `homeDict.hero.headline` describes: plain, outlined, then the gradient. */
function lineTone(index: number, count: number): string {
  if (index === count - 1) return 'block text-gradient-lime';
  return index === 0 ? 'block' : 'text-stroke block';
}

export function HeroSection() {
  const setting = SETTING[useLocale()];
  const t = useT(homeDict).hero;
  const { bookSession } = useT(commonDict).header;
  const { profile, heroRotation } = useT(profileContent);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 md:pt-28"
    >
      <div className="absolute inset-0 -z-10">
        {/* Unmounts once the hero scrolls away, freeing its WebGL context. */}
        <InViewMount rootMargin="200px">
          <AuroraBeam
            color="#b4ff39"
            midColor="#39ffd8"
            deepColor="#0b1f14"
            backgroundColor="#05070a"
            speed={0.35}
            sheets={3}
            amplitude={0.5}
            opacity={0.55}
            grain={0.06}
            adaptiveQuality
            targetFps={45}
            className="size-full"
          />
        </InViewMount>
        {/* Keeps the headline readable wherever the aurora happens to be bright. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/40 via-[#05070a]/55 to-[#05070a]" />
      </div>

      <div className="wrap grid w-full items-center gap-12 pb-20 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="eyebrow mb-6 flex items-center gap-2"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
            </span>
            {profile.role} · {profile.location}
          </motion.p>

          <h1 className={`font-heading font-extrabold ${setting.headline}`}>
            {t.headline.map((line, index) => (
              <StaggeredText
                key={line}
                text={line}
                as="span"
                className={cn(lineTone(index, t.headline.length), setting.line)}
                segmentBy={setting.segmentBy}
                delay={LINE_DELAYS[index]}
                duration={0.8}
                direction="bottom"
                blur
              />
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t.intro(<RotatingWord words={heroRotation} className="text-lime" />, (text) => (
              <em className={setting.accent}>{text}</em>
            ))}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.05 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
            >
              {t.viewWork}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              href="/book"
              className="group inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors hover:border-lime/40 hover:bg-lime/5"
            >
              {bookSession}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href={profile.resume}
              download
              className="group inline-flex items-center gap-2 px-2 py-3.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="size-4" />
              <span className="link-underline">{t.resume}</span>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <AvatarStage />
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
          {t.scroll}
        </span>
      </div>
    </section>
  );
}
