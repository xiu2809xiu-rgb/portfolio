'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { InViewMount } from '@/components/common/InViewMount';
import { Reveal } from '@/components/common/Reveal';
import { profile } from '@/content/profile';

const GridRise = dynamic(() => import('@/components/react-bits/grid-rise'), {
  ssr: false,
});

export function ContactSection() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
      {/* Gated so its WebGL context only exists while the section is on screen. */}
      <div className="absolute inset-0 -z-10 opacity-45">
        <InViewMount rootMargin="200px">
          <GridRise
            color="#0b0e13"
            accent="#b4ff39"
            background="#05070a"
            cellSize={0.42}
            gap={0.08}
            amplitude={0.22}
            accentStrength={0.7}
            speed={0.25}
            maxFps={40}
            haze={0.35}
          />
        </InViewMount>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05070a] via-transparent to-[#05070a]" />

      <div className="wrap text-center">
        <Reveal>
          <p className="eyebrow">08 — Contact</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Let&rsquo;s build{' '}
            <span className="font-serif font-light italic text-lime">something great.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Currently open to internships, collaborations, or just a good conversation about
            code. The fastest way to reach me is to put something in my calendar.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
            >
              Book a session
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <a
              href={profile.resume}
              download
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-7 py-4 font-mono text-xs uppercase tracking-widest transition-colors hover:border-lime/40 hover:bg-lime/5"
            >
              <Download className="size-4" />
              Résumé
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {profile.socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  className="link-underline font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                  {...(social.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
