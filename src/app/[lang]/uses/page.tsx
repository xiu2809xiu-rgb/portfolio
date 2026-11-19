import type { Metadata } from 'next';
import { Reveal } from '@/components/common/Reveal';
import { usesCategories, usesIntro } from '@/content/uses';

export const metadata: Metadata = {
  title: 'Uses',
  description:
    'The editor, stack, hardware, and keyboard shortcuts I actually use every day.',
  alternates: { canonical: '/uses' },
};

export default function UsesPage() {
  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">~/richie/uses</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          What I <span className="text-gradient-lime">actually use</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {usesIntro}
        </p>
      </header>

      <div className="mt-16 space-y-12">
        {usesCategories.map((category, index) => (
          <Reveal key={category.name} delay={index * 0.06}>
            <section>
              <h2 className="flex items-center gap-3 border-b border-hairline pb-4 font-heading text-xl font-bold tracking-tight">
                <span className="text-2xl" aria-hidden>
                  {category.icon}
                </span>
                {category.name}
              </h2>

              <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {category.entries.map((entry) => (
                  <div key={entry.name} className="flex flex-col gap-1">
                    <dt className="font-mono text-sm font-bold text-lime">{entry.name}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">
                      {entry.note}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
