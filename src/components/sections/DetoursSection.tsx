import Link from 'next/link';
import { ArrowUpRight, Car, Megaphone } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { cn } from '@/lib/utils';

/**
 * The two pages that are not part of the portfolio proper.
 *
 * Placed immediately after the work carousel on purpose. The driving world is
 * another way to look at the same projects — you arrive at each one through a
 * gate rather than a card — so this sits where a visitor has just finished
 * looking at them and might want a second pass at it differently.
 *
 * Deliberately not in the header. Someone arriving to read a CV should meet the
 * CV first; this is an offer made after the work has already spoken, which is
 * also why it is worded as a detour rather than a feature.
 */

const detours = [
  {
    href: '/drive',
    icon: Car,
    eyebrow: 'Interactive',
    title: 'Take the car out',
    body:
      'A town with a ring road, a real day and night cycle, and my projects behind six gates. Written with its own suspension and tyre model, because the physics engine’s built-in one would not drive.',
    meta: 'WASD · about 2 MB · loads only if you ask',
  },
  {
    href: '/pitch',
    icon: Megaphone,
    eyebrow: 'A joke with a CV inside it',
    title: 'The pitch',
    body:
      'One slider, fifty positions, from “so, yeah, I write software” to a page actively shouting at you. Every claim on it is true — only the volume changes.',
    meta: 'Drag the dial · find where it tips',
  },
] as const;

export function DetoursSection() {
  return (
    <section id="detours" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">Detours</p>
          <h2 className="mt-4 max-w-2xl font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Two things that are <span className="text-gradient-lime">not</span> a portfolio
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Built for the fun of it, and because a site that only lists work tells you nothing about
            how someone builds. Neither is on the critical path — both load only when opened.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {detours.map((detour, index) => (
            <Reveal key={detour.href} delay={index * 0.08}>
              <li>
                <Link
                  href={detour.href}
                  className={cn(
                    'group flex h-full flex-col rounded-2xl border border-hairline bg-white/[0.02] p-7',
                    'transition-colors hover:border-lime/50 hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <detour.icon className="size-6 text-lime" />
                    <ArrowUpRight
                      className={cn(
                        'size-5 shrink-0 text-muted-foreground transition-all',
                        'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime',
                      )}
                    />
                  </div>

                  <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {detour.eyebrow}
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-bold tracking-tight">
                    {detour.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {detour.body}
                  </p>
                  <p className="mt-5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {detour.meta}
                  </p>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
