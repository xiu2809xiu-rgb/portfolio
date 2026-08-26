'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { InViewMount } from '@/components/common/InViewMount';
import StaggeredText from '@/components/react-bits/staggered-text';
import { heroRotation, profile } from '@/content/profile';
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

export function HeroSection() {
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

          <h1 className="font-heading text-[clamp(2.5rem,9vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
            <StaggeredText
              text="Full-stack"
              as="span"
              className="block"
              segmentBy="words"
              delay={0.25}
              duration={0.8}
              direction="bottom"
              blur
            />
            <StaggeredText
              text="developer,"
              as="span"
              className="text-stroke block"
              segmentBy="words"
              delay={0.4}
              duration={0.8}
              direction="bottom"
              blur
            />
            <StaggeredText
              text="UX designer."
              as="span"
              className="block text-gradient-lime"
              segmentBy="words"
              delay={0.55}
              duration={0.8}
              direction="bottom"
              blur
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Diploma in Information Technology at Nanyang Polytechnic, specialising in{' '}
            <RotatingWord words={heroRotation} className="text-lime" />. First place at the{' '}
            <em className="font-serif text-foreground">NYP × AWS Hackathon 2026</em>. Seeking a
            2027 software engineering internship in Singapore.
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
              View my work
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              href="/book"
              className="group inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors hover:border-lime/40 hover:bg-lime/5"
            >
              Book a session
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href={profile.resume}
              download
              className="group inline-flex items-center gap-2 px-2 py-3.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="size-4" />
              <span className="link-underline">Résumé</span>
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
          Scroll
        </span>
      </div>
    </section>
  );
}
