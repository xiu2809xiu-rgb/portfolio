'use client';

import { useEffect, useRef, useState } from 'react';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { skillGroups } from '@/content/resume';
import { cn } from '@/lib/utils';

/** Animates a proficiency bar to its target width once it scrolls into view. */
function SkillBar({ name, value, delay }: { name: string; value: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setFilled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="w-24 shrink-0 font-mono text-[0.68rem] text-muted-foreground">{name}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime to-aqua transition-[width] duration-1000 ease-out"
          style={{ width: filled ? `${value}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-[0.68rem] text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

export function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading
          index="02"
          title="Skills"
          description="What I can build with today, and roughly how confident I am with each. The percentages are self-assessed, not certified — treat them as a starting point for a conversation."
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, index) => (
            <Reveal as="li" key={group.name} delay={index * 0.06}>
              <div
                className={cn(
                  'glass glass-hover h-full rounded-2xl p-6',
                  'flex flex-col',
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {group.icon}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold tracking-tight">
                  {group.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                {group.levels ? (
                  <div className="mt-5 space-y-2.5 border-t border-hairline pt-5">
                    {group.levels.map((level, levelIndex) => (
                      <SkillBar
                        key={level.name}
                        name={level.name}
                        value={level.value}
                        delay={levelIndex * 120}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
