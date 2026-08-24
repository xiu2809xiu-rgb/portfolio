'use client';

import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { profile } from '@/content/profile';
import { LanyardBadge } from './LanyardBadge';

/**
 * Closing call to action, with the draggable ID badge alongside it.
 *
 * The badge replaced a WebGL grid background here rather than joining it: one
 * canvas per section keeps the live WebGL context count down, and a physics
 * badge carrying real contact details earns the slot more than an ambient
 * backdrop did.
 */
export function ContactSection() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
      {/* Ambient wash, replacing the canvas that used to sit here. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,rgba(180,255,57,0.10),transparent_60%),radial-gradient(ellipse_at_80%_-10%,rgba(57,255,216,0.07),transparent_55%)]"
      />

      <div className="wrap grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <Reveal>
            <p className="eyebrow">08 — Contact</p>
            <h2 className="mt-5 font-heading text-[clamp(2.25rem,7vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Let&rsquo;s build{' '}
              <span className="font-serif font-light italic text-lime">something great.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              Currently open to internships, collaborations, or just a good conversation about
              code. The fastest way to reach me is to put something in my calendar.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-start">
              {profile.socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    className="link-underline font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                    {...(social.external
                      ? { target: '_blank', rel: 'noreferrer noopener' }
                      : {})}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <LanyardBadge />
      </div>
    </section>
  );
}
